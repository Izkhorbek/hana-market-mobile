# Google Map Performance Audit

Stage 1 — read-only. No code changed. Verified against current `develop`.

## 1. Executive Summary

**Tech confirmed:** Expo + React Native, `react-native-maps` with `provider="google"`,
custom-view markers (`<Marker>` wrapping an SVG `LocationPinIcon`), product data with
`latitude`/`longitude` from `GET /product/all`. **There is no image inside the map
marker** — the marker is a pure SVG; product thumbnails only appear in the detail
bottom sheet (`MarkerDetailModal`).

**Most likely root cause of slowness + blinking (same cause family):**
1. **`tracksViewChanges` is left at its default `true`** (the line is commented out in
   `GoogleMap.tsx:277`). For custom-view markers on Android, react-native-maps
   re-rasterizes each marker to a bitmap on every "view change" while this is true —
   continuously. This is the textbook cause of custom-marker **flicker/blink** and a
   large, sustained CPU/GPU cost.
2. **A dead `currentZoom` state is updated on every pan/zoom** via
   `onRegionChangeComplete → setCurrentZoom` (`GoogleMap.tsx:235-239, 254`). The value
   is **never read anywhere**. Each pan therefore re-renders `GoogleMap` and recreates
   the entire `markers.map(...)` `<Marker>` subtree — which, combined with #1, makes
   every marker re-capture and blink.
3. **Markers are inline, non-memoized JSX with an inline `onPress`** (`GoogleMap.tsx:262-284`),
   so any `GoogleMap` re-render (pan, theme, or parent modal open/close) rebuilds all
   markers.

**Classification:** this is a **rendering + lifecycle (re-render)** problem, **not** a
fetching or data-volume problem. The map fetches only `page_size: 20` (≤ ~20 markers),
so **marker count is not the bottleneck and clustering is not warranted.**

## 2. Current Map Architecture

**Files involved**
- `app/(tabs)/map.tsx` — screen (`MapPage`): fetches products, builds `MarkerData[]`, owns the detail-modal state.
- `components/Maps/GoogleMap.tsx` — `MapView` wrapper: renders markers, zoom/locate controls, dark-mode style, location bootstrap.
- `components/Maps/LocationPinIcon.tsx` — the SVG pin drawn inside each marker.
- `components/Maps/MarkerDetailModal.tsx` — bottom sheet shown on marker tap (contains the only product image, via `RemoteImage`).
- `components/Maps/googleMapStyle.ts` — (style constants; dark style is also inlined in `GoogleMap.tsx`).
- Data: `useProductsQuery` (`api/hooks/useProduct.ts`) → `GET /product/all`.

**Data flow**
```
MapPage
  useProductsQuery({ user_lat, user_long, page_size: 20, current_page: 1 })
  → data.items
  → useMemo productMarkers (filter valid lat/lng → MarkerData[])
  → useMemo allMarkers (prepend highlighted marker from URL params)
  → <GoogleMap markers={allMarkers} onMarkerPress=… onMapPress=… />
        → markers.map(m => <Marker key={m.id}><LocationPinIcon/></Marker>)
  marker tap → setSelectedMarker + setIsModalVisible → <MarkerDetailModal/>
```

**Component tree (map screen)**
```
MapPage
 ├─ MapPageHeader
 ├─ (loading overlay)
 ├─ GoogleMap                       ← re-renders on pan (B2) + modal toggle (B4) + theme
 │   └─ MapView
 │       └─ Marker × N (inline, not memoized, tracksViewChanges=true)  ← blink (B1,B3)
 │           └─ View > LocationPinIcon (SVG)
 └─ MarkerDetailModal (RemoteImage — the only image; off the map surface)
```

**Product marker flow:** product → `MarkerData` (slim, purpose-built object; *not* the
full product) → inline `<Marker>`. Coordinates are read straight from the item; markers
are filtered to truthy lat/lng but **not** memoized per-marker, viewport-filtered, or clustered.

## 3. Bottlenecks Found

| ID | Area | Evidence | Impact | Recommended Fix |
| --- | --- | --- | --- | --- |
| **B1** | Marker blink / GPU | `tracksViewChanges` commented out → defaults `true` (`GoogleMap.tsx:277`); custom SVG marker re-rasterized continuously on Android | **High** | Isolate marker; set `tracksViewChanges` `true → false` after first paint (re-enable briefly on theme/selection change) |
| **B2** | Re-render on pan | `onRegionChangeComplete → setCurrentZoom` (`:235-239,254`); `currentZoom` is **never read** | **High** | Remove the dead `currentZoom` state + handler so panning stops re-rendering the map |
| **B3** | Marker recreation | Inline `<Marker>` + inline `onPress={() => onMarkerPress?.(marker)}` (`:262-284`); no memoized marker | **High** | Extract `React.memo`'d `ProductMapMarker`; pass a stable `onPress` (ref-based) |
| **B4** | Re-render on modal toggle | `MapPage` `selectedMarker`/`isModalVisible` state re-renders `GoogleMap`, recreating markers | **Medium** | Absorbed once B3 memoizes markers (stable props bail out of re-render) |
| **B5** | Map-press logging | `onMapPress={(c) => console.log('Map pressed:', c)}` (`map.tsx:155`) — new closure each render + logs in prod | **Low** | Remove the console.log handler |
| **B6** | Data volume | `page_size: 20` (`map.tsx:66`) → ≤ ~20 markers | **None** | **No clustering / viewport filtering needed** — documented, intentionally not implemented |
| **B7** | Coordinate validity | `item.latitude && item.longitude` truthy filter (`map.tsx:89`) rejects `0`/`NaN`; fine for the UZ service area | **Low** | Optional `Number.isFinite` hardening; leave as-is to stay minimal |
| **B8** | Marker image | Marker renders only an SVG; no `RemoteImage`/thumbnail on the map surface | **None** | No change — image stays in the detail modal only |

Secondary observations (out of scope, noted only): the map query is not gated on
`isHydrated/isAuthenticated` (unlike Home), and `initializeLocation`/`console.error`
calls exist — neither is a marker-perf cause and both touch auth/permission flows, so
they are intentionally left untouched.

## 4. Marker Blinking Analysis

**Why they blink:** `react-native-maps` renders a React custom-view marker by
rasterizing the view into a native bitmap. While `tracksViewChanges === true` it keeps
re-capturing that bitmap whenever the view "changes" — and a parent re-render counts as
a change. Here three things keep that loop hot:

- **`tracksViewChanges` is never set to `false`** (B1) — so re-capture is unbounded.
- **`setCurrentZoom` fires on every `onRegionChangeComplete`** (B2) — so every pan
  triggers a `GoogleMap` re-render.
- **Markers are inline + non-memoized** (B3) — so each of those re-renders rebuilds all
  `<Marker>` elements, forcing a fresh capture.

**Is `tracksViewChanges` involved?** Yes — it is the primary lever. Leaving it `true`
permanently is the single biggest contributor to both the flicker and the frame drops.

**Is image loading involved?** No. The on-map marker is a synchronous SVG; there is no
remote image on the marker to cause load-driven layout/blink. (The only `RemoteImage`
is in the detail sheet, off the map.) So the blink is a **re-render/re-capture** issue,
not an image issue.

## 5. Safe Optimization Plan (phased)

**A. Stabilize marker render** *(highest confidence)*
- Extract a `React.memo`'d `ProductMapMarker` (props: `marker`, `color`, `onPress`).
- Control `tracksViewChanges`: start `true`, flip to `false` shortly after first paint;
  re-enable briefly when `color`/selection changes so theme toggles still update the pin.

**B. Reduce map re-renders** *(highest confidence)*
- Delete the unused `currentZoom` state + `onRegionChangeComplete` setter so panning no
  longer re-renders the map.
- Give `GoogleMap` a stable, ref-based `handleMarkerPress` so the memoized marker's
  `onPress` identity never changes (decoupled from the parent's inline callback).
- Remove the `console.log` map-press handler.

**C. Filter / cluster marker volume** *(not needed)*
- Keep the existing valid-coordinate filter. **Do not cluster** — only ~20 markers; the
  tradeoff (new dependency / behavior change) is unjustified. Documented decision.

**D. Improve fetch strategy** *(no change)*
- Already paginated (20) and React-Query-cached (5 min staleTime, no refetch-on-focus).
  Panning does not refetch. No change required.

**E. Performance guards**
- `ProductMapMarker` memoization + `tracksViewChanges=false` are the guards; they keep
  markers stable across parent re-renders (modal open/close, theme) without extra work.

## 6. Files To Change (Stage 2)

| File | Expected change |
| --- | --- |
| `components/Maps/ProductMapMarker.tsx` | **New.** `React.memo` marker: `<Marker>` + `LocationPinIcon`, `tracksViewChanges` true→false after first paint (re-arm on `color` change), stable `onPress(marker)`. |
| `components/Maps/GoogleMap.tsx` | Remove `currentZoom` state + `onRegionChangeComplete` setter; render `ProductMapMarker` instead of inline `<Marker>`; add ref-based stable `handleMarkerPress`. Keep controls, location, dark-mode style, `initialRegion` (uncontrolled). |
| `app/(tabs)/map.tsx` | Remove the `onMapPress` `console.log` handler. (No fetch/marker-data changes.) |

Explicitly **not** changing: backend API, auth/token logic, product fetching/params,
Home/Search/Chat/Manner/Guidance, clustering, or any existing map feature.
</content>
