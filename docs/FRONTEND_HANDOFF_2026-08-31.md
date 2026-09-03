# Frontend — Service to the front, Gaz & Kommunal into test mode (2026-08-31)

> **Read [FRONTEND_HANDOFF_2026-08-30.md](FRONTEND_HANDOFF_2026-08-30.md) first** if the listing
> (Product) work is not done yet — this document is the same change applied to Xizmat (Service),
> plus a product decision about the Mahalla hub.
>
> Backend branch: `feat/service-location-parity`. Migration `025_service_location.sql`.

---

## 0. The decision

Two things, taken together:

1. **Gaz & Kommunal moves to test mode.** People do not yet understand or ask for the gas queue,
   so it stops being the first thing in the Mahalla hub.
2. **Service becomes the primary neighbourhood feature.** It takes the first position.

**Gaz is a frontend-only change.** The backend was deliberately left untouched: `/api/gas/*` keeps
working exactly as it does today, no flag was added, nothing returns 403. A build that still links
to `/gas` will keep working — which is what "test mode" has to mean while testers are using it.

Reason it was not done server-side: there is no feature-flag infrastructure in this backend
(the only thing resembling one is `Perf.Enabled`, a static bool in `hanamarket/Utils/Perf.cs:21`),
and building one to hide a single hub card would be a much larger change than the decision warrants.

**Service, on the other hand, needed backend work** — it was a step behind listings, and promoting
it to first place without fixing that would have promoted the bug too. That work is done; §2 is the
contract delta.

---

## 1. What to change in nebor-app

### 1.1 Reorder the hub and mark Gaz as test — `app/(tabs)/mahalla.tsx` 🔴

The `items` array at `mahalla.tsx:32` currently reads: **gas, services, emergency, distributors**.
Gas is first (`:33`), services second (`:42`).

Swap them, and mark the gas card as a test feature.

The mechanism already exists — do not invent one: `HubItem` has a `comingSoon?: boolean` field
(`mahalla.tsx:23`), and there are two commented-out examples using it at `mahalla.tsx:72-90`
(announcements, lostfound). Whether "test" reuses `comingSoon` or gets its own flag is your call;
the point is that the card should stay tappable for testers rather than disappear.

Labels, if you add a badge: `mahalla.gas_title` is `"Gaz & Kommunal"` (`locales/uz.json:516`),
`"Газ и коммунальные"` (`ru.json:514`), `"Gas & Utilities"` (`en.json:513`).

### 1.2 Stop sending the device GPS when creating a service — `components/Forms/CreateServiceForm.tsx` 🔴

Exactly the same fix as the four product forms in the 08-30 handoff. The form calls
`getCurrentLocationSafe()` at submit (`CreateServiceForm.tsx:127`) and appends the device position
unconditionally (`:177-178`):

```ts
// Location (auto-resolved on Post)
formData.append('latitude', coords.latitude.toString())
formData.append('longitude', coords.longitude.toString())
```

That is why a provider's profile address and their service address are two different places today.

**Stop appending `latitude` / `longitude`.** The backend then copies the provider's *saved profile
address* onto the service, records `location_source: 'profile'`, fills `address_name`, and tags the
service with the provider's mahalla.

Keep sending them **only** if you add a deliberate "pick a different place for this service" step —
that is what `location_source: 'custom'` is for.

**New failure to handle:** if coordinates are omitted *and* the provider has no saved address, the
create call now returns **400** with

> `No saved profile address. Set your address first, or send the service coordinates.`

Route that to the address screen rather than showing a raw error. (This cannot happen while the form
still sends coordinates, so 1.2 and this handler ship together.)

### 1.3 Show the service's own address — `app/service/[id].tsx` 🟠

Two things here.

**a) A pre-existing bug.** The whole location meta row is gated on `!!service.distance`
(`[id].tsx:109`), but the detail endpoint has always sent `distance: null` — it has no caller
position in its contract (`ServiceController.cs`, `GetById`: `distance = null, // detail has no user
location in the contract`). So the `MapPin` row, and the `moljal` inside it at `[id].tsx:114`,
**never renders**. Nobody has seen a landmark on a service detail page.

**b) The field to render.** `address_name` is new on the detail response — the **service's** address,
which is not the same thing as `provider.address_name`. Key the row off `address_name || moljal`
instead of `distance`, and the row starts working.

### 1.4 Types — `types/service.ts` 🟠

| Interface | Add |
|---|---|
| `ServiceListItemDto` (`:55`) | `mahalla_name: string \| null` |
| `SingleServiceDto` (`:67`) | `address_name: string \| null`, `location_source: string \| null`, `mahalla_id: number \| null`, `mahalla_name: string \| null` |
| `ServiceListParams` (`:91`) | `scope?: 'radius' \| 'mahalla'` |
| the `/all` response wrapper | `applied_scope: 'radius' \| 'mahalla'` |
| `ServiceCreateDto` (`:27`) | nothing — `latitude` / `longitude` are already optional (`latitude?: number`) |

`location_source` is `'profile' | 'custom' | 'legacy'`. Treat it as a string: it is diagnostic
("is this address the provider's own?"), not something to branch UI on yet.

### 1.5 Optional — the mahalla feed 🟡

`GET /api/service/all` now takes `scope=mahalla`, which returns the services of the caller's own MFY
instead of everything inside a radius. The same toggle the product feed got.

**Do not turn it on yet.** No existing service carries a mahalla — the column was added today and
there is no backfill, and every service the current app creates is `custom` (see 1.2), which is
never tagged. The feed becomes useful only after 1.2 ships and providers re-post or update.

When you do wire it: send `scope=mahalla`, and label the feed from `applied_scope` in the response,
**not** from what you asked for. An explicit `scope=mahalla` from a user with no mahalla is a 400,
but the *default* silently falls back to `radius` — `applied_scope` is how you tell which feed you
are actually showing.

---

## 2. API contract delta

Everything below is additive. **No existing field changed type or meaning, and no field was removed.**

### `POST /api/service/create`

| | Before | After |
|---|---|---|
| `latitude` / `longitude` sent | stored as-is | stored as-is, `location_source: 'custom'`, no mahalla tag |
| `latitude` / `longitude` omitted | stored as `NULL` | copied from the provider's profile, `location_source: 'profile'`, `address_name` filled, mahalla tagged |
| omitted **and** no profile address | created with `NULL` coordinates | **400** (message in 1.2) |

### `GET /api/service/{id}`

New: `address_name`, `location_source`, `mahalla_id`, `mahalla_name`.
`provider.address_name` is unchanged and still means the **provider's** address.
Coordinates are still rounded to 3 decimals for everyone (that was already true before today).

### `GET /api/service/all` and `/my`

New on each row: `mahalla_name`.
New on the `/all` response: `applied_scope`.
New query param on `/all`: `scope` (`radius` default, `mahalla` opt-in).
`user_lat` / `user_long` are **still required** in both scopes — the response keeps showing a
distance even when the mahalla decides membership.

### `distance` on a service row

The type is unchanged (`string | null`), but the meaning of the two values is now clean:

| Value | Means |
|---|---|
| `"0m"` | A real distance: the service sits at the caller's exact position. **New** — this used to come back as `null`. |
| `null` | No distance to report: `/my` does not compute one, or the service has no coordinates. |

Before, both collapsed into `null`. It became worth separating once a service can inherit the
provider's profile address, because a provider browsing from that address is exactly 0 km from
their own service and was seeing a blank where a distance belonged.

If your UI hides the distance row on a falsy value, `"0m"` is truthy and will now render — which
is the intent.

### Cascades (no client action)

A service now follows its provider the way a listing does:

- changing the profile address (`POST /api/user/update/location`) re-points every
  `location_source: 'profile'` service;
- joining or switching a mahalla re-tags the provider's services;
- losing the membership clears the tag.

`custom` services never move — that is the point of the flag.

---

## 3. What needs no action

- `/api/gas/*` — unchanged, still live, still requires a mahalla admin/rais/distributor membership
  to open a session (`GasController.cs:54-56`). Test mode is your ordering change alone.
- `PUT /api/service/{id}` — unchanged. A service's location is still not editable through it, which
  is why the detail response is safe to coarsen for everyone including the owner.
- Emergency and Distributors hub cards — untouched.

---

## 4. Definition of done

- [ ] Services first in the Mahalla hub, Gaz marked as test and still reachable
- [ ] `CreateServiceForm` no longer appends `latitude` / `longitude`
- [ ] The "no saved profile address" 400 routes to the address screen
- [ ] Service detail shows the address again (row no longer gated on `distance`)
- [ ] `types/service.ts` carries the new fields
- [ ] A service created after the change comes back with `location_source: 'profile'` and a
      non-null `mahalla_name` for a provider who has a mahalla
