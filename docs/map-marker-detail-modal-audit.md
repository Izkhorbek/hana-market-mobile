# Map Marker → MarkerDetailModal: Flicker / Reset Audit

**Stage 1 — root-cause report (no code changed yet).**
**Date:** 2026-06-30
**Symptom:** Tapping a product marker should open `MarkerDetailModal` with the selected product. Instead the modal content flickers / "resets" / appears to lose the selected data while opening and while the detail loads.

## Files inspected
- `app/(tabs)/map.tsx`
- `components/Maps/GoogleMap.tsx`
- `components/Maps/ProductMapMarker.tsx`
- `components/Maps/MarkerDetailModal.tsx`
- `components/ui/bottom-sheet.tsx` (the actual mount/animation owner)
- `api/hooks/useProduct.ts`
- `types/index.ts`

## Current data flow (as built today)
1. `map.tsx` fetches `useProductMapMarkersQuery` → `ProductMapMarkerDto[]`.
2. `ProductMapMarkerDto` has since been **expanded** and now carries: `price, is_free, is_negotiable, category_id, product_type, product_type_name, currency_type, distance, created_ago` (plus id/coords/title/image). It is no longer "minimal".
3. `productMarkers` (memoized) maps each DTO → `MarkerData` filling `categoryTag`, `distance`, `features` — but **not** `category`.
4. `allMarkers` (memoized) = `[highlightedMarker?, ...productMarkers]` → `GoogleMap` → `ProductMapMarker` (memoized).
5. Tap → `GoogleMap.handleMarkerPress` (stable, ref-based) → `map.tsx.handleMarkerPress(marker)` → `setSelectedMarker(marker)` + `setIsModalVisible(true)`.
6. `MarkerDetailModal` renders from `selectedMarker`, and **separately lazily fetches full product detail** via `useProductQuery`, then computes `displayCategory/displayCategoryTag/displayDistance/displayFeatures` with a `detail ? detailValue : markerValue` ternary.

## Audit answers (the 12 questions)
1. **Selected-marker state:** `useState<MarkerData|null>` in `map.tsx`. Holds the object passed from the marker press. OK.
2. **Object into GoogleMap:** `allMarkers` (memoized array of `MarkerData`). Stable across selection.
3. **What ProductMapMarker passes onPress:** the same `MarkerData` reference from `allMarkers` (`onPress(marker)`), routed through a ref-stable handler. Stable reference. OK.
4. **Marker id type:** `string | number` (`MarkerData.id`). Product markers = `number` (DTO `id`); highlighted = `'target-location'` (string).
5. **Highlighted vs product ids:** confirmed — highlighted marker has **string** id, product markers have **numeric** id.
6. **Does the modal get stable selected-marker props?** Yes. `selectedMarker` is a stable ref (memoized `allMarkers` is not rebuilt on selection). Not a reference-instability bug.
7. **Does the modal close/reset while detail loads?** It does **not** close, but it **visually resets**: see root cause below.
8. **Is lazy `useProductQuery` enabled only for numeric ids?** Yes — `productId = typeof marker?.id === 'number' ? marker.id : 0`, `enabled: isVisible && productId > 0`. Target-location → `productId = 0` → disabled. Correct.
9. **Does detail loading replace lightweight info too aggressively?** **YES — this is the primary bug.** See below.
10. **Do query result changes cause a modal remount?** No remount, but they cause a **content swap** (re-render with different values).
11. **Do key / conditional render / isVisible cause unmount/remount?** **YES on close** (secondary bug). The modal has `if (!marker) return null`; on close `map.tsx` nulls `selectedMarker` at the same instant it hides the sheet, so the whole `BottomSheet` unmounts synchronously and its close animation never plays. No `key` prop is involved.
12. **Is the marker array rebuilt every render (ref mismatch)?** No. `allMarkers`/`productMarkers` are memoized; selection state changes don't rebuild them.

## Root cause

### Primary — destructive enrichment (flicker / data loss while loading)
`MarkerDetailModal` computes:
```ts
const displayCategoryTag = detail ? (detail.is_free ? t('post.free') : detail.price) : marker?.categoryTag
const displayFeatures   = detail ? [detail.is_negotiable ? t('post.can_deal') : '', detail.created_ago || ''].filter(Boolean) : (marker?.features ?? [])
```
The condition is **`detail` is present**, not **the specific field is present**. The moment the async detail resolves, *every* field is recomputed from `detail` in a single render:
- If `detail.price` is empty / `is_free` false-with-no-price → the tag that was correctly showing the lightweight price **blanks out**.
- If `detail` has no `is_negotiable` / `created_ago` → the features row that was populated from the marker **disappears / reflows**.
- `category` separately pops from the `'Category'` placeholder to a real value because `marker.category` was never mapped.

That undefined→defined transition is the visible "flicker / reset / loses selected data while opening/loading." Because the lightweight DTO now already contains these fields, the lazy fetch is overwriting good data with (sometimes empty) detail data.

### Secondary — unmount-on-close kills the close animation
`bottom-sheet.tsx` owns its own open/close animation and an internal `modalVisible` state driven by the `isVisible` prop (fade `opacity` to 0, then `setModalVisible(false)`). But `MarkerDetailModal`'s `if (!marker) return null` unmounts the entire `BottomSheet` the instant `selectedMarker` becomes `null` on close — so the close animation is discarded and the sheet vanishes abruptly, and the next open is a full remount.

### Build break found during audit
`ProductMapMarkerDto` was expanded and **`MarkerData.description` was removed**, but `ProductMapMarker.tsx:48` still reads `marker.description`:
```
components/Maps/ProductMapMarker.tsx(48,27): error TS2339: Property 'description' does not exist on type 'MarkerData'.
```
The repo **does not currently compile**. (`map.tsx`'s highlighted marker still sets `description`, confirming the field removal was incomplete.)

## Reproduction path
1. Open map. 2. Tap a product marker. 3. Modal opens showing lightweight price/distance/features. 4. ~100–400 ms later detail resolves → tag/features change or briefly blank, category pops in (**flicker / data loss**). 5. Tap close → sheet disappears with no animation (**abrupt**), next open re-mounts. 6. Independently: `tsc` fails on `ProductMapMarker.description`.

## Minimal fix plan (Stage 2)
1. **Make enrichment additive (per-field coalesce):** detail overrides a field **only when that field actually has a value**; otherwise keep the lightweight marker value. No field can blank during/after loading. → kills the flicker / data loss.
2. **Map `category` from `product_type_name`** in `map.tsx` so category shows immediately (no placeholder pop).
3. **Keep the modal mounted during close** via a sticky "last marker" ref so `BottomSheet` animates closed via `isVisible` instead of being torn down — no remount.
4. **Small, scoped loading/error affordance:** a tiny inline indicator while enriching and a small retry on error; lightweight data stays visible on failure (falls out of #1 automatically).
5. **Remove the per-render `console.log`** in the modal.
6. **Restore `description?: string` on `MarkerData`** to fix the compile error *without touching* the perf-optimized `ProductMapMarker.tsx`.

### Explicitly out of scope / preserved
- No backend / endpoint-contract changes (DTO consumed as-is).
- `ProductMapMarker` perf optimization (`React.memo`, `tracksViewChanges`) untouched.
- Home / Search / Auth / image-prefetch untouched.
- `useProductQuery` enable-guard already correct (`isVisible && numericProductId > 0`) — kept.
