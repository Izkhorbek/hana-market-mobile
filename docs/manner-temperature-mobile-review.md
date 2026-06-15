# Manner Temperature — Mobile Architecture Review (Stage 1)

> Date: 2026-06-15 · App: `nebor-app` (Hana Market mobile, Expo Router + TS)
> **Stage 1 = analysis only. No code was changed.** Phase 1 goal = silent data collection; no public
> temperature UI yet (behind a feature flag).

---

## 1. Current architecture summary

**Stack:** Expo Router (file-based routing), React 19 / RN 0.81, TanStack Query v5, Zustand v5,
axios, `react-i18next` (+ `i18n-js`), `@microsoft/signalr` (chat), Sentry. Path alias `@/* → ./*`
(`tsconfig.json`), root-level folders (no `src/`).

### API client (`api/api.ts`)
- Single shared axios instance (`api/api.ts:43-49`), default-exported. `baseURL = API_URL` (currently
  hardcoded to `DEV_API_URL_FALLBACK` at `:23`; normally `EXPO_PUBLIC_API_URL`).
- **Auth injection** via request interceptor: `Authorization: Bearer ${getAuthToken()}` (`:52-63`).
- **Refresh-token behavior**: response interceptor does single-flight refresh on `401` then retries the
  original request; on failure → `authLogoutSessionExpired()` (`:80-149`). This is global — any new
  endpoint using this instance inherits token injection + refresh automatically.
- **Telemetry/error logging**: non-401 errors logged to Sentry/telemetry in the interceptor; the
  interceptor **re-rejects**, so per-call `onError` still runs.
- **Error parsing**: `utils/apiError.ts → parseApiError(error, fallback)` reads string/`{message}`/.NET
  `ValidationProblemDetails`/RFC7807 bodies. It does **not** branch on status codes — status mapping is
  done at the call site (see §5).

### Data layer (services + hooks)
- **Services** (`api/services/*.service.ts`): plain object of arrow fns returning the **raw axios
  promise** typed `axiosInstance.post<ApiResponse<T>>(ENDPOINT.X, body)`. Endpoints in
  `api/endpoints.ts` (default-exported `ENDPOINT` object; static = string, param = function).
- **Hooks** (`api/hooks/use*.ts`): thin TanStack wrappers. Mutations: `useMutation<AxiosResponse<ApiResponse<T>>, Error, TInput>({ mutationFn, ...options })`.
  Queries gate on auth: `enabled: useAuthStore(s => s.isAuthenticated)`.
- **`ApiResponse<T>`** (`types/index.ts:18-24`): `{ success, message?, data?, errors: string[], status_code }`.
- **Backend field convention is snake_case** (e.g. `report_id`, `manner_temperature`, `review_count`).
  ⚠️ See Risk R1 — the requested mobile request type is camelCase but the backend expects snake_case.

### State (Zustand, under `modules/`)
- `modules/Auth/auth-store.ts → useAuthStore` (persisted). Current user: `useAuthStore(s => s.user?.id)`
  → the **reviewer id**. `User.id: number` (`auth-store.ts:21-37`).
- `modules/Chat/chat-store.ts → useChatStore` (chat list/messages/online, `lastRemovedChatRoomId`).

---

## 2. Recommended integration points

| Concern | Location | Approach |
|---|---|---|
| Endpoints | `api/endpoints.ts` | add a `MANNER` block (mirror `REPORT`/`CHAT`) |
| Types | `types/index.ts` | add request/response interfaces (responses snake_case) |
| Service | `api/services/manner.service.ts` (new) | mirror `report.service.ts`; **map camel→snake in the POST body** |
| Service barrel | `api/services/index.ts` | export the new service (note: `report.service` was omitted here — don't repeat) |
| Hooks | `api/hooks/useManner.ts` (new) | mirror `useReport.ts` (`useCreateMannerReviewMutation`, gated summary/reviews/events queries) |
| Feature flags | `constants/featureFlags.ts` (new) | plain booleans (no `src/`; sits beside `constants/localization.ts`) |
| Modal UI | `components/manner/MannerReviewModal.tsx` (new) | clone the `ComplaintModal` slide-sheet pattern |
| Entry point | `app/chat/[id].tsx` | extend the existing 3-dot `handleMore` `Alert.alert` to add a **"Leave feedback"** action; add modal state + render. Surgical — no screen rewrite |
| i18n | `locales/uz.json`, `ru.json`, `en.json` | add a new top-level `mannerReview` section (sibling of `complaint`) |

### Chat detail wiring facts (`app/chat/[id].tsx`)
- `chatRoomId` = `parseInt(useLocalSearchParams().id)` (`:476-477`).
- reviewer = `currentUserId = useAuthStore(s => s.user?.id)` (`:502`).
- **target** = the other participant: `chatData.otherUserId` / `otherUserId` memo (`:535-539`, `:846/878`).
- 3-dot menu = `ChatHeader` `MoreVertical` → `handleMore` (`:926-940`), currently a single delete
  `Alert.alert`. Add a `{ text: t('mannerReview.entry'), onPress: openMannerModal }` button to that array.
- Remote room removal handled via `lastRemovedChatRoomId` (`:577-600`). There is **no "blocked" field**;
  "sold" gates input only (`:1169`). So the frontend gate is: flag on + `currentUserId` known +
  `otherUserId` known + `currentUserId !== otherUserId` + room not in removed state.

### Product / seller area (for FUTURE public UI only — not now)
- `app/product/[id].tsx` and `app/product/seller/[sellerId].tsx` hold the seller id (`sellerId` route
  param / product `user_id`). `components/shared/Cards/ProductCard.tsx` is the product card.
- These are the future homes for a temperature badge — **left untouched in Phase 1**.

### Modal / theme / i18n patterns to reuse
- Modal: `components/shared/ComplaintModal.tsx` — RN `<Modal transparent animationType="none">` +
  `Animated` slide, `isMountedRef` guard, `isPending` disables submit, success `Alert.alert`, status
  mapping for errors. Props `{ visible, onClose, ...ids }`.
- Theme: `const colors = useThemeColors()` (`hooks/use-theme-colors.ts`) → `colors.background/text/primaryColor/borderColor/textMuted/card/icon`. Dark mode follows system `useColorScheme()`.
- i18n: `const { t } = useTranslations()` (`hooks/use-translation.ts`); non-component code uses
  `i18n` from `@/constants/localization`. snake_case keys, one nesting level, dot-addressed.

---

## 3. Files to modify (Stage 2)

**New:** `api/services/manner.service.ts`, `api/hooks/useManner.ts`, `constants/featureFlags.ts`,
`components/manner/MannerReviewModal.tsx`, `docs/manner-temperature-mobile-implementation-report.md`.
**Edit (additive only):** `api/endpoints.ts`, `api/services/index.ts`, `types/index.ts`,
`locales/uz.json`, `locales/ru.json`, `locales/en.json`, `app/chat/[id].tsx`.

Nothing in product/auth/navigation/chat-send/read/SignalR logic changes.

---

## 4. Risks

- **R1 — camelCase vs snake_case (highest):** the spec's `CreateMannerReviewRequest` is camelCase
  (`chatRoomId`, `targetUserId`, `isPolite`…), but the backend DTO is snake_case
  (`chat_room_id`, `target_user_id`, `is_polite`…). The service **must** map the camelCase request to a
  snake_case body before POST, or the backend returns 400. Responses are snake_case
  (`manner_temperature`, `review_count`) — response types reflect that.
- **R2 — editing `app/chat/[id].tsx`:** large, complex screen. Mitigation: only add (a) a modal
  `visible` state, (b) one button in the existing `handleMore` Alert, (c) a `<MannerReviewModal>` render.
  No edits to message send/read/delete/SignalR paths.
- **R3 — locale JSON validity:** malformed JSON breaks i18n for the whole app. Mitigation: add the
  `mannerReview` block carefully (comma after the now-non-last `complaint` block) and run typecheck/app start.
- **R4 — accidental public exposure:** ensure `mannerTemperaturePublicUiEnabled = false` truly gates any
  summary fetch; do **not** call the summary API by default. No badge on card/profile/seller/chat header.
- **R5 — `targetUserId` may be undefined** before chat data loads → hide the entry point until known.
- **R6 — duplicate submit / unmount races:** reuse ComplaintModal's `isPending` + `isMountedRef` guards.

---

## 5. Exact implementation plan (Stage 2)

1. **Endpoints** — `api/endpoints.ts`, add:
   ```ts
   MANNER: {
     REVIEWS: 'manner-temperature/reviews',
     SUMMARY: (userId) => `manner-temperature/users/${userId}/summary`,
     USER_REVIEWS: (userId) => `manner-temperature/users/${userId}/reviews`,
     EVENTS: (userId) => `manner-temperature/users/${userId}/events`,
   },
   ```
2. **Types** — `types/index.ts`: `CreateMannerReviewRequest` (camelCase, app-facing),
   `CreateMannerReviewResponse`, `MannerTemperatureSummaryResponse`, `MannerReviewResponse`,
   `MannerEventResponse` (responses snake_case to match server).
3. **Service** — `manner.service.ts`: `createMannerReview` maps camel→snake body then
   `post<ApiResponse<CreateMannerReviewResponse>>(ENDPOINT.MANNER.REVIEWS, snakeBody)`; `getMannerSummary/Reviews/Events` GETs.
4. **Hooks** — `useManner.ts`: `useCreateMannerReviewMutation` (mirror `useCreateReportMutation`);
   `useMannerSummaryQuery` etc. **gated `enabled: isAuthorized && featureFlags.mannerTemperaturePublicUiEnabled`** so summary is not fetched while public UI is off.
5. **Feature flags** — `constants/featureFlags.ts`: `mannerTemperatureCollectionEnabled = true`,
   `mannerTemperaturePublicUiEnabled = false`.
6. **Modal** — `components/manner/MannerReviewModal.tsx`: clone ComplaintModal; rating 1–5, 4 positive +
   3 negative tags, optional comment (max 500), submit/cancel; `isPending` guards; on success close +
   success alert; error mapping: `409`→"already left feedback", `403`→"cannot review", `400`→backend
   message via `parseApiError`, `401`→auth message, `5xx`/network→existing patterns.
7. **Chat entry point** — `app/chat/[id].tsx`: add `mannerModalVisible` state; in `handleMore` push a
   "Leave feedback" button when `featureFlags.mannerTemperatureCollectionEnabled && currentUserId &&
   otherUserId && currentUserId !== otherUserId`; render `<MannerReviewModal chatRoomId targetUserId visible onClose />`.
8. **i18n** — add `mannerReview` block to all three locales with the provided UZ/RU strings (+ EN).
9. **No public UI** — do not touch product card, seller screen, profile, or chat header visuals.
10. **Verify** — `expo lint` / `tsc --noEmit` (typecheck), app start; run the test checklist; confirm no
    temperature is visible anywhere and chat send/read/delete still work.

> Proceed to Stage 2 only after this review is accepted.
