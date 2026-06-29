# Map Data Loading — Fix Report (Stage 2)

MVP fix for the map showing only the first 20 paginated products. Mobile-only,
isolated to the map; list/search pagination and the marker optimization untouched.

## Chosen approach

**Option A — a dedicated, map-specific query that requests one capped page of the
nearest listings.** (See `docs/map-data-loading-audit.md` for the full comparison.)

- The map now uses its own hook **`useMapProductsQuery`** (`queryKey: ['MAP_PRODUCTS', params]`),
  separate from the list/search hooks, so map data has its own cache and never shares
  state with `/product/all` list pagination.
- It requests **`page_size: 100`** (the documented server-wide page cap) with
  **`sort_by: EProductSortBy.DISTANCE`** and `current_page: 1` → up to the **100 nearest**
  in-radius listings in a single request, instead of an arbitrary first 20.
- Radius is still the user's server-side `search_radius_km` (no client radius param exists);
  changing location/radius in settings changes the marker set, same as before.

Why not the backend `/products/map-markers` endpoint (the "better" option)? The backend
.NET service **is not in this repository** (mobile-only, per `CLAUDE.md`), so it can't be
implemented or built here. It remains the recommended next step for the backend team and is
specified in the audit (§4C, §6).

## Why not clustering yet

At current volume the map loads ≤ ~100 markers (one capped page), and the markers are
already optimized (`ProductMapMarker`, `React.memo`, `tracksViewChanges → false`). Clustering
would add a dependency and a UX/behavior change for no measurable benefit at this scale. It is
**deferred** until marker counts regularly exceed ~150–200 (audit §6), which is also when the
lightweight backend endpoint should land.

## Files changed

| File | Change |
| --- | --- |
| `api/hooks/useProduct.ts` | **Added** `useMapProductsQuery` — same query fn as the list hook but a distinct `['MAP_PRODUCTS', params]` cache key and a doc comment. No change to `useProductsQuery` / `useInfiniteProductsQuery`. |
| `app/(tabs)/map.tsx` | Switched the map from `useProductsQuery({ page_size: 20 })` to `useMapProductsQuery({ page_size: 100, sort_by: DISTANCE, current_page: 1 })`; added a documented `MAP_MARKER_PAGE_SIZE = 100` constant and the `EProductSortBy` import. Marker mapping, the valid-lat/lng filter, the empty state, and `GoogleMap`/`ProductMapMarker` are unchanged. |

`useProductsQuery` is left in place (it was only ever used by the map; it stays as a generic
exported hook, now unused — removing it would touch the barrel for no functional gain).

## Backend changes

**None.** No backend in this repo; `/product/all` is called with existing, documented
parameters only (`page_size`, `sort_by`, `current_page`, `user_lat`, `user_long`). No new
endpoint, no API contract change.

## API contract (new endpoint) — proposed for the backend team, NOT implemented

For the future scaling step (audit §6), the recommended lightweight endpoint:

```
GET /api/products/map-markers?lat=&lng=&radiusKm=&category=&type=
→ 200 {
    success, message,
    data: {
      markers: [
        { id, title, price, product_type, latitude, longitude, main_image_url, created_at }
      ],
      total, hasMore   // cap markers at ~500, hasMore=true if more exist in radius
    }
  }
```
SQL filters by distance ≤ radius, sorts by distance, caps the result set. `/product/all`
stays unchanged. This is documentation only — owned by the backend repo.

## Performance limits

- **Per request:** ≤ 100 list-item DTOs (~tens of KB), one call, React-Query-cached 5 min,
  **no refetch on pan/zoom** (the map has no region-change fetch). Within rate limits.
- **On-map:** ≤ ~100 optimized markers — comfortable for react-native-maps post-optimization
  on Android.
- **Hard cap:** if a radius holds > 100 listings, the map shows the **nearest 100**
  (distance-sorted). This is intentional and bounded — not an unbounded multi-page fetch —
  and is the documented trigger for the backend endpoint + clustering.
- **Payload note:** `/product/all` returns full list-item fields (heavier than a marker
  needs); the dedicated endpoint would trim this later.

## Verification

- `npx tsc --noEmit` → **PASS** (exit 0).
- `npx eslint api/hooks/useProduct.ts "app/(tabs)/map.tsx"` → **PASS** (0 errors; one
  pre-existing unused-`locale` warning in `map.tsx`, unrelated to this change).
- `dotnet build` → **N/A** (no backend in this repo; no backend changes).

## Manual QA checklist

1. Open the map where the radius has > 20 listings → **more than 20 pins** appear (up to 100), nearest first.
2. Home/Search product lists still paginate normally (load-more, 20/page) — unchanged.
3. Map stays smooth on a physical **Android** device while panning/zooming (markers don't blink).
4. Tap a pin → the correct product detail bottom sheet opens.
5. Change location/search radius in settings → reopen map → marker set reflects the new area.
6. In an area with no listings → the map renders with no pins (empty state intact); the loading spinner shows while fetching.
7. Inspect the `/product/all` response → a single ≤100-item page (not unusually heavy, no extra fields added).
8. Deep-link from a product (URL lat/lng) → highlighted pin shows at the target alongside nearby pins.

## Follow-up recommendations

- Backend: add `GET /api/products/map-markers` (slim DTOs, radius cap ~500, `hasMore`) — audit §4C/§6.
- When markers regularly exceed ~150–200: add clustering; at very high densities, add
  viewport-bounded fetch (backend bbox params + debounced region-change fetch).
- Optionally surface a "zoom in to see more" hint when `total_records > MAP_MARKER_PAGE_SIZE`
  (data already available via `PaginatedResponse.total_records`).

---
*No commit performed, per instructions. Stopped after the MVP phase.*
</content>
