# Map Marker → MarkerDetailModal: Flicker / Reset Fix Report

**Stage 2 — implementation.** Companion to `docs/map-marker-detail-modal-audit.md`.
**Date:** 2026-06-30
**Status:** Implemented. `tsc` clean, `eslint` 0 errors. Not committed.

## Root cause (from audit)
1. **Primary — destructive enrichment.** `MarkerDetailModal` rendered display fields with a `detail ? detailValue : markerValue` ternary. When the lazy `useProductQuery` detail resolved, *every* field recomputed from `detail` in one render, blanking/reflowing fields the lightweight marker already had (price tag, features) and popping the category in — the visible "flicker / reset / loses selected data while loading."
2. **Secondary — unmount on close.** `if (!marker) return null` tore down the whole `BottomSheet` the instant `selectedMarker` became `null` on close, cutting off its close animation and forcing a full remount on the next open.
3. **Build break.** `MarkerData.description` had been removed while `ProductMapMarker.tsx:48` still read `marker.description` → `TS2304`/`TS2339`, repo didn't compile.

## Files changed
| File | Change |
|------|--------|
| `components/Maps/MarkerDetailModal.tsx` | Sticky `activeMarker` (last-marker ref) so the sheet stays mounted and animates closed; **additive per-field enrichment** (detail overrides only when it has a value); small inline spinner while enriching + a retry on enrichment failure; removed the per-render `console.log`; added `useRef` / `ActivityIndicator` imports. |
| `components/Maps/GoogleMap.tsx` | Restored `description?: string` on the `MarkerData` interface to fix the compile break **without touching** the perf-optimized `ProductMapMarker.tsx`. |
| `docs/map-marker-detail-modal-audit.md` | Stage 1 audit (new). |
| `docs/map-marker-detail-modal-fix-report.md` | This report (new). |

**Not touched:** `app/(tabs)/map.tsx` and `types/index.ts` (owned/edited by you during this session — the marker→`MarkerData` mapping and the `ProductMapMarkerDto` shape), `components/Maps/ProductMapMarker.tsx` (perf optimization preserved), backend / endpoint contract, Home / Search / Auth / image-prefetch.

## Exact fix

**1. Sticky marker — keep mounted, animate close (no remount):**
```ts
const lastMarkerRef = useRef<MarkerData | null>(null)
if (marker) lastMarkerRef.current = marker
const activeMarker = marker ?? lastMarkerRef.current
...
if (!activeMarker) return null            // was: if (!marker) return null
// BottomSheet is rendered with isVisible={isVisible}; closing animates instead of unmounting.
```

**2. Additive per-field enrichment — kills the flicker / data loss:**
```ts
const detailTag = detail ? (detail.is_free ? t('post.free') : detail.price) : undefined
const detailFeatures = detail
  ? [detail.is_negotiable ? t('post.can_deal') : '', detail.created_ago || ''].filter(Boolean)
  : []

const displayCategory    = detail?.product_type_name || activeMarker?.category
const displayCategoryTag  = detailTag || activeMarker?.categoryTag      // never blanks
const displayDistance     = detail?.distance || activeMarker?.distance
const displayFeatures     = detailFeatures.length > 0 ? detailFeatures : (activeMarker?.features ?? [])
```
A detail field replaces the lightweight value **only when it actually has one**; an empty or still-loading detail field can no longer wipe data the marker already provided.

**3. Lazy query guard (unchanged, confirmed correct):**
```ts
const productId = typeof activeMarker?.id === 'number' ? activeMarker.id : 0
useProductQuery({ id: productId, querySettings: { enabled: isVisible && productId > 0 } })
```
Target-location (string id) → `productId === 0` → never fetches. On close `isVisible` is false → query disabled, no background refetch.

**4. Scoped loading / error affordance (lightweight data stays visible):**
```tsx
{isEnriching && <ActivityIndicator size="small" color={colors.primaryColor} />}
{isDetailError && (
  <TouchableOpacity onPress={() => refetchDetail()} hitSlop={8}>
    <Text ...>{t('common.retry') || 'Retry'}</Text>
  </TouchableOpacity>
)}
```
`isEnriching = isVisible && productId > 0 && isDetailFetching && !detail` — the spinner shows only during first enrichment; the marker's data is on screen the whole time.

## Build / lint result
- `npx tsc --noEmit` → **clean** (0 errors).
- `npx eslint app/(tabs)/map.tsx components/Maps/GoogleMap.tsx components/Maps/ProductMapMarker.tsx components/Maps/MarkerDetailModal.tsx` → **0 errors, 1 warning**. The warning (`GoogleMap.tsx:150` `useEffect` missing dep `initializeLocation`) is pre-existing and unrelated to this fix.

## Manual QA checklist (run on Android physical device)
- [ ] 1. Open map.
- [ ] 2. Tap a product marker.
- [ ] 3. `MarkerDetailModal` opens immediately.
- [ ] 4. Lightweight title / price / image / distance show while detail loads (small spinner in the meta row).
- [ ] 5. Detail fields fill in after fetch (category / negotiable / posted-ago) without any field blanking.
- [ ] 6. Modal does **not** close / flicker / reset during fetch.
- [ ] 7. Tap another marker while open → content updates cleanly to the new product (falls back to its lightweight data, then enriches).
- [ ] 8. Tap the highlighted target-location marker → **no** detail fetch, no crash.
- [ ] 9. Close modal → sheet animates out, selected marker clears.
- [ ] 10. Reopen the same marker → works (detail served from React Query cache, no flicker).
- [ ] 11. Force a detail-fetch failure (offline) → lightweight data stays visible, "Retry" appears and works.

## Remaining risks
1. **`category` placeholder pop:** if `app/(tabs)/map.tsx` does not map `category` from the DTO's `product_type_name`, the category line shows the `'Category'` placeholder until detail resolves, then fills in (it never blanks). One-line optional improvement in the map mapping: `category: item.product_type_name || undefined`. Left to you since the mapping/DTO are being edited in this session.
2. **`t('common.retry')` key:** if that i18n key is absent, the label falls back to the literal `'Retry'`. Add the key to `locales/*` for full localization.
3. **Sticky mount keeps the component instance alive** after the first open (by design, to avoid remounts). The detail query is disabled while closed, so there's no background work; memory cost is a single retained component.
4. **Concurrent-edit caveat:** `map.tsx` / `types/index.ts` were being edited live during this fix. The modal fix consumes `MarkerData` + `useProductQuery` detail, so it is insulated from the `ProductMapMarkerDto` shape — but re-run `tsc` after your mapping/DTO edits settle to confirm the whole map path still compiles.
