# Guidance Modals — Implementation Report

> Date: 2026-06-15 · App: `nebor-app` (Hana Market mobile).
> Reusable, one-time user-guidance modals added without changing create-post submit/validation logic
> or any API behavior. Not committed.

---

## 1. Files changed

**New**
- `services/storage/guidanceStorage.ts` — AsyncStorage helper for the "seen" flags.
- `components/guidance/ListingGuideModal.tsx` — per-type listing tips (slide sheet).
- `components/guidance/SuccessPostModal.tsx` — post-success dialog.
- `components/guidance/WelcomeModal.tsx` — one-time home welcome.
- `docs/guidance-modals-implementation-report.md` — this report.

**Edited (additive)**
- `app/(post)/create.tsx` — renders `ListingGuideModal` keyed by the selected category.
- `components/Forms/CreateThingForm.tsx`, `CreateCarForm.tsx`, `CreateWorksForm.tsx` — `onSuccess` now
  shows `SuccessPostModal` (was a plain `Alert`); added 2 state vars + modal render each.
- `app/(tabs)/home.tsx` — renders `WelcomeModal` (gated so it never stacks on the report/category modals).
- `locales/uz.json`, `locales/ru.json`, `locales/en.json` — added a `guidance` section.

## 2. Where each modal appears

| Modal | Screen | Trigger | Frequency |
|-------|--------|---------|-----------|
| `ListingGuideModal` | Create post (`app/(post)/create.tsx`) | On screen open / when switching category, per type | **Once per listing type** (thing/car/work) |
| `SuccessPostModal` | The 3 create forms | **Only on `useCreateProductMutation` `onSuccess`** | Every successful post |
| `WelcomeModal` | Home (`app/(tabs)/home.tsx`) | On home mount, if not seen and no critical modal open | **Once ever** |

- `ListingGuideModal` closes with **"Tushunarli" / "Понятно" / "Got it"**, then persists the seen flag.
- `SuccessPostModal` shows **"View listing"** only when a product id is available (see §5), and
  **"Go home / Close"** which runs the form's original `router.back()` navigation.
- `WelcomeModal` greets by `username`, falling back to `phone_number`, then a no-name variant.

## 3. Storage keys (`services/storage/guidanceStorage.ts`)

`listing_guide_seen_thing`, `listing_guide_seen_car`, `listing_guide_seen_work`, `home_welcome_seen`
(stored as `'true'` via `@react-native-async-storage/async-storage`).

**Failure policy:** read errors → treated as "seen" (the guide simply won't pop), write errors are
logged and swallowed. Storage problems can never block a screen.

## 4. Safety / re-render protection

- Each self-managed modal opens **at most once per mount** via a `useRef` guard
  (`handledTypeRef` / `handledRef`), so re-renders or prop toggles don't re-open it.
- `isMountedRef` guards every post-async `setState` (no state updates after unmount).
- `SuccessPostModal` is fully controlled by the form's `visible` state — shown only inside `onSuccess`,
  never on error.
- `WelcomeModal` is gated with `active={!reportModalVisible && !sheetVisible}` so it won't appear over
  the home report/category modals.

## 5. Product id for "View listing"

The create endpoint currently returns `ApiResponse<object>` (**no product id**). The forms read
`response.data.data.product_id` **defensively** (`?? null`); when absent, `SuccessPostModal` hides the
"View listing" button and shows only "Go home". If the backend later includes `product_id`, the button
appears automatically with no further change.

## 6. Localization

Added a `guidance` block (`understood`, `listing.title` + 6 `tip_*`, `success.*`, `welcome.*` with a
`{{name}}` interpolation) to **uz / ru / en**, following the existing nested-section convention. The
6 listing tips cover: clear+bright photo, product centered, first image best, real product image,
clear title, useful description.

## 7. Test checklist

- [ ] First time opening Create (Thing) → tips sheet appears; tap "Tushunarli" → closes & won't reappear.
- [ ] Switch to Car / Work → each shows its own tips once; revisiting a seen type shows nothing.
- [ ] Submit a valid listing → `SuccessPostModal` appears (NOT on validation/API error).
- [ ] "Go home / Close" → returns via the original `router.back()`.
- [ ] "View listing" hidden (no product id from API today); appears if/when the API returns one.
- [ ] First Home visit → `WelcomeModal` greets by username/phone; close → never repeats.
- [ ] Welcome does not appear while the report modal or category sheet is open.
- [ ] Kill & relaunch → none of the one-time modals reappear (flags persisted).
- [ ] Dark mode: all three modals themed via `useThemeColors`.
- [ ] Uzbek & Russian: all strings localized (no raw keys); name interpolation works.
- [ ] Create form submit / loading spinner / validation messages behave exactly as before.

## 8. Intentionally NOT changed

- Create form **submit/loading/validation logic** (FormData build, `useCreateProductMutation` call,
  `isPending`, `onError`, field validation) — untouched; only the success *presentation* changed
  (Alert → modal) and `form.reset()` is preserved.
- No API/endpoint/service changes; no navigation restructuring (success still `router.back()`).
- **Manner Temperature** code — untouched. Auth / chat / product API code — untouched.

## 9. Verification

- Locale JSON (uz/ru/en): **valid**.
- `npx tsc --noEmit`: **0 errors**.
- `npx expo lint`: **passed (exit 0)**, no warnings on new/changed files.
- Native/EAS build not run here (no device in this environment); typecheck + lint cover the change.
