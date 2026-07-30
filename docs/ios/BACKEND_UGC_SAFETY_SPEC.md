# Backend Spec — UGC Safety & Terms Acceptance (Apple Guideline 1.2)

**Consumer:** Hana Market mobile (Expo/React Native).
**Backend:** .NET 8 REST (+ SignalR).
**Purpose:** Close the App Store **Guideline 1.2 (User-Generated Content)** gaps —
specifically **user blocking**, **recorded EULA/Terms acceptance**, and the
supporting moderation workflow — using endpoints consistent with the existing API.

> Frontend note: the mobile app already ships (a) a neutral location pre-prompt
> (5.1.1(iv)) and (b) an explicit Terms-acceptance checkbox recorded client-side.
> This spec makes acceptance authoritative server-side and adds the missing
> block/moderation capabilities the client will wire once these endpoints exist.

---

## 0. Apple Guideline 1.2 — requirement → endpoint mapping

An app with UGC must implement **all** of the following. Current status:

| # | Apple 1.2 requirement | Status today | This spec adds |
|---|---|---|---|
| 1 | A method to **filter objectionable content** | ❌ none | §5 content filtering at create/update + auto-hide |
| 2 | A mechanism to **report** objectionable content, acted on **within 24h** | ⚠️ `complaint/create` exists (listings), no SLA/status | §4 report status + moderation SLA + auto-hide |
| 3 | A mechanism to **block abusive users** | ❌ none | §3 `user/block` / `user/unblock` / `user/blocked` + enforcement |
| 4 | **Published contact information** | ✅ `content/about-us`, support email | (no change — keep current) |
| 5 | An **EULA/Terms** users **explicitly accept** | ⚠️ served as text only; acceptance not recorded | §2 `user/accept-terms` + versioning |

---

## 1. Conventions (match the existing API)

- **Base:** same host as `EXPO_PUBLIC_API_URL`; all paths relative (e.g. `user/block`). **HTTPS only.**
- **Auth:** `Authorization: Bearer <access_token>` unless noted. Unauthorized → `401`.
- **Response envelope (unchanged):**
  ```json
  { "success": true, "message": "…", "data": { }, "errors": [], "status_code": 200 }
  ```
- **Naming:** `snake_case` JSON, lowercase slash paths, grouped like `user/*`.
- **Errors:** populate `errors[]` + `message`; set `success:false` and the matching HTTP `status_code`.
- **Pagination:** reuse the existing paginated shape (`items`, `current_page`, `page_size`, `total_records`).
- **Times:** server stamps authoritative UTC ISO-8601; never trust client timestamps for records of record.

### New endpoint summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `user/block` | ✅ | Block a user |
| POST | `user/unblock` | ✅ | Unblock a user |
| GET | `user/blocked` | ✅ | List users I blocked (paginated) |
| POST | `user/accept-terms` | ✅ | Record Terms/Privacy acceptance |
| GET | `content/terms` | ❌ (public) | **extend**: return `version` |
| GET | `content/privacy` | ❌ (public) | **extend**: return `version` |
| GET | `user/my` | ✅ | **extend**: add `terms_acceptance` status |
| POST | `report/create` | ✅ | (exists) report a user — keep |
| POST | `complaint/create` | ✅ | (exists) report a listing — keep, add status |

---

## 2. Terms / EULA acceptance

### 2.1 `POST user/accept-terms`
Records that the authenticated user accepted the current Terms + Privacy.

**Request**
```json
{
  "terms_version": "2026-07-01",
  "privacy_version": "2026-07-01",
  "accepted_at": "2026-07-26T09:15:00Z",   // client time (informational only)
  "app_version": "1.0.1",
  "platform": "ios"                          // ios | android
}
```
**Behaviour**
- Server records an immutable row with **server-side** `accepted_at`, request `ip_address`, `platform`, `app_version`, and the `terms_version`/`privacy_version` the user agreed to.
- Idempotent per (user, terms_version, privacy_version): re-posting the same versions returns `200` without duplicating.
- **200** `{ data: { accepted: true, terms_version, accepted_at } }`.

### 2.2 Extend `GET content/terms` and `content/privacy`
Add an explicit **`version`** string (stable id, e.g. a date or semver) alongside the existing `last_updated`, so the client can detect when re-acceptance is needed.
```json
{ "data": { "version": "2026-07-01", "last_updated": "…", "sections": [ … ] } }
```

### 2.3 Extend `GET user/my`
Add acceptance status so the client can prompt only when needed:
```json
"terms_acceptance": {
  "accepted": true,
  "terms_version": "2026-07-01",
  "privacy_version": "2026-07-01",
  "accepted_at": "2026-07-26T09:15:00Z",
  "up_to_date": true            // false if a newer terms_version has been published
}
```

### 2.4 (Optional) Enforcement gate
For universal acceptance, protected **write** endpoints (`product/create`,
`chats/create-or-get`, `complaint/create`, `report/create`) may reject a user who
has not accepted the current version:
- **`428` Precondition Required**, `errors:["terms_acceptance_required"]`.
- The client then shows the acceptance sheet and calls `user/accept-terms`.
- **Reads and guest browsing are never gated.**

### 2.5 Data model
```
terms_acceptances(
  id PK,
  user_id FK,
  terms_version varchar,
  privacy_version varchar,
  accepted_at timestamptz,      -- server UTC
  ip_address inet null,
  platform varchar null,
  app_version varchar null,
  created_at timestamptz default now()
)
-- index (user_id, terms_version, privacy_version) unique
```

---

## 3. Block user (core 1.2 gap)

Directionality: **A blocks B** ⇒ A and B can no longer interact or see each other's
UGC. Enforce **both directions** (recommended) so a blocked user cannot keep
reaching the blocker by viewing/contacting from their side.

### 3.1 `POST user/block`
**Request** `{ "blocked_user_id": 123, "reason": "harassment" }`  _(reason optional, ≤ 200 chars)_

**Rules**
- `401` if unauthenticated.
- `400 self_block_not_allowed` if `blocked_user_id == caller`.
- `404 user_not_found` if target doesn't exist.
- `403 cannot_block_staff` if target is an admin/support account.
- **Idempotent:** blocking an already-blocked user → `200` (no duplicate row).
- Side effects on success (see §3.4): existing 1:1 chat becomes inaccessible to both; pending notifications from B to A suppressed.

**Response 200**
```json
{ "data": { "blocked_user_id": 123, "created_at": "2026-07-26T09:20:00Z" } }
```

### 3.2 `POST user/unblock`
**Request** `{ "blocked_user_id": 123 }` → `200` idempotent (unblocking a non-blocked user still `200`). Restores visibility/contact.

### 3.3 `GET user/blocked?current_page=1&page_size=20`
Paginated list of users the caller has blocked.
```json
{ "data": { "items": [ { "user_id": 123, "username": "…", "profile_image_url": "…", "reason": "harassment", "created_at": "…" } ],
            "current_page": 1, "page_size": 20, "total_records": 1 } }
```

### 3.4 Enforcement matrix (must apply the block filter server-side)

Let `blocked_pair(A,B)` = A blocked B **or** B blocked A.

| Endpoint / surface | Enforcement when `blocked_pair(caller, other)` |
|---|---|
| `product/all`, `product/map-markers`, `product/categories/{id}/products`, search | **Exclude** the other party's listings from results |
| `product/{id}`, `product/{id}/related`, `product/{id}/edit` | Return **`404 not_found`** if the owner is block-paired with caller (don't leak existence) |
| `user/seller/{id}`, `product/seller/{id}/products` | **`404 not_found`** if block-paired |
| `chats/create-or-get` | **`403 blocked`** — do not create/return a room |
| `chats/my-chats` | **Hide** rooms whose counterpart is block-paired |
| `chats/{id}/messages` (GET/POST) | **`403 blocked`**; never accept/return new messages |
| **SignalR** `SendMessage` / delivery | Reject send; **do not deliver** `ReceiveMessage`/typing/presence between block-paired users |
| `manner-temperature/reviews` | **`403 blocked`** — no reviews between block-paired users |
| Notifications | **Suppress** any notification originating from a block-paired user |
| `product/{id}/likes` | Optional: reject likes between block-paired users |

### 3.5 Data model
```
blocked_users(
  id PK,
  blocker_user_id FK,
  blocked_user_id FK,
  reason varchar(200) null,
  created_at timestamptz default now(),
  unique (blocker_user_id, blocked_user_id)
)
-- index on blocked_user_id for reverse lookups
```

---

## 4. Reporting & moderation workflow (1.2 #2)

Endpoints already exist — this section defines the **behaviour Apple checks**.

### 4.1 Keep & extend existing
- `POST complaint/create` — report a **listing** (`reported_product_id`) or user (`reported_user_id`), `complaint_type` (enum from `complaint/types`), `description?`.
- `POST report/create` — report a **user** (`reported_user_id`, optional `product_id`, `reason` 5–500 chars).
- Add a **`status`** field to stored reports/complaints: `pending | reviewing | actioned | dismissed`, plus `resolved_at`, `action_taken`.

### 4.2 Moderation SLA (Apple requirement)
- Reports must be **triaged and acted on within 24 hours**.
- Actions available to moderators: **remove/hide content**, **warn**, **suspend**, **permanently ban** the offending user (mirror the client Terms language).
- Provide an **admin surface** (dashboard or queue) fed by new reports; near-real-time notification to moderators is recommended.

### 4.3 Auto-hide (defense in depth)
- When a single listing receives reports from **≥ N distinct reporters** (suggest `N = 3`), automatically set `products.moderation_status = 'hidden'` pending human review, and exclude hidden products from all public read endpoints (§3.4 read surfaces).
- Repeat offenders (≥ M actioned reports) → auto-suspend pending review.

### 4.4 Rate limiting / anti-abuse
- `user/block`, `report/create`, `complaint/create`: rate-limit per user (e.g. **20/hour**) and **de-duplicate** identical (reporter, target) pairs within a window.

---

## 5. Objectionable-content filtering (1.2 #1)

On `product/create` and `product/{id}` (update):
- Run a **prohibited-content filter** on `title` + `description` (profanity / hate / illegal-goods keyword lists for uz/ru/en). On hit → **`422 content_rejected`**, `errors:["objectionable_content"]`, do not persist.
- (Recommended) Queue uploaded images for **automated moderation**; flag/hold on positive hits.
- Expose the policy the app displays (zero tolerance) in `content/terms` so the served Terms mirror the in-app statement.

**Products moderation fields**
```
products.moderation_status  enum('active','hidden','removed') default 'active'
products.moderation_reason  varchar null
products.report_count       int default 0
```
Only `moderation_status = 'active'` products appear in public read endpoints.

---

## 6. Acceptance criteria (testable)

**Block**
- [ ] A blocks B → B's listings vanish from A's `product/all`, search, map, category lists (and vice-versa).
- [ ] A opening B's `product/{id}` or `user/seller/{B}` → `404`.
- [ ] A→B `chats/create-or-get` → `403`; existing room hidden for both; SignalR delivers nothing between them.
- [ ] Notifications from B to A are suppressed.
- [ ] Block is idempotent; self-block → `400`; unblock restores everything.

**Terms**
- [ ] `user/accept-terms` records server-stamped `accepted_at` + `ip` + version; idempotent per version.
- [ ] `content/terms` returns a `version`; `user/my.terms_acceptance.up_to_date` flips to `false` after a new version is published.
- [ ] (If gate enabled) write endpoints return `428 terms_acceptance_required` when not accepted.

**Reporting / filtering**
- [ ] Reports carry a `status`; moderators can hide/remove/ban; auto-hide triggers at N reporters.
- [ ] `product/create` with prohibited text → `422`, not persisted.

**Regression**
- [ ] Public browsing (product list/detail/search/map) and guest mode unaffected for non-blocked content.

---

## 7. Frontend wiring (what mobile will call once shipped)

- **Block:** "Block user" action on `product/seller/[sellerId]` and `chat/[id]` → `POST user/block`; a "Blocked users" list in settings → `GET user/blocked` + `POST user/unblock`.
- **Terms:** after `verify-otp`, call `POST user/accept-terms` with the checkbox acceptance the app already captures (`termsAcceptedAt`), and read `user/my.terms_acceptance.up_to_date` to prompt existing users once.
- **Report:** surface the existing `complaint/create` report action on product detail and chat (currently only on the home feed).

> None of this weakens auth, privacy, or existing moderation; it only adds the
> capabilities Apple 1.2 requires. Ship §2 (terms) + §3 (block) first — they are
> the direct rejection blockers; §4/§5 harden the review posture.
