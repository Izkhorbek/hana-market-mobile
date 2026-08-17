# Solution — Region → District → Mahalla hierarchy, district-scoped distributors, service image fix

Analysis + change map for 6 tasks. Two repos: **frontend** `nebor-app`, **backend**
`hanamarket` (+ `Database/Migrations`). Household is intentionally left untouched.

---

## 0. Current state (audited)

| Area | Today |
|---|---|
| `mahalla` table | Flat. `region`, `district` are **varchar(120) strings**, no FK. No `district_id`. (`Database/Migrations/010_mahalla.sql`, `Models/MahallaModel.cs`) |
| region / district tables | **Do not exist.** |
| `mahalla` list filter | String-equality on `region`/`district` (`Mappers/Mahalla/MahallaMapper.cs` SelectList) |
| `household` | Links to mahalla via `mahalla_id` FK, to user via `owner_user_id`. Reaches district transitively → **safe to leave as-is.** |
| `distributor_company` | Has `mahalla_id` FK **only**. No `district_id`. (`013_distributor_company.sql`) |
| distributor listing | `GET /api/mahalla/{id}/distributors` → `WHERE mahalla_id = @id` (`Mappers/Distributor/DistributorMapper.cs`) |
| Frontend join | Single text-search step → pick mahalla → household (`app/mahalla/join.tsx`) |
| Service detail image | `<Image source={{uri: service.images[0]}}/>` — **raw, not resolved** (`app/service/[id].tsx`) |

---

## 1. Backend — normalized Region → District → Mahalla (tasks 2, 4, 5)

### 1.1 Migrations (new files, e.g. `017_…` onward)

**A. Create `region` + `district`:**
```sql
CREATE TABLE region (
  id   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  UNIQUE KEY uq_region_name (name)
);
CREATE TABLE district (
  id        BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  region_id BIGINT UNSIGNED NOT NULL,
  name      VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_district_region FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE CASCADE,
  UNIQUE KEY uq_district (region_id, name),
  KEY idx_district_region (region_id)
);
```

**B. Add `district_id` to `mahalla` + backfill from existing strings:**
```sql
ALTER TABLE mahalla ADD COLUMN district_id BIGINT UNSIGNED NULL AFTER district,
  ADD KEY idx_mahalla_district_id (district_id),
  ADD CONSTRAINT fk_mahalla_district FOREIGN KEY (district_id) REFERENCES district(id);

-- Backfill: build region/district rows from the denormalized strings, then link.
INSERT IGNORE INTO region (name) SELECT DISTINCT region FROM mahalla WHERE region <> '';
INSERT IGNORE INTO district (region_id, name)
  SELECT r.id, m.district FROM mahalla m JOIN region r ON r.name = m.region
  WHERE m.district <> '' GROUP BY r.id, m.district;
UPDATE mahalla m
  JOIN region r   ON r.name = m.region
  JOIN district d ON d.name = m.district AND d.region_id = r.id
  SET m.district_id = d.id;
-- After verifying, make it NOT NULL:
-- ALTER TABLE mahalla MODIFY district_id BIGINT UNSIGNED NOT NULL;
```
> Keep the old `mahalla.region` / `mahalla.district` varchar columns for now — the
> client still shows those names. They can be dropped in a later cleanup once
> everything reads via the FK + JOIN.

**C. Add `district_id` to `distributor_company` (task 4) + backfill from its mahalla:**
```sql
ALTER TABLE distributor_company ADD COLUMN district_id BIGINT UNSIGNED NULL AFTER mahalla_id,
  ADD KEY idx_distcompany_district (district_id),
  ADD CONSTRAINT fk_distcompany_district FOREIGN KEY (district_id) REFERENCES district(id);
UPDATE distributor_company dc JOIN mahalla m ON m.id = dc.mahalla_id
  SET dc.district_id = m.district_id;
-- Then: ALTER TABLE distributor_company MODIFY district_id BIGINT UNSIGNED NOT NULL;
-- mahalla_id may stay (optional/nullable) or be dropped later; district_id is now the scope.
```

### 1.2 Models / DTOs
- New `Models/RegionModel.cs`, `Models/DistrictModel.cs`.
- `MahallaModel` += `district_id`. `DistributorCompanyModel` += `district_id`.
- New `RegionDto { id, name }`, `DistrictDto { id, region_id, name }`.
- `MahallaDto` += `district_id`, `region_id` (keep `district`/`region` names for display).
- `DistributorCompanyRequest` (admin create/update) += `district_id`.

### 1.3 Endpoints (new + changed)
- **NEW** `GET /api/region` → `RegionDto[]`.
- **NEW** `GET /api/district?region_id={id}` → `DistrictDto[]`.
- **CHANGE** `GET /api/mahalla` — `MahallaListParams` add `district_id` (id-based filter). Keep `search` for optional in-district text filter; region/district string params become legacy.
  - `MahallaMapper.SelectList`: `AND (@district_id IS NULL OR district_id = @district_id)`.
- **CHANGE** `GET /api/mahalla/{id}/distributors` — **district-scope it** (task 5). Resolve the mahalla's district, return all distributors in that district:
  - `DistributorMapper`: `SELECT * FROM distributor_company WHERE district_id = (SELECT district_id FROM mahalla WHERE id = @mahalla_id) ORDER BY company_name ASC;`
  - Controller/repo: rename `GetByMahallaAsync` → `GetByMahallaDistrictAsync` (or keep the name, change SQL). **Client endpoint URL stays the same** → zero client change for distributors.
- **UNCHANGED** `POST /api/mahalla/join` — body stays `{ mahalla_id, house_number, street_name }`. `mahalla_id` already implies district → household untouched (task 3). ✅

---

## 2. Frontend — 3-step Region → District → Mahalla picker (task 1)

### 2.1 `types/mahalla.ts`
```ts
export interface RegionDto { id: number; name: string }
export interface DistrictDto { id: number; region_id: number; name: string }
// MahallaDto: add district_id, region_id (keep name/district/region strings)
export interface MahallaDto { id: number; name: string; district: string; region: string; district_id?: number; region_id?: number }
// MahallaListParams: add district_id
export interface MahallaListParams { region?: string; district?: string; district_id?: number; search?: string }
```

### 2.2 `api/endpoints.ts`
```ts
REGION:   { LIST: 'region' },
DISTRICT: { LIST: 'district' },
```

### 2.3 `api/services/mahalla.service.ts`
```ts
getRegions:   () => axiosInstance.get<ApiResponse<RegionDto[]>>(ENDPOINT.REGION.LIST),
getDistricts: (regionId: number) => axiosInstance.get<ApiResponse<DistrictDto[]>>(ENDPOINT.DISTRICT.LIST, { params: { region_id: regionId } }),
```

### 2.4 `api/hooks/useMahalla.ts`
- `useRegionsQuery()` → `['REGIONS']`.
- `useDistrictsQuery(regionId)` → `['DISTRICTS', regionId]`, `enabled: !!regionId`.
- `useMahallaListQuery` — already exists; call it with `{ district_id }` (enabled once a district is picked).

### 2.5 `app/mahalla/join.tsx` — rewrite as a 3-step wizard
Replace the single search field with a `step` state (`'region' | 'district' | 'mahalla' | 'household'`):
1. **Region** — list from `useRegionsQuery`; select → step district.
2. **District** — `useDistrictsQuery(regionId)`; select → step mahalla.
3. **Mahalla** — `useMahallaListQuery({ district_id })` (list, optional in-district search); select → step household.
4. **Household** — the existing `house_number` / `street` inputs + Join button (unchanged logic, `join({ mahalla_id, house_number, street_name })`).

Add a back-step affordance and a breadcrumb (Region › District › Mahalla). i18n: add `mahalla.select_region`, `mahalla.select_district`, `mahalla.select_mahalla_step`, step titles (uz/ru/en).

### 2.6 `app/mahalla/distributors.tsx`
**No change needed** — it already passes the user's `mahallaId`; the backend now returns the district's distributors for that id. (Optional: update `mahalla.distributors_title` copy to say "district".)

---

## 3. Household (task 3) — untouched
The current household step (house_number/street after mahalla) stays exactly as-is.
`mahalla_id` in the join body implies the district; the household migration is not
touched. Nothing to change. ✅

---

## 4. Service detail image bug (task 6) — frontend one-liner

**Root cause:** `app/service/[id].tsx` renders the image with **raw** `expo-image`:
```ts
const image = service.images?.[0]
<Image source={{ uri: image }} ... />
```
Every other image surface (products, chat) runs URLs through `resolveImageUrl`
(`utils/imageUrl.ts`), which prepends `IMAGE_BASE_URL` for **server-relative** paths
(e.g. `/service_images/x.jpg`). The service screen skips it, so a relative path never
loads → placeholder shows.

**Fix (safe either way — `resolveImageUrl` passes absolute URLs through unchanged):**
```ts
import { resolveImageUrl } from '@/utils/imageUrl'
...
const image = resolveImageUrl(service.images?.[0])
```
Also **remove the leftover debug** `console.log('ServiceDetailScreen service:', service)` (line 33).
Optional polish: show the resolved `main_image_url` thumbnail in the list card
(`app/service/index.tsx`), which currently only shows a Wrench icon.

---

## 5. Rollout order & risk

1. **Backend migrations A→B→C** with backfill; verify counts before flipping columns to `NOT NULL`.
2. **Backend endpoints**: add region/district list; change mahalla list filter; district-scope the distributors query.
3. **Frontend**: types → endpoints → service → hooks → `join.tsx` wizard. Ship after the backend endpoints exist.
4. **Service image fix** — independent, frontend-only, ship immediately (no backend dependency).

**Risks:** backfill depends on clean region/district strings (dedupe/trim before insert);
keep `mahalla.region/district` varchar until the FK path is fully adopted; distributors
endpoint semantics change from mahalla-scope to district-scope (wider result set — intended).

---

## Change checklist

**Backend:** `017_region_district.sql`, `018_alter_mahalla_district.sql`, `019_alter_distributor_district.sql`;
`RegionModel`/`DistrictModel`; `MahallaModel.district_id`; `DistributorCompanyModel.district_id`;
`RegionController`/`DistrictController`; `MahallaMapper.SelectList`; `DistributorMapper` (district-scoped);
`DistributorCompanyRequest.district_id`; admin distributor CRUD.

**Frontend:** `types/mahalla.ts` (Region/District DTOs, MahallaDto/Params); `api/endpoints.ts`;
`api/services/mahalla.service.ts`; `api/hooks/useMahalla.ts`; `app/mahalla/join.tsx` (3-step);
`app/service/[id].tsx` (resolveImageUrl + drop console.log); locales uz/ru/en.
