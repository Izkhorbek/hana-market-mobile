# Manner Temperature — Mobile Implementation Report (Stage 2)

> Date: 2026-06-15 · App: `nebor-app` · Phase 1 = **silent data collection only**.
> No public temperature UI. Existing product/chat/auth/navigation logic untouched. Not committed.

---

## 1. Files changed

**New**
- `constants/featureFlags.ts` — feature flags.
- `api/services/manner.service.ts` — API service (camelCase→snake_case mapping).
- `api/hooks/useManner.ts` — TanStack hooks (1 mutation + 3 gated read queries).
- `components/manner/MannerReviewModal.tsx` — the review bottom-sheet.
- `docs/manner-temperature-mobile-review.md` (Stage 1) and this report.

**Edited (additive only)**
- `api/endpoints.ts` — added `MANNER` endpoint block.
- `api/services/index.ts` — exported `manner.service`.
- `types/index.ts` — added 5 manner types.
- `app/chat/[id].tsx` — imports, one state var, an optional 3-dot menu action, modal render.
- `locales/uz.json`, `locales/ru.json`, `locales/en.json` — added a `mannerReview` section.

No edits to product APIs, auth flow, navigation, SignalR, or chat send/read/delete logic.

## 2. Feature flags (`constants/featureFlags.ts`)

```ts
mannerTemperatureCollectionEnabled = true   // Phase 1: review entry point ON
mannerTemperaturePublicUiEnabled  = false   // Phase 2: public temperature OFF
```
While `mannerTemperaturePublicUiEnabled` is `false`, the summary/reviews/events read hooks are
`enabled: false` and **never fetch** — no temperature data is requested or renderable.

## 3. API functions added

`api/services/manner.service.ts` (uses the shared axios instance → auth token + refresh + telemetry
inherited automatically):
- `createMannerReview(request)` → `POST manner-temperature/reviews`
- `getMannerSummary(userId)` → `GET …/users/{userId}/summary`
- `getMannerReviews(userId, params?)` → `GET …/users/{userId}/reviews`
- `getMannerEvents(userId, params?)` → `GET …/users/{userId}/events`

**Key mapping:** the app-facing request is camelCase (`chatRoomId`, `targetUserId`, `isPolite`…); the
service maps it to the backend's snake_case body (`chat_room_id`, `target_user_id`, `is_polite`…). The
server never receives camelCase, and components never see snake_case requests.

Hooks (`api/hooks/useManner.ts`): `useCreateMannerReviewMutation` (mirrors `useCreateReportMutation`);
`useMannerSummaryQuery` / `useMannerReviewsQuery` / `useMannerEventsQuery` — all gated behind the
public-UI flag + auth, so they no-op in Phase 1.

## 4. UI added

`components/manner/MannerReviewModal.tsx` — clones the production `ComplaintModal` slide-sheet pattern
(`useThemeColors` for dark mode, `useTranslations`, `Animated` slide, `isMountedRef` guard,
`isPending` disables inputs/submit, success alert then close). Contents:
- Rating 1–5 (stars).
- Positive tags: polite, fast response, on time, fair price.
- Negative tags: no show, rude, spam.
- Optional comment (max 500, live counter).
- Submit (disabled until a rating is chosen; prevents duplicate submit via `isPending`) + close.

**Error mapping** (status → friendly message): `409`→"already left feedback", `403`→"cannot review",
`401`→sign-in, `400`→backend message via `parseApiError` (eligibility), `5xx`→server, no-response→network.

## 5. Where the feedback button appears

Only in the **chat detail** screen's 3-dot (`MoreVertical`) menu (`app/chat/[id].tsx`):
- When eligible (flag on + known `currentUserId` + known `otherUserId` + not reviewing yourself), the
  3-dot opens a small action menu: **Leave feedback / Delete chat / Cancel**.
- When NOT eligible, the 3-dot behaves **exactly as before** — it goes straight to the original
  delete-chat confirmation (delete behavior and its confirm dialog are unchanged).
- Choosing "Leave feedback" opens `MannerReviewModal`; choosing "Delete chat" shows the original confirm.

The frontend keeps eligibility minimal; the backend enforces the real rules (≥3 messages, both sides
messaged, room ≥10 min old, no duplicates, no self-review) and the modal surfaces those as friendly errors.

## 6. Intentionally NOT shown yet (Phase 2)

No manner temperature anywhere public: **product cards, seller profile, profile screen, chat header**
are untouched. The read hooks exist but are flag-gated off, so nothing fetches or renders a temperature.

## 7. Test checklist

- [ ] Open a chat room → 3-dot shows "Leave feedback" (when other user known) alongside "Delete chat".
- [ ] Submit valid 5-star feedback → success message, modal closes.
- [ ] Submit again for same chat → **409** → "You already left feedback for this chat."
- [ ] Self-review not offered (entry hidden when `currentUserId === otherUserId`); backend also blocks (`400`).
- [ ] Too few messages / too-new room → friendly `400` eligibility message from backend.
- [ ] Airplane mode → network error message.
- [ ] Dark mode: sheet, stars, chips, text all themed (uses `useThemeColors`).
- [ ] Uzbek & Russian: all labels/messages localized (no raw keys).
- [ ] No temperature visible on product cards / profile / seller / chat header.
- [ ] Existing chat send / mark-as-read / delete message / delete room still work unchanged.

## 8. Build / verification

- Locale JSON (`uz`/`ru`/`en`): **valid** (parsed).
- `npx tsc --noEmit`: **0 errors**.
- `npx expo lint`: **passed (exit 0)**, no warnings on new/changed files.
- Native/EAS build not run here (no device/build in this environment); typecheck + lint cover the change.

## 9. Known limitations

- Entry point is the chat 3-dot menu (MVP). No automatic post-chat prompt (intentional — don't interrupt chatting).
- Eligibility on the client is minimal (flag + participants); the backend is the source of truth, so a
  user may tap "Leave feedback" and get a friendly "not eligible yet" if the room is too new / too quiet.
- `featureFlags` are compile-time booleans; no remote kill-switch yet (documented upgrade path: source
  from `app.config.ts` `extra`).
- Public temperature UI and the read hooks are implemented but dormant until `mannerTemperaturePublicUiEnabled` is flipped.

---

### Sign-off
- **Changed files:** 6 new + 6 edited (listed in §1).
- **Build/typecheck:** `tsc --noEmit` 0 errors; `expo lint` passed; locale JSON valid.
- **Public UI:** remains DISABLED (`mannerTemperaturePublicUiEnabled = false`; read hooks gated off).
- **Existing chat behavior:** untouched — delete/send/read/SignalR paths unchanged; the 3-dot falls back
  to the exact original delete flow when feedback isn't eligible.
