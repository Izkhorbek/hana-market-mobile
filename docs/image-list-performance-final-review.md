# Image / List Performance — Final Pre-Release Review

Scope: review-only of the prefetch (Phase 1) and Search FlatList tuning changes
before commit/release. **No code changed** during this review — no blocker found.

Files reviewed: `hooks/useProductImagePrefetch.ts`,
`components/Lists/ProductsList.tsx`, `app/search.tsx`,
`components/shared/RemoteImage.tsx`, `utils/imageUrl.ts`, and the two prior
reports.

## 1. Checklist results

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Cards use thumbnail URLs, not full-size | ✅ | `ProductCard` passes `requestedWidth=260 requestedHeight=260 requestedQuality=65` → `RemoteImage` → `resolveSizedImageUrl` → `?w=260&h=260&q=65`. |
| 2 | Prefetch uses the exact same thumbnail URL as the card | ✅ | Hook calls `resolveSizedImageUrl(path, {width:260,height:260,quality:65})` — identical config → identical cache key. |
| 3 | Prefetch caps to first 8 | ✅ | `DEFAULT_PREFETCH_LIMIT = 8`; `imagePaths.slice(0, limit)` in both the dep key and the effect. |
| 4 | Dedupes + no infinite loop | ✅ | Batch `new Set`, module-level session `Set` (`prefetchedUrls`), and effect keyed on a stable primitive (`firstPathsKey`) — marked before firing. |
| 5 | Does not block rendering | ✅ | `Image.prefetch(...).catch(() => {})` inside `useEffect`, not awaited; runs after paint. |
| 6 | No full-size/detail images prefetched from lists | ✅ | Only the 260px variant; no gallery/detail prefetch anywhere in list screens. |
| 7 | Home `ProductsList` behavior unchanged | ✅ | Only added one import + one fire-and-forget call after `isInitialLoading`; query, pagination, render, FlatList props untouched. |
| 8 | Search FlatList unchanged except perf props | ✅ | Added `removeClippedSubviews`, `initialNumToRender=8`, `maxToRenderPerBatch=8`, `updateCellsBatchingPeriod=50`, `windowSize=7`; nothing else. |
| 9 | Pull-to-refresh + infinite scroll still work | ✅ | `refreshControl` (`isRefreshing`/`refetch`) and `onEndReached={handleLoadMore}` + `onEndReachedThreshold={0.4}` unchanged on both lists. |
| 10 | Empty/error/loading states untouched | ✅ | `renderEmptyState`, error view, `loadingOverlay`, footer loader all unchanged. |
| 11 | No unsafe `getItemLayout` on Search | ✅ | Not added; `ProductCard` height is variable (`numberOfLines={2}` title), so it was correctly omitted. |
| 12 | tsc + eslint pass | ✅ | `tsc --noEmit` → `TSC_OK`. eslint → 0 errors (see Low-1). |

## 2. Risk register

**Blockers:** none.

**High:** none.

**Medium:** none.

**Low**
- **L1 — Pre-existing eslint warning.** `app/search.tsx:119` —
  `useMemo has a missing dependency: 'getCategoryName'`. Pre-existing, in code
  not touched by this work, and behaviorally harmless (`getCategoryName` only
  reads `locale`, which is already a dep). Not a release gate; fix opportunistically.
- **L2 — Session dedupe Set grows unbounded.** `prefetchedUrls` is never cleared
  for the app's lifetime. URLs are bounded by the catalog the user actually
  scrolls past (first-8 per resolved query/page), so growth is small strings only
  — negligible memory. Acceptable; no action needed for release.
- **L3 — No re-warm after cache eviction.** If expo-image evicts a disk entry,
  the session Set prevents re-prefetching it. Impact is nil: the card simply
  loads it normally on view (same as today without prefetch). Acceptable.
- **L4 — `disk` cache policy match.** Prefetch uses `'disk'`, matching the card's
  `cachePolicy='disk'`. Correct; noted so a future change to either side keeps
  them aligned.

## 3. Release recommendation

**GO.** The changes are additive, frontend-only, and reversible. Prefetch is
fire-and-forget and cannot block or crash the list (errors swallowed; null/empty
paths filtered to `''` before `Image.prefetch`). FlatList tuning mirrors Home's
already-shipped config. No backend/API/auth/query/layout changes. `tsc` clean,
eslint clean (one unrelated pre-existing warning).

## 4. Manual Android QA checklist

Run a staging/preview build (`npm run build:android:preview`) or `npm start`:

- [ ] **Home list** renders; first 8 product thumbnails appear quickly after the
      list resolves (visibly faster on a cold cache than before).
- [ ] **Search**: type a query → results render; first thumbnails appear quickly.
- [ ] **Network inspector**: image requests are only `?w=260&h=260&q=65` — no
      full-size originals fetched from list screens.
- [ ] **Null/empty image** product shows the Hana logo fallback, no crash.
- [ ] **Scroll** Home and Search fast → smooth, no blank-row storms, no jank
      regression vs. before; memory stable on a low-end device.
- [ ] **Pull-to-refresh** on both lists works and re-populates.
- [ ] **Infinite scroll** loads more pages on both lists; footer spinner shows.
- [ ] **Empty / error / loading** states still display correctly (no location,
      no results, network error → retry).
- [ ] **Offline**: open lists with no network → no crash; cards fall back; coming
      back online loads images.
- [ ] **Repeat navigation** Home ⇄ Search ⇄ detail → no duplicate/looping image
      requests for already-prefetched URLs.

## 5. Commit readiness

**Ready to commit.** Suggested grouping (frontend Phase 1 perf):
- `hooks/useProductImagePrefetch.ts` (new)
- `components/Lists/ProductsList.tsx`
- `app/search.tsx`
- `docs/product-image-prefetch-report.md`,
  `docs/search-flatlist-performance-report.md`,
  `docs/image-list-performance-final-review.md`

Not committed automatically (per instruction). No outstanding blockers.

## 6. Remaining optional (post-release) work

- Detail gallery prefetch on navigation (audit F4, second half).
- Backend/server caching + compression + WebP (audit F1–F3, Phases 2–3).
- Opportunistic: clear L1 eslint warning.
