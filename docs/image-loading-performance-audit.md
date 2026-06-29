# Image Loading Performance Audit

Stage 1 — read-only. No code changed. Verified against current `develop`.

## 1. Executive Summary

**The frontend image layer is already well-built.** The app uses a single shared
`RemoteImage` component backed by **`expo-image`** (installed `~3.0.11`) with disk caching,
a blurhash placeholder, a 200 ms fade transition, `recyclingKey`, and a local fallback on
error. `ProductCard` is `memo`-ized, has **fixed image dimensions**, and already **requests a
downsized variant** via `?w=260&h=260&q=65`. So the usual RN image mistakes (raw `<Image>`,
no cache, unbounded sizes, inline URL recompute) are largely **not** present.

**Where the slowness almost certainly comes from is the server side**, which is not in this
repo (mobile-only; the .NET backend is separate per `CLAUDE.md`):

1. **The backend likely does not honor the `?w/h/q` resize params** (`resolveSizedImageUrl`'s
   own comment admits "if the backend ignores these query params, the original image is still
   served"). If so, a 130 px card downloads and decodes a **full-resolution original** — large
   transfer + slow decode = the visible delay. The frontend is already asking for thumbnails;
   the server must produce them.
2. **`IMAGE_BASE_URL` currently points at a LAN dev IP over HTTP** — `api.ts` is presently
   hardcoded `API_URL = DEV_API_URL_FALLBACK` (`http://192.168.0.111:5000`). Every image
   loads from that LAN host. Off-LAN (or on cellular) this is slow/timeouts; even on-LAN,
   Kestrel static serving without a CDN/Nginx cache is slower than production should be.
3. **Server caching/compression/format are unverified** — no `Cache-Control`, gzip/brotli,
   or WebP evidence in the repo. Without long cache headers + compression, every first load
   is a full, uncompressed transfer.

**Is it frontend rendering, caching, backend image size, or server headers?** Primarily
**backend image size (no server-side resize/thumbnails) + server host/headers**. It is **not**
a frontend rendering or cross-screen caching problem — expo-image already caches to disk and
reuses across screens.

**Top 3 recommended fixes**
1. **Backend thumbnails / honor `w/h/q`** — serve resized variants for cards/lists (the real fix).
2. **Serve `/product_images` via Nginx with long `Cache-Control` + compression** (and ideally WebP).
3. **Frontend (safe, immediate):** verify `IMAGE_BASE_URL` targets the real host in builds, add
   first-viewport **prefetch** after the product query resolves, and tune the search list’s FlatList.

## 2. Current Image Architecture

**Image components**
- **`components/shared/RemoteImage.tsx`** — the canonical wrapper. `expo-image` `<Image>` with
  `cachePolicy` (default `disk`), `placeholder={{ blurhash }}`, `transition`, `recyclingKey={uri}`,
  `onLoadEnd`/`onError`, and a `HanaLogoPlaceholder` fallback for empty/broken URLs.
- **`expo-image` `<Image>` used directly** in `app/categories.tsx` (category rows) alongside
  `SvgUri` (SVG category icons via `react-native-svg`).
- No `react-native-fast-image`; no raw RN `<Image>` for product imagery; no `ImageBackground` for products.

**URL builder** — `utils/imageUrl.ts`
- `resolveImageUrl(path)` → returns absolute URLs unchanged; otherwise prepends `IMAGE_BASE_URL`
  (from `api/api.ts`). Handles null/empty (`""`).
- `resolveSizedImageUrl(path, {width,height,quality})` → appends `?w=&h=&q=` size hints.

**Screens / components that render product-ish images**
| Surface | Component | Image path |
| --- | --- | --- |
| Home list | `components/Lists/ProductsList.tsx` → `ProductCard` | `RemoteImage` `w=260,h=260,q=65`, disk |
| Search | `app/search.tsx` → `ProductCard` | same |
| My listings | `components/shared/Cards/MyListingCard.tsx` | `RemoteImage` |
| Similar products | `components/ProductDetail/SimilarProductCard.tsx` | `RemoteImage` |
| Product detail gallery | `components/ProductDetail/ProductImageGallery.tsx` | `RemoteImage` (full-size, paging, `getItemLayout`) |
| Full-screen viewer | `components/ui/ImageViewer.tsx` | image viewer |
| Map bottom sheet | `components/Maps/MarkerDetailModal.tsx` | `RemoteImage` |
| Category icons | `app/categories.tsx` | `expo-image` + `SvgUri` |
| Profile / avatars | `modules/Profile/ProfileHeader.tsx`, `app/(settings)/my-profile.tsx`, chat | `RemoteImage` |

**Data flow:** API returns `main_image_url` (server-relative, e.g. `/product_images/abc.jpg`) →
`resolveImageUrl/resolveSizedImageUrl` builds the absolute URL → `RemoteImage`/`expo-image`
fetches (disk-cached by URL) → blurhash placeholder until `onLoadEnd`, fallback on error.

## 3. Findings

| ID | Severity | Area | Evidence | Impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| **F1** | **High** | Backend image size | `ProductCard` requests `?w=260&h=260&q=65`, but `resolveSizedImageUrl` comments that the backend may ignore them → full-size original served to a 130 px card | Large transfer + slow JPEG/PNG decode → late image paint, scroll jank | **Confirm + implement** server-side resize (honor `w/h/q`) or pre-generated thumbnails. *(Backend.)* |
| **F2** | **High** | Host / base URL | `api/api.ts` hardcodes `API_URL = DEV_API_URL_FALLBACK` (`http://192.168.0.111:5000`); `IMAGE_BASE_URL` derives from it | Off-LAN/cellular testing = very slow/timeouts; not production host | Ensure builds use the real HTTPS host/CDN; this dev override must not ship. *(Intentional dev override — see Do-Not-Touch.)* |
| **F3** | **Medium** | Server headers | No `Cache-Control`/compression/WebP evidence; static likely served by Kestrel, not Nginx | Every first load is a full, uncompressed transfer; weak cross-device cache | Serve `/product_images` etc. via Nginx with long `Cache-Control: immutable`, gzip/brotli, ideally WebP. *(Server.)* |
| **F4** | **Medium** | Prefetch | No `Image.prefetch` anywhere | Images only start loading when a card scrolls into view → perceived lateness | Prefetch first-viewport URLs after the product query resolves; prefetch detail gallery on navigation. *(Frontend, Phase 1.)* |
| **F5** | **Low/Med** | FlatList tuning (search) | `app/search.tsx` list lacks `removeClippedSubviews`/`initialNumToRender`/`maxToRenderPerBatch`/`windowSize` (Home’s `ProductsList` has them) | More simultaneous image decodes during fast scroll on the search screen | Mirror Home’s FlatList perf props on the search list. *(Frontend, Phase 1.)* |
| **F6** | **Low** | Cache duplication | Card uses sized URL (`?w=260…`), detail uses full-size → different cache keys | If backend ignores params, the card downloads full-size under a 2nd URL (double full-size) | Resolved once F1 lands (sized URL becomes a genuinely smaller asset). |
| **F7** | **Low** | Decode/memory (Android) | Full-size JPEG/PNG decode in lists (consequence of F1) | Scroll jank, memory pressure on low-end Android | Mitigated by F1 (smaller assets) + F5 (fewer concurrent decodes). |
| **F8** | **Info** | Component choice | `expo-image` already installed & used well; `RemoteImage` is shared/canonical | — | **Keep expo-image. Do not replace the library.** |

## 4. Slow Product Image Root-Cause Analysis

- **Why card images appear late:** the card mounts → `expo-image` requests the URL → on a cache
  miss it must download the asset and decode it before paint. If that asset is a **full-size
  original** (F1) fetched from a **LAN dev host over HTTP** (F2) **without compression/caching**
  (F3), the download+decode dominates the wait. The blurhash placeholder shows immediately, so
  the layout isn’t blocked — but the real image lands late.
- **Are images too large?** Almost certainly yes *on the wire*: the card asks for 260 px @ q65,
  but only the backend can deliver that. If it ignores the hints, the 130 px card pulls a
  multi-hundred-KB to multi-MB original.
- **Is caching missing?** No — expo-image disk-caches by URL and reuses across screens; the cost
  is the **first** load. Weak *server* `Cache-Control` (F3) only hurts cross-device/CDN reuse.
- **Does FlatList/rendering contribute?** Minor. Home’s list is well-tuned and `ProductCard` is
  memoized with fixed sizes (no layout shift). The search list is less tuned (F5), which amplifies
  concurrent decodes of large images — but that’s secondary to F1.
- **Do server headers contribute?** Yes (F3) — no compression/long-cache means heavier, repeated transfers.

**Conclusion:** the dominant cause is **server-delivered image weight** (no resize/thumbnail +
host/headers), not frontend rendering. The frontend is already doing the right things and is
ready to consume thumbnails the moment the backend provides them.

## 5. Optimization Options

| Option | Pros | Cons | Risk | Phase |
| --- | --- | --- | --- | --- |
| **A. expo-image / optimized component** | Already in place (`RemoteImage`) — caching, blurhash, transition, fallback | None — keep as-is; do not swap libraries | None | Done |
| **B. Shared `CachedImage` wrapper** | Already exists as `RemoteImage`; consolidate the few direct `expo-image` usages (categories) behind it | Tiny refactor; SVG icons must stay on `SvgUri` | Low | Phase 1 (optional) |
| **C. Placeholder / skeleton** | Already have blurhash + fallback; could add list skeletons for first paint | Marginal once F1 lands | Low | Phase 1 (optional) |
| **D. Prefetch first-viewport images** | Big perceived-speed win; safe; uses `expo-image` `Image.prefetch` | Slight extra data; cap to first N to avoid waste | Low | **Phase 1 (recommended)** |
| **E. Backend thumbnail generation** | **The real fix** — small assets for cards; honors `w/h/q` | Backend work (resize pipeline/variants), not in this repo | Medium | **Phase 3 / backend (highest impact)** |
| **F. Nginx cache headers + compression (+WebP)** | Long-cache + gzip/brotli + WebP dramatically cut transfer | Server config; coordinate with deploy/wwwroot layout | Medium | **Phase 2 / server** |
| **G. FlatList optimization (search)** | Cheap; fewer concurrent decodes; smoother scroll | Marginal alone; multiplies with F1/F4 | Low | Phase 1 |

(No clustering-style heavy dependency is relevant here; **do not replace expo-image**.)

## 6. Recommended Implementation Plan

**Phase 1 — safe frontend-only (no backend/API/auth changes)**
- F4: prefetch first-viewport product image URLs after the products query resolves (cap to the
  first ~8–10); prefetch the detail gallery URLs when navigating into a product.
- F5: add `removeClippedSubviews` / `initialNumToRender` / `maxToRenderPerBatch` / `windowSize`
  to the search list (mirror Home).
- F2 (verify only): confirm production/staging builds resolve `IMAGE_BASE_URL` to the real HTTPS
  host, not the LAN dev IP. (Do not edit the intentional local override blindly.)
- Optional B/C: route `app/categories.tsx` raster images through `RemoteImage`; add list skeletons.

**Phase 2 — server / cache / headers**
- F3: serve `/product_images`, `/profile_images`, `/category_icons` via Nginx with
  `Cache-Control: public, max-age=31536000, immutable`, gzip/brotli, and (ideally) WebP negotiation.

**Phase 3 — backend thumbnails / CDN (highest impact)**
- F1: generate resized variants (or honor `?w/h/q`) so cards/lists receive ~260 px thumbnails;
  keep originals for the detail gallery/full-screen viewer. Front a CDN if traffic grows.

## 7. Files Likely To Change (Stage 2, if approved — frontend Phase 1 only)

- `components/Lists/ProductsList.tsx` and/or a small prefetch hook/util — first-viewport prefetch (F4).
- `app/product/[id].tsx` / `ProductImageGallery` — prefetch gallery on detail open (F4).
- `app/search.tsx` — FlatList perf props (F5).
- (Optional) `app/categories.tsx` — route through `RemoteImage` (B); a new skeleton component (C).
- No change needed to `RemoteImage`/`imageUrl` for Phase 1 (already correct).

## 8. Do Not Touch List

- **`api/api.ts` `API_URL`/`IMAGE_BASE_URL` override** — currently hardcoded to the LAN dev IP on
  purpose; do not “fix” it as part of this work (verify build config instead).
- **Auth/token logic** (`auth-store`, `auth-bridge`, the 401 interceptor) — unrelated.
- **Upload logic** (`ImageUploader`, draft-image endpoints, create/edit forms).
- **Product fetching logic** (query hooks/params) — unless prefetch proves it’s required.
- **The image library choice** — keep `expo-image`; do not replace.
- **Backend API** — no contract changes in this phase (Phases 2–3 are owned by server/backend).
- **Map marker optimization** and other recently-shipped perf fixes.

*Stage 1 only — nothing implemented.*
</content>
