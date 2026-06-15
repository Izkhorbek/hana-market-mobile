# Guidance Modals — QA Review

> Date: 2026-06-16 · App: `nebor-app`
> Scope: `ListingGuideModal`, `SuccessPostModal`, `WelcomeModal`, `guidanceStorage`, and their
> integration in `app/(post)/create.tsx`, `app/(tabs)/home.tsx`, and the three create forms.
> Baseline: `tsc --noEmit` = 0 errors, `expo lint` = pass, locale JSON valid (15/15/15 leaf keys).

> **Update 2026-06-16 — remediation applied.** M1 and M3 fixed in code; M2 verified end-to-end after
> the backend change. Post-fix `tsc --noEmit` = 0 errors and `expo lint` = pass. All three Medium items
> are now resolved. Remaining open items are Low-only (polish). Original findings are kept below for the
> record with a **RESOLVED / VERIFIED** note each.

---

## Summary

No blockers found. The implementation is sound: async paths are mount-guarded, one-time logic uses
`useRef` guards, and create-form submit/validation/loading logic is untouched. The three Medium items
have since been remediated (see per-item notes). Counts: **Blockers 0 · High 0 · Medium 0 open (3
resolved) · Low 5**.

---

## Blockers
None.

---

## High risk
None.

---

## Medium risk (all resolved)

### M1 — Welcome modal can stack with app-level first-launch modals — ✅ RESOLVED
`WelcomeModal` is gated only against the Home screen's own modals:
`app/(tabs)/home.tsx` → `<WelcomeModal active={!reportModalVisible && !sheetVisible} />`.
It does not know about app-level overlays that can appear on first Home load — e.g. notification-permission
prompts, `LocationMismatchModal`, network/offline banners, or any update prompt. On a first launch
(`home_welcome_seen` unset) the welcome can appear over/under one of those.
- Evidence: `components/guidance/WelcomeModal.tsx` opens purely on mount when `active && !seen`; the gate
  references only `reportModalVisible`/`sheetVisible`.
- Impact: two modals visible at once on first launch (cosmetic/confusing, not a crash).
- **Resolution:** `WelcomeModal` now opens via `useFocusEffect` with an 800ms `delayMs` settle window,
  and **re-checks `active` when the delay fires** — if a Home modal opened during the delay it skips and
  retries on the next focus/active change instead of stacking. `handledRef`/`isMountedRef` still ensure
  once-only and no setState-after-unmount. Home keeps `active={!reportModalVisible && !sheetVisible}`.
  (`components/guidance/WelcomeModal.tsx`.)

### M2 — "View listing" navigation leaves the create screen on the stack — ✅ VERIFIED (backend now returns id)
In each form the success modal does:
`onViewListing={(id) => { setSuccessVisible(false); router.push(`/product/${id}`) }}` and
`onClose={() => { setSuccessVisible(false); router.back() }}`.
"View listing" pushes the product screen **without** popping the create screen, so the back stack becomes
`… → create → product`; pressing back returns to the (reset) create form rather than the list/home.
- Evidence: `components/Forms/CreateThingForm.tsx`, `CreateCarForm.tsx`, `CreateWorksForm.tsx` (success
  modal render block).
- **Now ACTIVE & verified:** the backend create endpoint returns
  `ApiResponse<object>(new { product_id = productId }, "Successfully created")`
  (`hanamarket/Controllers/Product/ProductController.cs:213`), which matches exactly what the mobile
  reads (`response.data.data.product_id`). So "View listing" now appears with the correct id — no mobile
  change was required. Fixed by the backend per the owner.
- **Remaining nav note (accepted, not changed):** "View listing" still uses `router.push('/product/${id}')`,
  so the back stack is `… → create → product` (back returns to the reset create form). The owner opted to
  keep this; switching to `router.replace` / pop-then-push remains a one-line future option if the
  back-to-create behavior is undesirable.

### M3 — Form `onSuccess` sets state without a mount guard
The forms now set React state in the mutation success handler:
`onSuccess: (response) => { form.reset(); setCreatedProductId(...); setSuccessVisible(true) }`.
If the user navigates away from the create screen while the create request is in flight, react-query still
invokes `onSuccess` after unmount, calling `setState` on an unmounted component.
- Evidence: the three `Create*Form.tsx` `onSuccess` blocks (no `isMountedRef` around these `setState`s).
- Impact: low in practice — React 19 (this app: `react@19.1.0`) removed the "setState on unmounted"
  warning, so it's effectively a no-op; no leak. The original code used `Alert.alert` (no `setState`), so
  this is a new-but-benign pattern. Flagged for awareness; a mounted guard would make it strictly correct.

---

## Low risk

### L1 — Rare guide re-show from `markSeen` write latency
`ListingGuideModal.closeSheet` persists with fire-and-forget `void guidanceStorage.markSeen(...)`. If a
user dismisses a type's guide and switches category and back **before** the async write flushes,
`hasSeen` may still return `false` and re-open the guide once.
- Evidence: `components/guidance/ListingGuideModal.tsx` (close handler) + `services/storage/guidanceStorage.ts`.
- Impact: at most one extra appearance; self-corrects once the write lands. The backdrop blocks category
  switching while the sheet is open, which already makes this very unlikely.

### L2 — `active` gate does not dismiss an already-open Welcome
`WelcomeModal`'s `active` prop only governs whether it may **open**; if it is already visible and a Home
modal opens afterward, the welcome stays up (its own `visible` state is independent).
- Evidence: `WelcomeModal.tsx` — `active` is read once in the open effect; `visible` is separate.
- Impact: minor; the welcome is dismissible and short-lived.

### L3 — Dialog cards use `colors.background` (not `colors.card`) over a dark overlay
`SuccessPostModal`/`WelcomeModal` cards and `ListingGuideModal` sheet use `colors.background`. In dark
mode the card background equals the screen background atop a `rgba(0,0,0,0.5)` overlay, and RN shadows are
invisible on Android dark; card edges can blend slightly.
- Evidence: the three components' `card`/`sheet` styles. (This matches the existing `ComplaintModal`
  pattern, so it's consistent, just not ideal.)
- Impact: cosmetic. Functionality and text contrast (themed `colors.text`/`subText`) are fine.

### L4 — One-time guards reset on screen remount (by design, storage-backed)
`handledTypeRef` (ListingGuide) and `handledRef` (Welcome) reset if the screen unmounts/remounts (e.g. tab
switches). Re-show is still prevented by the persisted flag, so behavior is correct — noted only so the
in-memory guard isn't mistaken for the source of truth.
- Evidence: refs are component-scoped; `guidanceStorage.hasSeen` is the durable gate.

### L5 — Pre-existing: `await createProduct(formData)` returns void
Forms contain `const productId = await createProduct(formData)` where `createProduct` is react-query's
`mutate` (returns `void`), so that local is always `undefined`. This is **pre-existing** (not introduced
by this work) and harmless because the success id is read from the `onSuccess(response)` payload instead.
- Evidence: e.g. `CreateCarForm.tsx` submit handler. Flagged only to confirm the modal does NOT rely on
  that local.

---

## Dimension-by-dimension verdict

| # | Area | Verdict | Key evidence |
|---|------|---------|--------------|
| 1 | AsyncStorage race conditions | OK (L1 only) | `guidanceStorage` get/set independent; opens guarded by `cancelled`/`isMountedRef`; fail-closed read |
| 2 | Modal double-open | OK | `handledTypeRef`/`handledRef` once-guards; success gated by `isPending` (+ `isSubmittingRef` in car); single form mounted at a time |
| 3 | Navigation side effects | M2 (dormant) | success `onClose`→`router.back()` preserves original nav; "View listing" push leaves create on stack (no id today) |
| 4 | Memory leaks | OK (M3 benign) | `isMountedRef` + `cancelled` in async modals; React 19 no unmount-setState warning |
| 5 | Dark mode | OK (L3) | all colors via `useThemeColors`; only `background` vs `card` polish |
| 6 | Localization | OK | guidance keys 15/15/15 across uz/ru/en; all referenced keys (`guidance.*`, `common.close`) exist; `{{name}}` interpolation valid |
| 7 | Home modal conflicts | M1 | gate covers only `reportModalVisible`/`sheetVisible`, not app-level modals |
| 8 | Create form regressions | OK | submit/validation/loading/`form.reset()` unchanged; only success presentation changed (Alert→modal); one `SuccessPostModal` per active form |

---

## Recommendation
Safe to proceed. Address **M1** before a public first-launch rollout (coordinate onboarding/permission
modals), and handle **M2** at the same time the backend begins returning a product id for "View listing".
M3/L1–L5 are optional polish. No code changes were made as part of this review.
