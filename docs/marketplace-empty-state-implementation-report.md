# Marketplace Contextual Empty States — Implementation Report

Adds a small, reusable, contextual empty-state system for the marketplace lists
so new ad-traffic users never see a "dead app." Only the **empty-data** state was
changed; loading and error states (incl. the Fix E error classifier) are intact.

## Files changed

| File | Change |
| --- | --- |
| `components/shared/MarketplaceEmptyState.tsx` | **New.** Reusable, dependency-light component (theme colors + lucide icons already in the app). Exports default component + `EmptyReason` type. |
| `components/Lists/ProductsList.tsx` | Replaced the generic `ListEmpty` text block with `<MarketplaceEmptyState>`; added reason derivation + a location-enable handler reusing existing utils. Loading + error branches untouched. |
| `app/search.tsx` | Replaced the `renderEmptyState` text with `<MarketplaceEmptyState>` + a clear-filters handler. Error/loading branches untouched. |
| `locales/en.json`, `locales/ru.json`, `locales/uz.json` | Added the `empty_states` namespace (6 reasons × title/description/primary/secondary). |
| `docs/marketplace-empty-state-implementation-report.md` | This report. |

Component placed under `components/shared/` (the project's actual common-component
convention — there is no `components/common/`).

## Component

```ts
type EmptyReason =
  | 'NO_LOCATION' | 'NO_NEARBY_PRODUCTS' | 'NO_CATEGORY_PRODUCTS'
  | 'NO_SEARCH_RESULTS' | 'FILTER_TOO_STRICT' | 'NEW_REGION'
```

Props: `reason`, `isLoggedIn?`, and the 7 optional action handlers
(`onEnableLocation`, `onSelectManualLocation`, `onExpandRadius`, `onClearFilters`,
`onCreateListing`, `onBrowseCategories`, `onShareApp`).

UI: icon bubble + title + description + primary (filled) + secondary (outline)
buttons. Fully theme-driven (light/dark). **A button renders only when its handler
is supplied** — so each screen controls which actions appear, and unwired/deferred
actions stay hidden automatically.

Each reason fixes its icon + i18n sub-key + which two action slots it offers:

| reason | icon | primary action | secondary action |
| --- | --- | --- | --- |
| NO_LOCATION | MapPin | enable location | manual location |
| NO_NEARBY_PRODUCTS | Store | expand radius | create listing |
| NO_CATEGORY_PRODUCTS | PackageOpen | create listing | browse categories |
| NO_SEARCH_RESULTS | SearchX | clear filters | expand radius |
| FILTER_TOO_STRICT | SlidersHorizontal | clear filters | expand radius |
| NEW_REGION | Compass | create listing | share app |

## Reason mapping

**Home list (`ProductsList`)** — signals available: user location + selected category.
```
!hasLocation                  → NO_LOCATION
selectedFilter !== 'all'      → NO_CATEGORY_PRODUCTS
else (all + has location)     → NO_NEARBY_PRODUCTS
```

**Search screen (`app/search.tsx`)** — signals: query + category chip.
```
debouncedQuery present        → NO_SEARCH_RESULTS
selectedCategoryId present    → FILTER_TOO_STRICT
else                          → NO_NEARBY_PRODUCTS
```

Covers requirements 4 (search), 5 (category), 6 (location), 7 (filters). For
requirement 8, `NEW_REGION` needs a backend "new area" signal that the client does
not have; the Home all-category empty therefore uses `NO_NEARBY_PRODUCTS`, whose
copy is already the positive new-region message ("this area is just developing…").
`NEW_REGION` is fully built and ready to wire when such a signal exists.

## i18n keys (added)

Namespace `empty_states` in uz/ru/en, each with `title`, `description`, `primary`,
`secondary`:
`no_location`, `no_nearby`, `no_category`, `no_search`, `filter_too_strict`,
`new_region`. Uzbek copy matches the brief verbatim; `filter_too_strict` copy was
authored (no brief copy given) in the search/filters voice.

## Actions wired

| Action | Behavior | Reuses |
| --- | --- | --- |
| Create listing | `router.push('/(post)/create')` | existing post flow (same as Home FAB) |
| Browse categories | `router.push('/categories')` | existing categories screen (same as HomeHeader) |
| Clear filters (Home) | n/a for Home reasons | — |
| Clear filters (Search) | resets query + category state | local search state |
| Expand radius | `router.push('/(settings)/manage')` | existing neighborhood/radius manager |
| Manual location | `router.push('/(settings)/manage')` | existing neighborhood manager |
| Enable location | `getCurrentLocationSafe()` → `updateLocation()` → `refetch()` | existing `utils/location` + auth-store `updateLocation` (no new API) |

Enabling location updates `user.latitude/longitude`, which changes the query
params so the list refetches automatically; `refetch()` covers the same-coords case.

## Actions deferred

- **Share app** — `react-native` `Share` IS already used elsewhere, but `NEW_REGION`
  (its only consumer) is not wired into any screen yet (no new-region signal), so
  `onShareApp` is currently unused in integration. Wire `Share.share(...)` when
  `NEW_REGION` is enabled.
- **Dedicated "expand radius" inline control** — there is no in-place radius
  stepper on Home/Search; "expand radius" deep-links to the existing radius manager
  (`/(settings)/manage`) instead of mutating radius inline. A future inline
  `+radius` could call the existing `updateLocation(lat, lng, radiusKm)`.

## What was NOT changed (confirmation)

- **Auth single-source logic / token refresh** — untouched. `ProductsList` only
  *reads* `user`, `isHydrated`, `isAuthenticated`, `updateLocation` (the last was
  already part of the store).
- **Backend API** — no endpoints or params changed; `updateLocation`/location utils
  are existing.
- **Product fetching** — query hooks, params, `enabled` gating, pagination, and
  pull-to-refresh are unchanged. The empty state renders from already-fetched
  results; it never blocks or triggers extra fetches (beyond the user-initiated
  location refetch).
- **Fix E error messages** — the `isError` branch and `classifyGeoApiError`
  mapping are byte-for-byte unchanged in both `ProductsList` and `search.tsx`.
- **Manner Temperature / guidance modals** — not touched.

## Build / lint result

- `npx tsc --noEmit` → **PASS** (exit 0).
- `npx eslint` on the 3 changed TS/TSX files → **PASS** (0 errors). One
  pre-existing `react-hooks/exhaustive-deps` warning remains in `search.tsx`'s
  `categoryChips` useMemo — unrelated to this change.

## Manual QA checklist

Home (`ProductsList`):
1. New user, location not set, empty list → **NO_LOCATION**: "Enable location" +
   "Choose manually". Tapping Enable requests permission and, on success, loads
   nearby results.
2. Location set, category (Things/Cars/Works) with no items → **NO_CATEGORY_PRODUCTS**:
   "Post a listing" + "Browse other categories".
3. Location set, "All" with no items → **NO_NEARBY_PRODUCTS**: "Expand radius" +
   "Post a listing".
4. Each primary/secondary button navigates to the right screen.

Search (`app/search.tsx`):
5. Type a query with no matches → **NO_SEARCH_RESULTS**: "Clear filters" +
   "Expand radius". Clear resets query + category and re-shows results.
6. Select a category chip (no query) with no items → **FILTER_TOO_STRICT**.
7. No query + no category + empty → **NO_NEARBY_PRODUCTS**.

Cross-cutting:
8. Toggle dark mode → icon bubble, text, and buttons all themed correctly.
9. Switch language uz/ru/en → all titles/descriptions/buttons localized; layout holds.
10. Trigger a real error (airplane mode / 5xx) → the **Fix E error** state shows
    (not an empty state); loading spinner still shows while fetching.
11. Pull-to-refresh still works from the empty state.

Screenshots: capture states #1, #2, #3 (Home) and #5, #6 (Search) in light + dark,
in all three languages, for the launch QA gallery. *(Not auto-captured here — run
the app to grab them.)*

---
*No commit performed, per instructions.*
</content>
