# Backend delta — what "my services" still needs (2026-09-04)

> **Direction:** mobile → backend. The reverse of `FRONTEND_HANDOFF_2026-08-31.md`.
> Xizmat (Service) now has the full owner-side flow in nebor-app — list, edit, delete —
> and building it surfaced three places where the service contract is a step behind the
> product one. Each is additive; none changes an existing field's type or meaning.
>
> Nothing here blocks what shipped. The app works today; two of the three gaps are
> worked around, and the workarounds are the reason for asking.

---

## 0. What shipped on the client

| Screen | What it does |
|---|---|
| Profile → **My services** | `GET /api/service/my`, one row per service |
| Row → tap | Opens the public detail (`GET /api/service/{id}`) |
| Row → menu → Edit | `app/(post)/edit-service/[id].tsx` → `PUT /api/service/{id}` |
| Row → menu → Delete | `DELETE /api/service/{id}`, after a confirm |

The client already had `useMyServicesQuery`, `useUpdateServiceMutation` and
`useDeleteServiceMutation` with cache invalidation — only the screens were missing.

---

## 1. The edit form has no raw price to pre-fill 🔴

**Today.** `GET /api/service/{id}` returns `price` already formatted for display
(`"150 000 so'm"`). `PUT /api/service/{id}` expects numeric `price_uzs` / `price_usd`.
There is nothing in between.

**What the client does about it.** `components/Forms/EditServiceForm.tsx` pulls the digits
back out of the formatted string to pre-fill the amount. This works for the formats in use
and fails safe — an amount it cannot parse leaves the field empty, and an empty field is not
sent, so the stored price stays as it was rather than being overwritten with a guess.

It is still a string being reverse-engineered. A formatting change on the server —
a different separator, a "500 ming" style, a currency word in front — silently changes what
the provider sees pre-filled in their own edit form.

**Product already solves this.** `GET /api/product/{id}/edit` (`ProductEditResponseDto`)
returns `currency_type`, `price_uzs` and `price_usd` raw, and the product edit form reads
that endpoint rather than the public one (`api/endpoints.ts:71`).

**Ask.** Either shape works for us:

- **a)** add `price_uzs: number | null` and `price_usd: number | null` to `SingleServiceDto`
  (`currency_type` is already there), or
- **b)** add `GET /api/service/{id}/edit`, owner-only, mirroring the product endpoint.

(a) is less surface and enough: the detail response is already owner-visible, and the amount
is not more sensitive than the formatted price beside it. (b) matches the existing product
pattern if you would rather keep raw values off the public response.

---

## 2. `ServiceListItemDto` has no `status` 🟠

**Today.** `ServiceUpdateRequest.status` exists and accepts `active` / `hidden`, and
`SingleServiceDto.status` is returned — but the **list** row is not:

```ts
ServiceListItemDto {
  id; category; category_name; title; description; price; price_type; price_type_name;
  phone_number; main_image_url; distance; moljal; mahalla_name; created_ago
  // no status
}
```

**Consequence.** "My services" cannot do what "My listings" does. The product screen has
Active / Reserved / Sold / Hidden tabs driven by `MyProductDto.status`; the service screen
has no tabs, no badge, and no hide/unhide action — we can hide a service through the update
call, but we cannot show the provider that it *is* hidden, so offering the action would
strand them. The screen ships without it for that reason.

**Ask.** Add `status` to `ServiceListItemDto`. `/my` is the one that matters; on `/all` it
is presumably always `active` and harmless either way.

Once it lands the client adds an Active / Hidden split and a hide/unhide action — no other
change, since the update call is already wired.

---

## 3. `PUT /api/service/{id}` cannot change photos 🟡

**Today.** Update is JSON and carries no images; per `FRONTEND_HANDOFF_2026-08-31.md` §3 the
location is not editable either. Both are create-time only.

**What the client does about it.** The edit form omits the photo uploader and the map picker
entirely rather than showing controls that do nothing, and says so in a line under the
contact fields: to change a photo or the place, delete the service and post it again.

That is an honest UI for the current contract, and a bad outcome for the provider — deleting
loses the service's age and its URL.

**Ask (lower priority than 1 and 2).** Accept images on update the way create does —
multipart with `images_json`, replacing the set. Location can stay create-time; that one has
a real reason behind it (§3 of the handoff), and nobody has asked for it.

---

## 4. What needs no action

- `GET /api/service/my` itself — shape is fine, the client reads it as is.
- `DELETE /api/service/{id}` — works, nothing to change.
- The location model from the 08-31 handoff — implemented on the client and closed:
  create no longer sends the device GPS, the "no saved profile address" 400 routes to the
  address screen, the detail address row reads `address_name`, `mahalla_name` is the place
  label, and the `scope=mahalla` feed toggle is wired with `applied_scope`.

---

## 5. Summary

| # | Ask | Priority | Unblocks |
|---|---|---|---|
| 1 | Raw `price_uzs` / `price_usd` on the detail, or `/service/{id}/edit` | 🔴 | An edit form that stops parsing display strings |
| 2 | `status` on `ServiceListItemDto` | 🟠 | Active/Hidden tabs + hide/unhide in "my services" |
| 3 | Images on `PUT /api/service/{id}` | 🟡 | Changing a photo without re-posting |
