# Product Detail Image Loading — Fix Report

Frontend-only, minimal, reversible. Fixes the slow hero-image load on the product
detail page by requesting backend-resized variants instead of full-size originals.
No backend, API, query, upload, layout, or `ImageViewer` changes.

## 1. Root cause (recap)

The detail hero gallery (`ProductImageGallery`) rendered `RemoteImage` **without**
size hints, so `resolveImageUrl` returned the bare `/product_images/<file>.jpg`
(no `?w/h/q`). A full-width hero therefore downloaded and decoded the **full
~2.5MB original** before becoming visible. The list card's already-cached 260px
thumbnail could not be reused (different, unsized URL → different cache key). The
backend resize that makes list cards fast was simply unused on the detail page.

## 2. What changed

| File | Change |
| --- | --- |
| `components/ProductDetail/ProductImageGallery.tsx` | Added constants `HERO_IMAGE_WIDTH = 1080`, `HERO_IMAGE_QUALITY = 80`; passed `requestedWidth`/`requestedQuality` to the hero carousel `RemoteImage`. |
| `app/product/[id].tsx` | Sticky-header `RemoteImage` now passes `requestedWidth={120}` / `requestedQuality={65}`. |
| `docs/product-detail-image-loading-fix-report.md` | This report. |

### ProductImageGallery.tsx
- Hero slides now request `?w=1080&q=80` (resized variant). Only width is passed —
  **no `requestedHeight`** — so the backend keeps the original aspect ratio and
  `contentFit: cover` crops to the hero box (no distortion).
- Fixed `1080` (not device-width) → **stable URLs** for server cache reuse and no
  per-device cache fragmentation. Quality `80` (> list's `65`) since it's focal.
- Carousel virtualization (`initialNumToRender=1`, `getItemLayout`, `windowSize=3`),
  paging, dots/counter, and `onImagePress` — **all unchanged**.

### app/product/[id].tsx
- The 50×50 sticky thumbnail requests `?w=120&q=65` instead of a second full-size
  download. Source fallback logic (`productMainImage ?? images[0]`) unchanged.

### Explicitly NOT changed
- **`ImageViewer` / full-screen zoom** still uses the **original** image URLs
  (its `RemoteImage` passes no size hints) → zoom quality unaffected.
- ProductCard / list prefetch, product API, query/fetch logic, image-upload flow,
  and the detail page layout — all untouched.

## 3. Validation

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ Passes (`TSC_OK`). |
| `npx eslint components/ProductDetail/ProductImageGallery.tsx app/product/[id].tsx` | ✅ 0 errors. 3 **pre-existing** warnings (`[id].tsx:31` default-import naming, `[id].tsx:238` `productImages` useMemo dep, `ProductImageGallery.tsx:38` `urls` useCallback dep) — all in code not touched by this change. |

## 4. Manual QA checklist

Run on a throttled/slow network (`npm start`):

- [ ] Open a product from Home/Search → hero image appears far faster (blurhash →
      sharp quickly) instead of a long blank/blurhash wait.
- [ ] **Network inspector:** hero requests carry `?w=1080&q=80`; **no** bare
      full-size `/product_images/*.jpg` for the hero.
- [ ] Sticky-header image request carries `?w=120&q=65`.
- [ ] Swipe carousel → slides 2..N load progressively, each small.
- [ ] Tap a slide → full-screen viewer opens the **original** (crisp at max zoom);
      confirm that request is the bare original URL (expected).
- [ ] Broken/null `images` → Hana logo fallback, no crash.
- [ ] Back→forward to same product → served from cache, no re-download.
- [ ] Android real device: parallax/scroll smooth; lower memory (smaller decode).

## 5. Risks & rollback

- If the backend ignores `?w/q` on these paths, the URL returns the original (same
  as today) → **no regression**, only no gain. (List cards already prove resize is
  honored.)
- Slightly softer hero than a 4000px original on large tablets — mitigated by
  `1080 @ q80`; full-screen zoom still serves the original.
- **Rollback:** remove the two constants + the two props in `ProductImageGallery`,
  and the two props on the sticky `RemoteImage`. Single-commit, trivially reversible.

## 6. Remaining optional (deferred) work

- Prefetch the hero image on list-card press (audit F4) — partial win because the
  list has `main_image_url` while the gallery slide 0 is `images[0]`.
- `initialData` from the list cache for instant title/price (shape differs from
  `SingleProductResponseDto`; riskier).
- Backend/server caching + compression + WebP (audit F1–F3).
