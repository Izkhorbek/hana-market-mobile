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

## 13. Frontend checklist

> **Status: all items landed on `develop`** (commits `ca0f526`, `6a432b5`, `96b319e` + the
> distributor copy pass). Verified against the code, not just the commit messages.

- [x] Region→district cascade using `GET /api/region` + `GET /api/district?region_id=` — `app/mahalla/join.tsx` (3-step wizard)
- [x] Mahalla search filters by `district_id`; read `MahallaDto.district_id`/`region_id` (nullable)
- [x] Remove ALL gas **cycle** UI/types/calls — only the `GasCycleWarning` *event* remains (kept on purpose, §7)
- [x] Add session **cancel** (`app/gas/manage.tsx`); `cancelled` status handled in history + labels
- [x] Re-label the `GasCycleWarning` toast as "order broken" (`gas.cycle_warning_*`); `cycle_number` never rendered
- [x] Show "new session" to **distributor** accounts — `isManager` in `app/gas/index.tsx`
- [x] Gate the confirm button on **verified** membership + non-finished session (`isVerifiedMember` + `status === 'active'`)
- [x] Update distributor list copy → "district" scope (`distributors_subtitle`, `no_distributors`, new `distributors_scope_note`)
- [x] Treat mahalla **join as a switch** — elevated roles get a reset warning before `/mahalla/join`
- [x] Read the nested **`household`** from `/my` (nullable) — rendered in `app/(settings)/my-mahalla.tsx`
- [x] Emergency numbers: `GET /api/emergency-numbers` (public) — unchanged, still valid

### Still open (backend / out of this sync)

- Mahallas are seeded for **Toshkent shahri** and **Farg'ona** only — other districts return an
  empty picker; that is expected data state, not a client bug.
