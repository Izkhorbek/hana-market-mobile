# Search FlatList Performance — Report

Frontend-only, minimal, reversible. Implements finding **F5** from
`docs/image-loading-performance-audit.md`: bring the Search product list's
FlatList up to the same tuning as Home's `ProductsList`.

## 1. What changed

Single file: `app/search.tsx` — added performance props to the **main vertical
product FlatList** only. No other change.

| Prop | Value | Why |
| --- | --- | --- |
| `removeClippedSubviews` | `true` | Detach off-screen rows from the native view tree → fewer concurrent image decodes / less memory during scroll. |
| `initialNumToRender` | `8` | Render ~one viewport on mount instead of the default 10; faster first paint. |
| `maxToRenderPerBatch` | `8` | Cap rows rendered per batch during scroll → smoother frame pacing. |
| `updateCellsBatchingPeriod` | `50` | Space batched renders 50 ms apart → less main-thread contention. |
| `windowSize` | `7` | Keep ~7 viewports of rows mounted instead of the default 21 → lower memory, fewer live image cells. |

These exactly mirror Home's `components/Lists/ProductsList.tsx`.

## 2. What was NOT changed

- **`keyExtractor`** — already present and stable (`(item) => item.id.toString()`),
  so it was left as-is (no change needed).
- **`getItemLayout`** — intentionally **not** added. `ProductCard`'s height is not
  fixed (the title uses `numberOfLines={2}`, so 1- vs 2-line titles change row
  height). A wrong fixed layout would cause scroll/position bugs. Skipped per the
  "only if item height is fixed and safe" rule.
- The **nested horizontal category-chips FlatList** (in `ListHeaderComponent`) —
  untouched; perf props apply to the vertical product list only.
- Product API, image prefetch hook, auth, search query/filter logic, and UI
  layout — all untouched.

## 3. Behavior preserved

- **Infinite scroll:** `onEndReached={handleLoadMore}` + `onEndReachedThreshold={0.4}`
  unchanged; `handleLoadMore` still guards on `hasNextPage && !isFetchingNextPage`.
- **Pull-to-refresh:** `refreshControl` (`isRefreshing` / `refetch`) unchanged.
- **Empty / loading / error / footer** states unchanged.

`removeClippedSubviews` + `windowSize` only affect how many rows are mounted at
once; they do not change data, ordering, or which items load.

## 4. Validation

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | ✅ Passes (`TSC_OK`). |
| `npx eslint app/search.tsx` | ✅ 0 errors. 1 **pre-existing** warning at `search.tsx:119` (`getCategoryName` in a `useMemo` dep array) — unrelated to this change. |

Manual runtime checks to confirm (`npm start`): search list still renders and
scrolls, pull-to-refresh works, infinite scroll loads more pages, and fast
scrolling is smoother / lower memory than before.

## 5. Remaining optional work

- Detail gallery prefetch on navigation (audit F4, second half).
- Backend/server caching + compression + WebP (audit F1–F3, Phases 2–3).
