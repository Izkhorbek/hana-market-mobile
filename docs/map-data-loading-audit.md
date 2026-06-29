# Map Data Loading Audit

Stage 1 — read-only. No code changed. Verified against current `develop`.

## 1. Executive Summary

**Why `page_size: 20` is wrong for the map.** `app/(tabs)/map.tsx` fetches markers with
`useProductsQuery({ page_size: 20, current_page: 1 })` — the *list* pagination shape. On a
list that's correct (load-more as you scroll). On a map there is no scroll-to-load; the
user expects to see **all relevant listings around their location/radius at once**. So the
map silently shows only the first 20 products of page 1 — and because no `sort_by` is set,
those 20 aren't even guaranteed to be the *nearest* listings.

**Best short-term architecture (MVP, mobile-only).** A dedicated map query that requests a
single larger, capped page (`page_size: 100`) sorted by distance, so the map shows the
nearest ~100 listings in radius. This is isolated (the map already uses its own hook), needs
no backend change, and does not touch list pagination.

**Best long-term architecture.** A backend lightweight **`GET /api/products/map-markers`**
returning slim marker DTOs filtered by radius (cap ~500, `hasMore` flag), and — once
densities grow — viewport-bounded fetching + clustering. **The backend is not in this repo**
(mobile-only; the .NET service is separate per `CLAUDE.md`), so the endpoint is a documented
recommendation for the backend team, not implementable here.

## 2. Current Data Flow

```
app/(tabs)/map.tsx
  useProductsQuery({ user_lat, user_long, page_size: 20, current_page: 1 })
    → productService.getAll(params)
    → GET /api/product/all?user_lat=&user_long=&current_page=1&page_size=20
    → ApiResponse<PaginatedResponse<ProductListItem>>
  data.data.data.items
    → useMemo productMarkers: filter(item.latitude && item.longitude)
                              .map(→ MarkerData { id, lat, lng, title, image, category, price… })
    → useMemo allMarkers (prepend URL-param highlighted marker)
    → <GoogleMap markers={allMarkers} /> → ProductMapMarker (memoized, tracksViewChanges→false)
```

- **Endpoint:** `GET /api/product/all` (`ENDPOINT.PRODUCT.ALL = 'product/all'`).
- **Params sent by the map:** `user_lat`, `user_long`, `page_size: 20`, `current_page: 1`. No `sort_by`, no `product_type`/category, no price filters.
- **Pagination:** `PaginatedResponse<T>` = `{ items, current_page, page_size, total_records }` (no `total_pages` — derive via `ceil(total_records / page_size)`).
- **Marker mapping:** builds a slim `MarkerData`; the on-map pin is a pure SVG (no image); the image/title/price/category/distance are used only by the detail bottom sheet.

**Isolation note:** `useProductsQuery` is used **only** by `map.tsx`. Home and Search use
`useInfiniteProductsQuery` (`queryKey: ['PRODUCTS_INFINITE', …]`). So map data loading can be
changed without any risk to list/search pagination.

## 3. Backend Capability

(From the in-repo API contract docs — the backend source is not in this repo.)

- **`/product/all` query params** (`MOBILE_API_DOCUMENTATION.md`): `user_lat` (req),
  `user_long` (req), `current_page` (def 1), `page_size` (def 20), `category_id`,
  `product_type`, `search_query`, `min_price_uzs`, `max_price_uzs`, `is_free`,
  `sort_by` ∈ {`distance`, `price_asc`, `price_desc`, `newest`}.
- **No explicit radius parameter.** Radius is the user's server-side `search_radius_km`
  (stored on the profile via `POST /user/update/location`); the client only sends
  lat/lng. The backend applies distance filtering/sorting; response items carry
  `distance_km` / `distance`.
- **Max `page_size`:** **undocumented for `/product/all`.** The only documented page caps
  in the repo are **100** (complaints `/complaint/my-complaints`, chat lists). So **100 is
  the established server-wide convention** and the safe ceiling to assume. Going above 100
  (e.g. 200) is unverified and could be silently clamped or rejected.
- **Response weight:** `/product/all` returns full *list-item* DTOs (title, description,
  image url, price, distance, timestamps…) — heavier than a marker needs, but the bottom
  sheet already consumes title/image/category/price/distance, so nothing extra is required.
- **Is a new map endpoint needed?** Not for MVP — `/product/all` with a larger capped page
  and `sort_by=distance` is sufficient at current volumes. A dedicated lightweight endpoint
  is the right call **later** (payload reduction + true radius cap + `hasMore`).

## 4. Options

### A. Increase `page_size` for the map only (single capped request)
- **Pros:** one-line, fully isolated (map-only hook), no backend work, no list/search impact, predictable payload, works today.
- **Cons:** still capped (won't show > cap); list-item DTO is heavier than a marker DTO; if backend clamps `page_size`, you get fewer (still > 20).
- **Risk:** Low.
- **Recommended:** ✅ **Yes — MVP.** Pair with `sort_by=distance` so the capped set is the *nearest* listings.

### B. Fetch all pages client-side until no more
- **Pros:** shows everything in radius regardless of count.
- **Cons:** N sequential requests; unbounded without a hard cap; rate-limit exposure (100 req/window); more code + error surfaces; janky load.
- **Risk:** Medium.
- **Recommended:** ❌ Not for MVP. Acceptable only with a strict page/marker cap, which then collapses back into option A's behavior anyway.

### C. Backend `GET /api/products/map-markers` (lightweight DTO, radius, cap 500, `hasMore`)
- **Pros:** smallest payload; true radius semantics; one request; future-proof; keeps `/product/all` untouched.
- **Cons:** **requires the backend repo** (not present here); needs DTO + SQL distance filter + caps + docs; coordinated release.
- **Risk:** Medium (cross-repo), Low technically.
- **Recommended:** ✅ **Yes — as the next step / long-term**, owned by the backend team. Cannot be implemented in this mobile repo.

### D. Viewport-based fetch (refetch markers for the visible bounds on region change)
- **Pros:** scales to large datasets; only loads what's on screen.
- **Cons:** needs backend bbox params (`minLat/maxLat/minLng/maxLng`) that don't exist; debounce + dedup + lifecycle complexity; would reintroduce per-pan fetching we just removed.
- **Risk:** Medium-High.
- **Recommended:** ❌ Not now. Revisit with option C once densities are high.

### E. Clustering
- **Pros:** keeps the map readable at hundreds/thousands of markers.
- **Cons:** new dependency (`react-native-map-clustering` or custom), behavior/UX change, interacts with the marker optimization; unjustified at current volume (≤ ~100).
- **Risk:** Medium.
- **Recommended:** ❌ **Defer** until marker count regularly exceeds ~150–200 (see §6).

## 5. Recommended MVP Fix

**Approach A**, mobile-only, isolated to the map:

1. **Add a dedicated map query hook** `useMapProductsQuery` (`queryKey: ['MAP_PRODUCTS', params]`)
   so the map cache is explicitly separate from any list query and intent is clear. (The map
   already uniquely owns `useProductsQuery`, so this is a clean rename-in-spirit, not a behavior
   change to lists.)
2. **Request a single capped page tuned for a map:**
   `page_size: 100` (the documented server-wide cap) + `sort_by: EProductSortBy.DISTANCE`
   + `current_page: 1`. → up to the **100 nearest** in-radius listings.
3. **Keep the valid-coordinate filter** (`item.latitude && item.longitude`); optionally harden to `Number.isFinite`.
4. **Keep the marker optimization** (`ProductMapMarker`, memo, `tracksViewChanges→false`) untouched.
5. **Document the cap + clustering trigger:** if `total_records > 100`, the map shows the
   nearest 100; that's the signal to ship option C (and later D/E). Optionally expose
   `hasMore` (computed from `total_records`) for a future "zoom in to see more" hint — not
   required for MVP.

**Data-volume safety:** one request, ~100 list-item DTOs (≈ tens of KB), ≤ ~100 optimized
markers — comfortably within what react-native-maps handles post-optimization, and within
rate limits (single call, React-Query cached 5 min, no refetch-on-pan).

## 6. Future Scaling Plan

| Marker count in radius | Action |
| --- | --- |
| ≤ ~100 (today) | MVP: single `page_size: 100`, `sort_by=distance`. |
| ~100–200 | Ship backend **`/products/map-markers`** (option C): slim DTOs, radius cap ~500, `hasMore`. Reduces payload and removes the list-DTO weight. |
| ~200–500 | Add **clustering** (option E) on top of C for readability. |
| > 500 / dense cities | Add **viewport-bounded fetch** (option D): backend bbox params + debounced region-change fetch + dedup; combine with clustering. |

Triggers to watch: `total_records` regularly exceeding the cap, payload size, Android frame
times with many pins. Each step keeps `/product/all` and list/search pagination unchanged.
</content>
