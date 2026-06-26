# Google Map Performance — Final Review

Reviewer role: Senior RN map-performance reviewer. Pre-commit sign-off for the map
fix (ProductMapMarker isolation, dead-state removal, stable press handler). No code
changed during review (no blocker found).

## Verification

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npx eslint` on the 3 changed files | **PASS** (0 errors; 2 pre-existing warnings) |

Pre-existing warnings (not introduced by this change, not in scope): unused `locale`
in `app/(tabs)/map.tsx:46`, and the `initializeLocation` effect-dependency warning in
`GoogleMap.tsx`.

## Checklist results

| # | Check | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | `tracksViewChanges` never permanently true | ✅ Pass | `ProductMapMarker.tsx:34-42` — starts `true`, `setTimeout` flips to `false` after 500 ms; timer cleared on unmount. |
| 2 | Capture re-arms only on visual-prop change | ✅ Pass | Effect dep is `[color]` (the only visual input — the pin is an SVG colored by `color`). Coordinate/title/description changes don't (and needn't) re-capture. |
| 3 | `ProductMapMarker` memoized, minimal stable props | ✅ Pass | `export default React.memo(ProductMapMarker)`; props `{ marker, color, onPress }` — `marker` ref stable via memoized `allMarkers`, `color` from theme, `onPress` ref-based stable. |
| 4 | Stable product-id keys, not index | ✅ Pass | `GoogleMap.tsx` `markers.map(m => <ProductMapMarker key={m.id} …/>)`; ids are product numbers or `'target-location'`. |
| 5 | No dead-state update on pan/zoom | ✅ Pass | `currentZoom` state, `handleRegionChange`, and the `onRegionChangeComplete` prop are removed; `MapView` has no region listener. |
| 6 | Stable marker-press handler identity | ✅ Pass | `GoogleMap.tsx:140-146` — `onMarkerPressRef` + `useCallback(…, [])` → identity never changes, decoupled from the parent's inline callback. |
| 7 | Detail bottom sheet still opens | ✅ Pass | `handleMarkerPress(marker)` → `onMarkerPressRef.current?.(marker)` → `MapPage.handleMarkerPress` → `setSelectedMarker` + `setIsModalVisible(true)` → `MarkerDetailModal`. Full `MarkerData` reaches the sheet. |
| 8 | User location, zoom controls, dark mode intact | ✅ Pass | `initializeLocation`, `handleLocateMe`, `handleZoomIn/Out`, and `customMapStyle={mapStyle}` (dark/light) all unchanged in `GoogleMap.tsx`. |
| 9 | No `console.log` in map-press path | ✅ Pass | The `onMapPress={(c) => console.log(…)}` handler is removed from `map.tsx`; `map.tsx` no longer passes `onMapPress`. |
| 10 | No backend/fetch/auth/query change | ✅ Pass | `useProductsQuery` params (`page_size: 20`, `current_page: 1`) unchanged; no auth/product-hook edits. |
| 11 | No clustering / viewport filtering added | ✅ Pass | Only the existing valid-coordinate filter remains; no new dependency or viewport logic. |
| 12 | TS + ESLint pass | ✅ Pass | See Verification. |

## Blockers

**None.** All twelve checks pass; both gates are green; behavior is preserved.

## High risks

**None.**

## Medium risks

- **M1 — `tracksViewChanges` flip is timer-based (500 ms), not load-driven.** Correct
  and safe for the current synchronous SVG pin (it renders on the first frame, well
  inside the 500 ms capture window), but it's a heuristic: if a future marker embeds a
  remote image, or layout settles after 500 ms on a very slow device, the captured
  bitmap could be stale/blank. Mitigation for later: flip on the content's `onLoad`/
  `onLayout` instead of a fixed timer. Not a regression vs. the old permanent-`true`
  behavior; acceptable to ship.

## Low risks

- **L1 — Dead/duplicated styles in `GoogleMap.tsx`.** `markerContainer` (now also in
  `ProductMapMarker`) plus `marker`/`markerText`/`clusterMarker`/`clusterText`/
  `zoomDivider`/`locateButton` are unused. Harmless (ESLint doesn't flag StyleSheet
  keys); optional cleanup.
- **L2 — `GoogleMap` is not wrapped in `React.memo`.** It still re-renders when `MapPage`
  state changes (modal open/close), and `initialRegion`/`onMarkerPress`/`handleCloseModal`
  in `MapPage` are inline. This is cheap and harmless: the memoized markers with stable
  props absorb it (no re-capture), and `initialRegion` is ignored by `MapView` after
  mount. Documented as intentionally not needed.
- **L3 — Residual `console.error` calls** in `GoogleMap.initializeLocation`/`handleLocateMe`
  (paired with `logger`). Not in the map-press path; cosmetic.
- **L4 — Pre-existing ESLint warnings** (`locale`, `initializeLocation` dep) left as-is
  to keep the change minimal.

## Release recommendation

**GO / commit-ready.** The fix removes the two true performance defects (permanent
`tracksViewChanges`, per-pan dead-state re-render) and isolates the marker behind
`React.memo` with stable props and a stable press handler. No feature was removed, no
backend/auth/fetch/product logic touched, and no clustering added. The only residual
item (M1) is a documented heuristic that is safe for the current SVG marker.

## Manual Android QA checklist

Run on a **physical Android device** — the original flicker is Android-specific to
custom-view markers.

1. Open the map with many listings → pins render and **do not blink continuously**.
2. Pan and pinch-zoom repeatedly → no flicker, smooth motion, pins stay anchored.
3. Tap a pin → detail bottom sheet opens with the correct product (title, image, tag).
4. "View details" → navigates to the product screen; "Directions" opens maps.
5. Open/close the sheet several times → pins do **not** re-blink or get recreated.
6. Switch to another tab and back → pins are not recreated/flickering.
7. Toggle dark mode → map style + pin color update (one brief re-capture, no loop).
8. Switch language (uz/ru/en) → sheet text localized; no pin churn/blink.
9. Zoom +/- and "locate me" controls work; user-location dot shows.
10. Deep-link from a product (URL lat/lng params) → highlighted pin shows at the target.
11. Confirm Home/Search lists still work (no shared code changed).
12. Optional: with low-end-device throttling, verify the pin is never blank on first
    render (M1 sanity check).

## Commit readiness

**Ready to commit.** Suggested scope: `components/Maps/ProductMapMarker.tsx` (new),
`components/Maps/GoogleMap.tsx`, `app/(tabs)/map.tsx`, plus the three map docs. Recommend
gating the commit on a quick pass of Android QA items 1–3 and 7. Optional follow-ups
(L1 style cleanup, M1 `onLoad`-based flip if a thumbnail is ever added) can be separate.

---
*No commit performed, per instructions.*
</content>
