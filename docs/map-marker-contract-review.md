# Map-Marker Frontend ↔ Backend Contract Review

**Endpoint:** `GET /api/product/map-markers`
**Scope:** Map screen integration only. No changes to Home / Search / `ProductCard` / marker-performance code.
**Date:** 2026-06-30

## Summary

| # | Check | Status | Action |
|---|-------|--------|--------|
| 1 | Sends `user_lat` / `user_long` | ✅ Pass | None |
| 2 | Sends `radius_km` from user's radius setting if available | ⚠️ Was missing → **Fixed** | Added `radius_km: user?.search_radius_km ?? undefined` |
| 3 | Sends `limit=300` | ✅ Pass | None |
| 4 | Backend returns active-only markers | ⚠️ Frontend-side covered; **backend confirmation required** | Sends `status=active`; documented requirement |
| 5 | `product_type` serialization matches `EProductType` | ⚠️ **Backend confirmation required** | Documented; field currently unused on FE → no runtime risk |
| 6 | Price/currency formatting in marker tag before lazy-load | ✅ Pass | None (matches app-wide convention) |
| 7 | `target-location` marker does not trigger detail fetch | ✅ Pass | None |
| 8 | Lazy fetch enabled only for numeric product IDs | ✅ Pass | None |
| 9 | Map no longer calls `/product/all` | ✅ Pass | None |
| 10 | TypeScript + lint pass | ✅ Pass | None |

No backend DTO change is required. Two **backend behavior confirmations** are flagged (checks 4 and 5) — see below.

---

## Detail

### 1. `user_lat` / `user_long` — ✅
`app/(tabs)/map.tsx` sends `user_lat: userLat`, `user_long: userLng`, derived from the auth-store user (`user.latitude` / `user.longitude`) with a Tashkent fallback. Matches the contract.

### 2. `radius_km` — ⚠️ Fixed
**Before:** not sent. **After:**
```ts
radius_km: user?.search_radius_km ?? undefined,
```
`user.search_radius_km` is the saved radius setting (same field written by `app/(settings)/manage.tsx`). When the user has no saved radius, the value is `undefined` and **axios omits the query param**, so the backend applies its own default radius. The param is typed `radius_km?: number` on `ProductMapMarkerParams`.

> Behavior note: sending a radius constrains results to that radius (previously the request was effectively "nearest N up to the limit"). This is the intended contract behavior.

### 3. `limit=300` — ✅
Sends `limit: AppLimits.MAP.MARKER_LIMIT` (`= 300`, `constants/appLimits.ts`).

### 4. Active-only markers — ⚠️ Backend confirmation required
Frontend now sends `status: AppLimits.ProductStatus.active` (`'active'`), and `ProductMapMarkerParams` declares `status?: ProductStatus`.

**Backend requirement (please confirm one of):**
- **Preferred:** the endpoint defaults to active-only regardless of params (markers should never show sold/reserved/hidden listings), **and/or**
- the endpoint honors the `status` query param so `status=active` filters server-side.

If the endpoint **ignores** `status` and does **not** default to active-only, sold/reserved markers will leak onto the map. In that case the fix belongs on the backend (default to active for the map endpoint) — **stop and report before any backend DTO/behavior change**, do not work around it on the client.

### 5. `product_type` serialization — ⚠️ Backend confirmation required
`ProductMapMarkerDto.product_type` is typed as `EProductType` (numeric enum: `THING=1000`, `CAR=1010`, `WORK=1020`).

**Backend requirement:** confirm `product_type` is serialized as the **integer enum value**, not a string name (e.g. `1010`, not `"CAR"`).

- **Current runtime risk: none.** The field is **not read anywhere on the frontend** — marker pins don't use it, and the bottom sheet derives its category label from the lazily-fetched full product detail (`product_type_name`), not from the marker DTO.
- If the backend returns a string, the safe adjustment is to widen the type to `EProductType | string` (or map it on read). Deferred until backend serialization is confirmed, since there is no consumer today.

### 6. Price / currency in marker tag (pre-lazy-load) — ✅
Marker tag uses `categoryTag: item.price || undefined`. The backend `price` is a **display-ready formatted string** — this is the same convention used across the app (e.g. `ProductCard` renders the `price` string directly without applying `currency_type`). So no client-side currency formatting is needed for the tag, and behavior matches the rest of the app.

Once a marker is tapped, the bottom sheet overrides the tag with the authoritative detail value (`is_free ? t('post.free') : detail.price`). `currency_type` is kept on the DTO for completeness but is not required for display.

### 7. `target-location` marker — ✅
The highlighted marker built from URL params has `id: 'target-location'` (a string). In `MarkerDetailModal`:
```ts
const productId = typeof marker?.id === 'number' ? marker.id : 0
const { data: detailResponse } = useProductQuery({
  id: productId,
  querySettings: { enabled: isVisible && productId > 0 },
})
```
String ids yield `productId = 0` → `enabled: false` → **no detail fetch** for the highlighted location.

### 8. Lazy fetch only for numeric product IDs — ✅
Same guard as above: `typeof marker?.id === 'number'` plus `productId > 0`. The fetch is also gated on `isVisible`, so detail loads only when the sheet is open for a real product marker.

### 9. No `/product/all` from the map — ✅
The map uses `useProductMapMarkersQuery` → `productService.getProductMapMarkers` → `ENDPOINT.PRODUCT.MAP_MARKERS` (`product/map-markers`). The legacy `useMapProductsQuery` (which hit `/product/all`) was removed. `productService.getAll` / `/product/all` remain in use **only** by the untouched list/search/home/seller surfaces.

### 10. TypeScript + lint — ✅
- `npx tsc --noEmit` → clean (0 errors).
- `npx eslint` on changed files → 0 errors. One pre-existing warning remains (`MarkerDetailModal.tsx` location `useEffect` missing-dependency), unrelated to this work and not introduced here.

---

## Files touched in this review
- `app/(tabs)/map.tsx` — added `radius_km` to the request; clarified the request comment.
- `docs/map-marker-contract-review.md` — this document.

(`ProductMapMarkerParams.status` and the `status=active` send were already present from the prior change set.)

## Open items for backend
1. **Confirm map-markers returns active-only** (check 4) — default to active and/or honor `status=active`.
2. **Confirm `product_type` is serialized as the integer enum value** (check 5).

If either confirmation reveals a contract mismatch requiring a backend DTO/behavior change, **stop and report** rather than changing the backend as part of this frontend work.
