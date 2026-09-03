# Frontend Sync Audit — Backend Deltas (2026-08)

> **Direction:** this is the reverse of `BACKEND_FINAL_SPEC.md`. The backend has been
> implemented and, in a few places, has **moved ahead of or changed** the contract the frontend
> assumed. This document lists what the **frontend must adapt to**. Where a row says
> "no client change", the backend stayed compatible — it's here so you can verify.
>
> **Envelope unchanged:** `ApiResponse<T>` `{ success, message, data, errors, status_code }`,
> `PaginatedResponse<T>` `{ items, current_page, page_size, total_records }`. All fields snake_case.

---

## 0. Change summary

| # | Area | Change | Frontend action |
|---|------|--------|-----------------|
| 1 | **Territory** | NEW `GET /api/region`, `GET /api/district?region_id=` | 🔴 Build region→district onboarding cascade |
| 2 | **Mahalla list** | `district_id` filter added; `MahallaDto` gains `district_id`, `region_id` | 🟠 Filter by `district_id`; read new fields |
| 3 | **Distributors** | `GET /api/mahalla/{id}/distributors` now returns the **district's** distributors | 🟢 Same URL/shape — update UX copy only |
| 4 | **Gas — cycle removed** | All `/api/gas/cycles/*` deleted; `GasCycleDto`/`CycleHouseholdDto`/`GasCycleStatus` gone | 🔴 Remove all cycle UI + calls |
| 5 | **Gas — session cancel** | NEW `POST /api/gas/sessions/{id}/cancel`; `GasSessionStatus` gains `cancelled` | 🟠 Add cancel action + handle status |
| 6 | **Gas — fairness** | Automatic (queue auto-seeded on session create); no cycle to open/close | 🟢 Drop any "davr" concept from UI |
| 7 | **Gas — warning event** | `GasCycleWarning` now = out-of-turn delivery (accountability), not force-close | 🟠 Re-label the toast; `cycle_number` is always 0 |
| 8 | **Gas — create role** | Session create now allowed for **distributor** too (manager = admin/rais/distributor) | 🟢 Show "new session" to distributors |
| 9 | **Mahalla membership** | **One membership total per user.** Joining a *different* mahalla **moves** the user (no second membership) → role reset to `resident`, re-verification required | 🟠 Treat join-as-switch; expect role/verified to reset when switching |
| 10 | **Gas confirm** | Requires a **verified** member; blocked on finished sessions | 🟠 Hide/disable confirm for pending members + finished sessions |
| 11 | **Pagination** | `page_size` clamped server-side (max 200) | 🟢 Don't request unbounded pages |
| 12 | **`/my` household** | `MahallaMemberDto` gains a nested `household` object (or `null`) | 🟠 Read `household` from `/my` instead of a second call |
| 14 | **Product create — location** | `latitude`/`longitude` are now **optional**. Omit them and the listing inherits the seller's saved profile address | 🟠 Stop auto-reading GPS on Post; offer "my address" (omit coords) vs "pick on map" (send coords) |
| 15 | **Profile address** | `POST /api/user/update/location` now also moves the seller's `profile`-sourced listings, and rejects a 0/negative coordinate pair with 400 | 🟢 Keep sending real coordinates (you already do); expect listings to follow the profile |
| 16 | **Product detail address** | `SingleProductResponseDto` gains `address_name` (the LISTING address) + `location_source` | 🔴 Stop falling back to `seller.address_name` for the listing address |
| 17 | **Mahalla name** | List + detail responses gain `mahalla_name` (detail also `mahalla_id`) | 🟠 Show the MFY name as the place label; fall back to distance when null |
| 18 | **Feed scope** | `GET /api/product/all` and the category list accept `scope=radius\|mahalla`; the paged payload now carries `applied_scope` | 🟢 Optional. Default is unchanged; label the feed from `applied_scope` |
| 19 | **Coordinate precision** | Public responses round `latitude`/`longitude` to 3 decimals (~100 m). The owner still gets the exact point on `/product/{id}` and `/{id}/edit` | 🟢 Nothing to change; do not treat the pin as house-accurate |

---

## 1. Territory — region → district (NEW) 🔴

Onboarding now cascades **region → district → mahalla** (mahalla search can filter by district).

```
GET /api/region                      public → ApiResponse<RegionDto[]>        // all regions, name ASC
GET /api/district?region_id={id}     public → ApiResponse<DistrictDto[]>      // region_id required; name ASC
```
```ts
RegionDto   { id: number; name: string }
DistrictDto { id: number; region_id: number; name: string }
```
- `region_id` is required on `/api/district`; missing/0 → 400.
- Data seeded: 14 regions, 179 districts. Mahallas seeded for **Toshkent shahri** and **Farg'ona**
  only (others: none yet — a district may legitimately have 0 mahallas in the picker).

## 2. Mahalla list + DTO 🟠

```
GET /api/mahalla?district_id=&region=&district=&search=   auth → ApiResponse<MahallaDto[]>
```
- **NEW** `district_id` (number) filter — the **preferred** filter now. `region`/`district`
  string params are legacy (kept, still work). `search` unchanged.
```ts
MahallaDto {
  id: number; name: string;
  district: string; region: string;          // legacy display names (kept)
  district_id: number | null;                // NEW — normalized FK
  region_id:   number | null;                // NEW — via district → region
}
```
- `district_id`/`region_id` are **nullable** (a not-yet-normalized mahalla can be null) — code defensively.
- `MahallaMemberDto.mahalla` carries the same shape, so `/my` also exposes the new fields.

## 3. Distributors — now district-scoped 🟢 (behavior change, same contract)

```
GET /api/mahalla/{id}/distributors   auth (member) → ApiResponse<MahallaDistributorDto[]>
```
- **Same URL, method, and DTO** — but it now returns **every distributor company serving the
  mahalla's district**, not only the ones tied to that one mahalla. No client code change; update
  any copy that implies "this mahalla's distributor" → "district's distributors".
- (Admin dashboard only: distributor create/update now requires `district_id`. Not a mobile call.)

## 4. Gas — the "Davr (cycle)" concept is REMOVED 🔴 BREAKING

- **Deleted endpoints:** `POST /api/gas/cycles`, `PATCH /api/gas/cycles/{id}/cancel`,
  `GET /api/gas/cycles/current`, `GET /api/gas/cycles/{id}/households`.
- **Deleted types:** `GasCycleDto`, `CycleHouseholdDto`, `GasCycleStatus`. Remove all cycle
  screens, calls, and the "open/close davr" flow.
- **Fairness is automatic** (§6): the backend keeps a per-mahalla resume pointer + previous
  skipped list and auto-seeds each new session's queue (previously-skipped first, then resume).
  Nothing for the client to manage.

### 4.1 Current gas surface (unchanged unless noted)
```
POST   /api/gas/sessions                         manager(admin/rais/distributor) → GasSessionDto  // §8 role widened
GET    /api/gas/sessions?mahalla_id=&current_page=&page_size=   rais/admin → PaginatedResponse<GasSessionDto>
GET    /api/gas/sessions/active?mahalla_id=       member → GasSessionDto | null   // planned|active|paused only
GET    /api/gas/sessions/{id}                     member → GasSessionDetailDto
GET    /api/gas/sessions/{id}/my-status           member → GasHouseholdStatusDto
POST   /api/gas/sessions/{id}/start|pause|complete  admin → GasSessionDto
POST   /api/gas/sessions/{id}/cancel              admin → GasSessionDto            // NEW (§5)
PATCH  /api/gas/sessions/{id}/position            admin/distributor → GasSessionDto
PATCH  /api/gas/sessions/{id}/households/{hh}/status  admin/distributor → GasHouseholdStatusDto
POST   /api/gas/sessions/{id}/households/{hh}/confirm resident → GasHouseholdStatusDto   // §10 rules
```

## 5. Gas — session cancel + `cancelled` status 🟠

```
POST /api/gas/sessions/{id}/cancel   admin → ApiResponse<GasSessionDto>
```
- Cancels a **planned/paused** session → `status = "cancelled"`. Not a completion (silent, no event).
- `GasSessionStatus = "planned" | "active" | "paused" | "completed" | "cancelled"` — handle the new value.
- `GET /sessions/active` returns **only** planned/active/paused → a cancelled/completed session
  disappears from "active" (returns `null`). Show it via session **history** instead.

## 6. Gas — fairness is automatic 🟢

No cycle. On `POST /api/gas/sessions` the backend seeds the household queue: **previously-skipped
households first, then resuming from where gas last stopped**. On complete/pause it snapshots the
resume pointer + skipped list. The frontend just renders the session queue in the order returned.

## 7. Gas — `GasCycleWarning` repurposed 🟠

The SignalR event name is unchanged (kept for compatibility) but its meaning changed:
```
GasCycleWarning { mahalla_id, cycle_number, forced_by_user_id, unserved_count, reason }
```
- Fires when a household is served **out of turn** (accountability signal), NOT on a cycle
  force-close (cycles no longer exist). `cycle_number` is always `0` — don't display it.
- `reason` is a human message (e.g. "Navbat buzildi — …"). `unserved_count` = households skipped over.
- The other 4 gas events (`GasSessionStarted`, `GasPositionUpdated`, `GasHouseholdStatusChanged`,
  `GasSessionCompleted`) are unchanged.

## 8. Gas — session-create role widened 🟢

`POST /api/gas/sessions` now accepts **distributor** in addition to admin/rais. Surface the
"start a session" entry point to distributor accounts too.

## 9. Mahalla — one membership per user; join = switch 🟠

A user now has **exactly one** membership. `POST /api/mahalla/join`:
- **Same mahalla** → just re-links the household (role/verification kept).
- **A different mahalla** → **moves** the user there (no second membership is created). The moved
  membership is reset to **`role: "resident"`** and **`is_verified: false`** — the new mahalla's
  rais must re-verify. The household they owned in the old mahalla is released.

Frontend implications:
- Treat "join" as a **switch**, not an additive membership. If the user was an admin/rais/distributor
  in their old mahalla, joining a new one **demotes them to a pending resident** — reflect this in
  any confirm dialog ("Switching mahalla will reset your role").
- `GET /api/mahalla/my` always returns a single membership — trust its `role`/`is_verified`.

## 12. `/my` — nested `household` object 🟠

`GET /api/mahalla/my` (`MahallaMemberDto`) now includes the caller's claimed household inline, so
no second call is needed:
```ts
MahallaHouseholdDto { id: number; house_number: string; address_label: string | null; is_verified: boolean }

MahallaMemberDto {
  id; mahalla_id; user_id; role; is_verified;
  household_id: number | null;
  mahalla: MahallaDto;
  household: MahallaHouseholdDto | null;   // NEW — null when no household is claimed
}
```
- `household` is `null` when `household_id` is null (no claim yet) — code defensively.
- Only `/my` populates `household`. Other member responses (join, role updates, rais panel) still
  return `household: null` — read household details from `/my`.

## 10. Gas confirm — verified + open-session only 🟠

`POST /api/gas/sessions/{id}/households/{hh}/confirm`:
- Returns 403 unless the caller is a **verified** member (a pending, not-yet-approved member can't confirm).
- Returns 400 if the session is already `completed`/`cancelled`.
- MVP semantics unchanged: only `received: true` (→ delivered). Residents never send skip.

Disable/hide the "Oldim" (received) button for pending members and for finished sessions.

## 11. Pagination clamp 🟢

`page_size` is clamped server-side (max 200; invalid → default). Requests for huge pages return a
bounded page, not an error — just don't rely on fetching everything in one call.

---

## 14. Product create — listing location is no longer the posting-time GPS 🟠

`POST /api/product/create`: `latitude` and `longitude` are now **optional**.

| What the client sends | What the backend stores |
|---|---|
| `latitude` + `longitude` | those coordinates, `location_source = custom` |
| neither field | the seller's saved `users.latitude/longitude` + `address_name`, `location_source = profile` |
| neither field, and the profile has no address (0,0) | **400** `"No saved profile address. Set your address first, or send the listing coordinates."` |

Sending a `0` or negative pair is still rejected with the existing `"Geo-location must be sent."`
— unchanged for current clients.

**Why:** the create forms call `getCurrentLocationSafe()` at submit and post the device position as
the listing address, so a seller who posts from work gets a listing pinned at work while their
profile says home. Existing clients keep working untouched (they always send coordinates, so every
new listing is simply labelled `custom`). The intended UX is a location field pre-filled with the
profile address — **omit the coordinates** for that — plus an explicit "pick on the map" option
that sends coordinates.

> Related client bug found while verifying this: `auth.tsx` guards with `latitude == null`, but the
> API returns `0` (the column is `NOT NULL DEFAULT 0`), never `null`. A user who denied location at
> onboarding is therefore never re-prompted and stays at `(0,0)` — which also excludes them from
> "new listing nearby" pushes. Check `!latitude || !longitude` instead.

---

## 15. Profile address changes now move `profile`-sourced listings 🟢

`POST /api/user/update/location` updates the profile row **and**, in the same transaction,
re-points every listing of that seller with `location_source = 'profile'` and status
`active`/`reserved`/`hidden` at the new address. `custom` and `legacy` listings never move, and
neither do sold/deleted ones.

Two client-visible consequences:

1. A 0 or negative `latitude`/`longitude` is now rejected with 400 `"Geo-location must be sent."`
   `[Required]` on a non-nullable decimal never caught an omitted field, so it used to be stored
   as `0` — which now would relocate the seller's listings too. Current clients always send real
   coordinates, so nothing changes for them.
2. Moving your address moves the listings you chose to publish under it. That is the point of the
   `profile` source — a listing that must stay put should be created with explicit coordinates
   (`custom`, see §14).

---

## 16. Product detail — the listing address is its own field 🔴

`GET /api/product/{id}` (`SingleProductResponseDto`) gains two fields:

| Field | Meaning |
|---|---|
| `address_name` | the **listing** address. `null` on listings created before migration 023 |
| `location_source` | `profile` \| `custom` \| `legacy` — where the coordinates came from |

`seller.address_name` is unchanged and still returned, but it is the **seller's own** address —
it belongs on the seller card, not on the listing.

**The line to change** is `app/product/[id].tsx:959`:

```js
// now: falls back to the SELLER address when the listing has no landmark
{productMoljal ? productMoljal : productSellerLocation}

// should be: landmark, then the listing address, then nothing
{productMoljal || product?.address_name || ''}
```

Showing nothing beats showing the wrong place. A `legacy` listing may have neither `moljal` nor
`address_name`; the map pin (`latitude`/`longitude`) still works and remains the source of truth
for distance.

The same fallback appears at `[id].tsx:1091` and `:1094` for the meeting-location card — those
already use `moljal` only, so they need no change.

---

## 17. Listings now carry their mahalla name 🟠

| Response | New fields |
|---|---|
| `AllProductResponseDto` (`/all`, `/categories/{id}/products`, `/seller/{id}/products`) | `mahalla_name` |
| `SingleProductResponseDto` (`/product/{id}`) | `mahalla_name`, `mahalla_id` |

**Expect null often.** A listing gets a mahalla only when **both** hold: the seller has a
`mahalla_member` row, and the listing is `profile`-sourced. A `custom` listing (the seller sent
explicit coordinates, see §14) never carries one — it may sit in a different mahalla or a
different city, and the schema has no boundaries to tell which. Treat `mahalla_name` as optional
and keep the distance label as the fallback:

```js
{product.mahalla_name || product.distance}
```

**Why it is worth wiring up now:** "Chilonzor 12-MFY" tells a local user more than "1.2 km", and
a mahalla-scoped feed is where discovery is heading — the name is the label that feed will sort
and group by. Building the UI against the field now means the switch is a data change, not a
redesign.

The tag also follows the seller: joining or switching a mahalla re-points their listable
listings, and being removed from a mahalla clears it. Sold and deleted listings keep whatever
they had, as history.

The default feed still uses the same coordinates + radius it always has; see §18 for the
opt-in mahalla scope.

---

## 18. Feed scope: `radius` (default) or `mahalla` 🟢

`GET /api/product/all` and `GET /api/product/categories/{id}/products` take an optional `scope`:

| `scope` | Which listings come back |
|---|---|
| omitted / `radius` | **unchanged** — within the caller's saved search radius of `user_lat`/`user_long` |
| `mahalla` | every listing in the caller's own MFY, whatever the distance |

`user_lat`/`user_long` stay required in both cases: `distance` is still returned for display, it
just stops deciding what is in the feed under `mahalla`.

An **explicit** `scope=mahalla` returns **400** for a guest, and **400** for a signed-in user with
no mahalla membership. It deliberately does not fall back to the radius feed — a silent fallback
would leave the UI showing one feed while its toggle claims another. Handle both by keeping the
toggle off (or routing to the join-a-mahalla flow) rather than treating it as a failure.

**The response now says which feed you got.** The paged payload carries `applied_scope`
(`"radius"` or `"mahalla"`) alongside `items` / `current_page` / `page_size` / `total_records`:

```json
{ "items": [...], "current_page": 1, "page_size": 20,
  "total_records": 7, "applied_scope": "radius" }
```

Label the feed from `applied_scope`, not from what you asked for. The two differ when you send no
`scope` at all: the server then picks the default, and that default falls back to `radius` for a
caller with no mahalla — without an error, because a guest still needs a feed.

> The default is still `radius`. It cannot move to `mahalla` until the create forms stop posting
> the device GPS (§14): every listing they create is `location_source='custom'` and carries no
> mahalla, so a mahalla-default feed would be empty today and would not recover on its own.

`mahalla_name` (see §16) is also present on every list item, so an MFY name can replace the
distance as the place label. It is `null` for listings whose seller had no membership.

---

## 19. Public responses no longer carry exact coordinates 🟢

Listings are stored at `decimal(10,7)` — centimetre precision — and a `profile`-sourced listing
carries the seller's home address. The product endpoints are anonymous, so that was readable by
anyone. `latitude`/`longitude` are now rounded to **3 decimals** (~111 m of latitude, ~85 m of
longitude here) on:

- `GET /api/product/all` and the category / related lists
- `GET /api/product/map-markers`
- `GET /api/product/{id}` — **except for the owner**, who still gets the exact point
- `GET /api/service/{id}`

`GET /api/product/{id}/edit` is owner-only and unchanged, so the edit screen still round-trips
the exact value.

**`distance` is unaffected.** It is computed in SQL from the stored values, so it stays as
accurate as before — only the coordinate handed to the client is coarsened. A listing 16 m away
still reports "16m" while its pin snaps to a ~100 m cell.

Rounding is deterministic, not random jitter: the same listing always reports the same point, so
repeated reads cannot be averaged back to the true one — and a pin does not jump between reloads.

What to change: nothing, unless your UI implies house-level accuracy. Two pins in one building
will now coincide.

---

## 20. Service — same location model as listings 🟠

Everything sections 14–19 did for Product now applies to Xizmat (Service), migration
`025_service_location.sql`. Additive only — no existing field changed type or meaning.

| Endpoint | Change |
|---|---|
| `POST /api/service/create` | Omitting `latitude`/`longitude` inherits the provider's saved profile address (`location_source: 'profile'`, `address_name` filled, mahalla tagged). Sending them records `'custom'` and no mahalla. Omitting them with **no** saved address is a new **400**. |
| `GET /api/service/{id}` | New: `address_name` (the SERVICE's), `location_source`, `mahalla_id`, `mahalla_name`. `provider.address_name` still means the provider's. |
| `GET /api/service/all` · `/my` | New per row: `mahalla_name`. |
| `GET /api/service/all` | New query param `scope=radius\|mahalla` (radius is the default) and new response field `applied_scope`. `user_lat`/`user_long` stay required in both scopes. |
| cascades | Profile address change, mahalla join/switch and membership removal move a provider's `'profile'`-sourced services, exactly as they move listings. |
| `distance` on a service row | Type is unchanged (`string \| null`), but a service at the caller's exact position now reads `"0m"` instead of `null`. `null` from here on means "no distance to report" — `/my`, or a service with no coordinates. This matters because a provider browsing from their saved address is exactly 0 km from their own profile-sourced service. |

The step-by-step version, with the nebor-app file and line numbers, is in
[FRONTEND_HANDOFF_2026-08-31.md](FRONTEND_HANDOFF_2026-08-31.md). It also carries the product
decision that goes with this: **Service moves to the top of the Mahalla hub and Gaz & Kommunal
drops to test mode** — a frontend-only change, `/api/gas/*` is untouched and still live.

---

## 13. Frontend checklist

> **Status (nebor-app, verified against the code — not against commit messages).**
> §1–12 shipped in `ca0f526`, `6a432b5`, `96b319e` and the distributor copy pass.
> §14–20 — the location model for Product and Service — have **not been started**.

**Done**

- [x] Region→district cascade using `GET /api/region` + `GET /api/district?region_id=` — `app/mahalla/join.tsx`
- [x] Mahalla search filters by `district_id`; read `MahallaDto.district_id`/`region_id` (nullable)
- [x] Remove ALL gas **cycle** UI/types/calls — only the `GasCycleWarning` *event* remains (kept on purpose, §7)
- [x] Add session **cancel** (`app/gas/manage.tsx`); `cancelled` handled in history + labels
- [x] Re-label the `GasCycleWarning` toast as "order broken"; `cycle_number` never rendered
- [x] Show "new session" to **distributor** accounts — `isManager` in `app/gas/index.tsx`
- [x] Gate the confirm button on **verified** membership + non-finished session
- [x] Update distributor list copy → "district" scope (`distributors_scope_note`)
- [x] Treat mahalla **join as a switch** — elevated roles get a reset warning
- [x] Read the nested **`household`** from `/my` — `app/(settings)/my-mahalla.tsx`
- [x] Emergency numbers: `GET /api/emergency-numbers` (public) — unchanged, still valid
- [x] Mahalla hub: Service first, Gaz & Kommunal marked as test (frontend-only) — `app/(tabs)/mahalla.tsx`
- [x] `types/service.ts`: add `address_name`, `location_source`, `mahalla_id`, `mahalla_name`, `scope`, `applied_scope`
- [x] Service detail: render the address row from `address_name`/`moljal`, not from `distance` (which is always null there)
- [x] Product detail: read `address_name` for the listing address — `app/product/[id].tsx`
      builds `productPlaceLabel` (moljal → address_name → mahalla_name) and labels the
      meeting-location section with it; the seller card keeps `seller.address_name`, which is
      the seller's own place
- [x] Show `mahalla_name` as the place label where available, with the distance as fallback —
      product + service cards, both feeds, search, seller products, both detail screens

- [x] Product + Service create: no form sends the device position any more — all four
      (`CreateThingForm`, `CreateCarForm`, `CreateWorksForm`, `CreateServiceForm`) omit
      `latitude`/`longitude`, so a post inherits the owner's profile address and its mahalla
- [x] The "no saved profile address" 400 routes to the address screen —
      `isMissingProfileAddressError()` in `utils/apiError.ts`, handled in all four forms
- [x] Onboarding guard fixed: `app/(auth)/auth.tsx` tests `!latitude || !longitude`, so a user
      who denied location at sign-up is prompted again instead of staying at (0, 0)

**Open**

- [ ] Optional: a "mening mahallam" feed toggle via `scope=mahalla`, handling the two 400 cases.
      **Deliberately not built yet** — §1.5 of the handoff says to wait, and it is still right:
      every listing and service created before today is `location_source: 'custom'` and carries
      no mahalla, so the feed would be near-empty until people re-post under the new create flow.
      The types (`scope`, `applied_scope`) are in place for when it is worth turning on.
- [ ] No "pick a different place for this post" step. The create forms now always use the
      profile address; sending explicit coordinates (`location_source: 'custom'`) is what that
      step would be for, and it needs a UX decision before it is built.

### Still open (backend / out of this sync)

- Mahallas are seeded for **Toshkent shahri** and **Farg'ona** only — other districts return an
  empty picker; that is expected data state, not a client bug.
- No service or listing created by the current app carries a mahalla: everything it posts is
  `location_source: 'custom'` until the create forms stop sending coordinates. The mahalla-scoped
  feed (§18, §20) stays off until then.
