# Product Image Prefetch — Phase 1 Report

Frontend-only, minimal, reversible. No backend, API, URL-contract, or library
changes. Implements finding **F4** from `docs/image-loading-performance-audit.md`.

## 1. Was prefetch needed?

**YES.** Backend image resize is now live, so list-card URLs
(`/product_images/<file>.jpg?w=260&h=260&q=65`) return small cached thumbnails
instead of full ~2.5 MB originals. Warming the first-viewport thumbnails is now
safe and gives a perceived-speed win. No prefetch existed anywhere in the code
before this change (verified — `Image.prefetch` was only referenced in docs).

## 2. Files changed

| File | Change |
| --- | --- |
| `hooks/useProductImagePrefetch.ts` | **New.** Reusable fire-and-forget prefetch hook. |
| `components/Lists/ProductsList.tsx` | Import + one call: `useProductImagePrefetch(products.map(p => p.main_image_url))`. |
| `app/search.tsx` | Import + one call: same as above. |
| `docs/product-image-prefetch-report.md` | **New.** This report. |

No changes to `RemoteImage`, `ProductCard`, `utils/imageUrl.ts`, API params,
fetching/pagination logic, or FlatList tuning.

## 3. Exact prefetch strategy

- Builds the **same** sized URL the card requests, via
  `resolveSizedImageUrl(path, { width: 260, height: 260, quality: 65 })`. This
  guarantees the prefetched URL is the **identical disk-cache key** the card
  reads — so the card hits a warm cache, never a second/full-size download.
- Takes the **first 8** image paths only (first viewport), then:
  - skips empty/`null`/broken paths (`resolveSizedImageUrl` returns `''` → filtered out),
  - dedupes within the batch (`new Set`),
  - skips any URL already prefetched this app session (module-level `Set`).
- Calls `Image.prefetch(uniqueUrls, 'disk')` (expo-image `~3.0.11`) — matches the
  card's `cachePolicy='disk'`.
- **Fire-and-forget:** the promise is not awaited, the list renders immediately,
  and rejections are swallowed (`.catch(() => {})`) — no noisy logging/telemetry.
- The `useEffect` is keyed on a **stable primitive** (the first-N paths joined
  with `|`), so it runs once per real change in the leading items and **cannot
  loop** on unrelated re-renders or new array identities.

Wired into both surfaces that render `ProductCard` with these URLs:
- Home product list (`components/Lists/ProductsList.tsx`)
- Search product list (`app/search.tsx`)

## 4. Prefetch cap count

**8** images (`DEFAULT_PREFETCH_LIMIT`). First viewport only — never whole pages,
never subsequent infinite-scroll pages.

## 5. Are full-size images prefetched?

**NO.** Only the `?w=260&h=260&q=65` thumbnail variant is prefetched. Detail
gallery / full-screen / full-size images are **not** prefetched from the list
screens.

## 6. Validation result

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ Passes (`TSC_OK`). |
| `npx eslint hooks/useProductImagePrefetch.ts components/Lists/ProductsList.tsx app/search.tsx` | ✅ 0 errors. 1 **pre-existing** warning in `search.tsx:119` (`getCategoryName` in a `useMemo` dep array) — unrelated to this change. |
| Null/empty URL safety | ✅ Empty/`null` paths resolve to `''` and are filtered before `Image.prefetch`. |
| No infinite prefetch loop | ✅ Effect keyed on stable primitive + session `Set` dedupe. |
| Only sized thumbnail URLs requested | ✅ Hook uses identical `{260,260,65}` config as the card. |
| Pagination/fetch logic untouched | ✅ Hook reads the already-resolved `products` array; no query changes. |

Runtime checks (run the app — `npm start`) to confirm manually: product lists
still render, first visible images appear faster after the first query resolves,
scrolling is not worse, and the network panel shows only `?w=260&h=260&q=65`
requests.

## 7. Remaining optional work

- **Detail gallery prefetch on navigation** (audit F4, second half) — prefetch
  `ProductImageGallery` URLs when opening a product. Intentionally excluded here
  to keep the commit small/low-risk.
- **Search FlatList tuning** (audit F5) — add `removeClippedSubviews`,
  `initialNumToRender`, `maxToRenderPerBatch`, `windowSize` to `app/search.tsx`
  to mirror Home's list. Out of scope for this commit.
- **Backend/server work** (audit F1–F3, Phases 2–3) — Nginx cache headers +
  compression, WebP. Owned by the backend/server, not this repo.
