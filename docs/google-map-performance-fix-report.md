# Google Map Performance — Fix Report (Stage 2)

Minimal, high-confidence fixes from `docs/google-map-performance-audit.md`. No
clustering (only ~20 markers — not the bottleneck). No backend/auth/fetch changes.

## Exact root causes fixed

1. **Marker blink (B1) — `tracksViewChanges` left `true`.** The custom SVG marker was
   re-rasterized to a native bitmap on every view change, continuously. Fixed by
   controlling it in the isolated marker: `true` only long enough to capture the pin
   once, then `false` (re-armed on `color`/theme change).
2. **Re-render on every pan (B2) — dead `currentZoom` state.** `onRegionChangeComplete →
   setCurrentZoom` re-rendered the whole map on each pan/zoom, recreating all markers;
   `currentZoom` was never read. Removed the state, handler, and the
   `onRegionChangeComplete` prop.
3. **Marker recreation (B3/B4) — inline, non-memoized `<Marker>` + inline `onPress`.**
   Extracted a `React.memo` marker with stable props and a ref-based stable press
   handler, so parent re-renders (pan, modal open/close, theme) no longer rebuild or
   re-capture markers.
4. **Map-press logging (B5).** Removed the `onMapPress={(c) => console.log(...)}` handler.

## Files changed

| File | Change |
| --- | --- |
| `components/Maps/ProductMapMarker.tsx` | **New.** `React.memo` marker rendering `<Marker>` + `LocationPinIcon`. Manages `tracksViewChanges` (`true → false` after a 500 ms settle; re-armed when `color` changes). Props are minimal/stable: `marker`, `color`, `onPress`. |
| `components/Maps/GoogleMap.tsx` | Removed `currentZoom` state + `handleRegionChange` + the `onRegionChangeComplete` prop. Added a ref-based stable `handleMarkerPress`. Renders `ProductMapMarker` instead of the inline `<Marker>`/SVG. Dropped now-unused `Marker`/`LocationPinIcon`/`useState` imports. All other features (zoom/locate controls, user location, dark-mode style, `initialRegion`) unchanged. |
| `app/(tabs)/map.tsx` | Removed the `onMapPress` `console.log` handler. No fetch/marker-data changes. |

## Before / after behavior

| Aspect | Before | After |
| --- | --- | --- |
| Custom markers | Re-captured to bitmap continuously → visible blink/flicker, frame drops | Captured once, then static → no blink |
| Panning/zooming | `setCurrentZoom` re-rendered the map + recreated all markers every gesture | No map re-render on pan; markers untouched |
| Opening/closing detail modal | Parent re-render recreated all markers | Memoized markers bail out — no rebuild |
| Theme toggle | Markers recreated (with permanent re-capture) | Markers re-capture once with the new color, then settle |
| Map tap | `console.log` on every tap (incl. production) | No-op (handler removed) |

## Marker strategy

- **One isolated, memoized marker per listing** keyed by stable product `id` (the
  highlighted URL marker keeps its `'target-location'` id). No index keys.
- **`tracksViewChanges` lifecycle:** `true` on mount/`color` change → `false` after
  500 ms. Since the pin is a synchronous SVG (no remote image to await), a short settle
  is enough to capture a correct bitmap; it is never left `true` permanently.
- **No image on the marker** — the pin is pure SVG; product thumbnails remain only in
  the detail bottom sheet (`MarkerDetailModal`), off the map surface.
- **No clustering / viewport filtering** — the map fetches `page_size: 20` (≤ ~20
  markers), so marker count is not the bottleneck. Adding clustering would mean a new
  dependency and behavior change for no measurable gain; intentionally skipped.

## Verification

- `npx tsc --noEmit` → **PASS** (exit 0).
- `npx eslint` on the 3 changed files → **PASS** (0 errors). Two **pre-existing**
  warnings remain, neither introduced here: unused `locale` in `map.tsx` and the
  `initializeLocation` effect-dependency warning in `GoogleMap.tsx`.

## Manual QA checklist

1. Open the map with many listings → markers render without continuous blinking.
2. Pan/zoom repeatedly → no flicker, smooth movement, markers stay put.
3. Tap a marker → detail bottom sheet opens with the right product.
4. Tab away and back → markers do not re-blink or get recreated unnecessarily.
5. "View details" in the sheet → navigates to the product screen.
6. Toggle dark mode → map style + pin color update correctly (one re-capture, no loop).
7. Switch language → marker tags/labels in the sheet localized; no marker churn.
8. **Android physical device** — confirm the flicker is gone (the original symptom is
   Android-specific to custom-view markers).
9. Home/Search product lists unchanged and working (no shared code touched).

## Known limitations

- **500 ms `tracksViewChanges` settle** is a heuristic. On a very slow device the pin is
  captured within that window; it is generous for a synchronous SVG. If a future marker
  embeds a remote image, switch the flip to fire on the image's `onLoad` instead of a timer.
- **Overlapping pins** at identical coordinates still stack (no dedup) — unchanged,
  out of scope, not a perf issue.
- **Theme toggle** re-arms capture for all markers briefly (one capture each) — expected
  and cheap; not a regression.

## Follow-up recommendations (not done — would exceed "minimal")

- Gate the map's `useProductsQuery` on `isHydrated && isAuthenticated` to match Home
  (touches auth-adjacent logic — deliberately left for a separate change).
- Replace the two `console.error` calls in `GoogleMap.tsx`/`MarkerDetailModal.tsx` with
  `logger` only (they already log via `logger` alongside).
- If the map later loads *all* products (not just 20) or shows hundreds of markers,
  revisit viewport filtering / clustering — and document the tradeoff then.

---
*No commit performed, per instructions.*
</content>
