# Mahalla (Membership) — Backend Spec

> **Maqsad:** Foydalanuvchini mahallaga bog'lash (membership). Bu **Gaz navbati**
> va boshqa hyperlocal funksiyalarning **asosi** — mahallaId busiz bo'lmaydi.
> Frontend tayyor: `types/mahalla.ts`, `api/services/mahalla.service.ts`,
> `api/hooks/useMahalla.ts`, `app/mahalla/join.tsx` (onboarding).
>
> **Konvensiyalar** (Product/Service bilan bir xil): `/api` prefiks, `snake_case`,
> `ApiResponse<T>`. Jadval modeli `GAZ_NAVBATI_BACKEND_SPEC.md` §2 bilan bir xil
> (`mahalla`, `mahalla_member`, `household`).

---

## 1. Jadvallar (Gaz spec §2 bilan umumiy)

- **`mahalla`** — id, name, district, region, (center_lat/lng ixtiyoriy), is_active
- **`mahalla_member`** — id, mahalla_id, user_id, role, household_id?,
  **`is_verified`** (default `false`), **`verified_by`** (rais user_id)?, **`verified_at`**?
- **`household`** — id, mahalla_id, street_id?, house_number, address_label,
  owner_user_id?, is_verified

**`role` enum (ierarxiya):** `resident` < `distributor` < `mahalla_admin` < `mahalla_rais`.
- **`mahalla_rais`** — mahalla rahbari: admin'larni tayinlaydi/o'chiradi, rezidentlarni
  tasdiqlaydi; barcha admin amallarini ham bajaradi.
- **`mahalla_admin`** — operatsion: gaz sessiya + e'lonlar.
- **`distributor`** — gaz tarqatuvchi (jonli boshqaruv).
- **`resident`** — oddiy a'zo.

> **Raisni KIM tayinlaydi?** Self-service EMAS — **platforma (siz / IT Park)**
> mahallani onboarding qilganda birinchi raisni ishonchli tarzda tayinlaydi.
> Keyin rais qolganini boshqaradi. Bu — "avval bitta mahallani egallash" GTM'ga mos.

---

## 2. Endpointlar

### 2.1 `GET /api/mahalla` — **public**
Onboarding tanlovi uchun mahalla qidirish.

Query params (`MahallaListParams`):
| Param | Tur | Izoh |
|---|---|---|
| `region` | string? | Viloyat bo'yicha |
| `district` | string? | Tuman bo'yicha |
| `search` | string? | Nom/tuman bo'yicha qidiruv (frontend >= 2 belgidan yuboradi) |

**Javob:** `ApiResponse<MahallaDto[]>`

### 2.2 `GET /api/mahalla/my` — **auth**
Joriy foydalanuvchining a'zoligi (bo'lmasa `null`).
**Javob:** `ApiResponse<MahallaMemberDto | null>`

> Frontend buni gaz ekranida chaqirib, `mahallaId`ni tiklaydi. `null` bo'lsa
> "Mahalla tanlash" oqimi ko'rsatiladi.

### 2.3 `POST /api/mahalla/join` — **auth**
Foydalanuvchini mahallaga bog'laydi va xonadonni "claim" qiladi.

Body (`JoinMahallaRequest`):
```
{ mahalla_id: number, house_number: string, street_name?: string }
```
Xatti-harakat: `mahalla_member` yozuvi yaratiladi (role=`resident`,
**`is_verified=false` — pending**), `household` topiladi yoki yaratiladi
(address_label = ko'cha + uy raqami) va a'zoga bog'lanadi. Tasdiqni rais beradi (§2.5).

**Javob:** `ApiResponse<MahallaMemberDto>`

### 2.4 `GET /api/mahalla/{id}` — **public**
**Javob:** `ApiResponse<MahallaDto>`

### 2.5 Rais paneli — a'zo tasdiqlash va rol boshqaruvi (YANGI)

Self-join qilgan a'zolarni tasdiqlash va rollarni boshqarish uchun. Ruxsat: `mahalla_rais`.

- `GET /api/mahalla/{id}/members?status=pending&current_page&page_size` — **rais**
  Tasdiqlanmagan (pending) a'zolar ro'yxati (ism + uy raqami + kiritilgan ma'lumot).
  Javob: `ApiResponse<PaginatedResponse<MahallaMemberDto>>`
- `POST /api/mahalla/members/{memberId}/verify` — **rais**
  Tasdiqlaydi: `is_verified=true`, `verified_by`, `verified_at`.
- `POST /api/mahalla/members/{memberId}/reject` — **rais**
  Rad etadi (yozuv o'chiriladi yoki `rejected` belgilanadi).
- `PUT /api/mahalla/members/{memberId}/role` — **rais**
  Body: `{ role: "mahalla_admin" | "distributor" | "resident" }`.
  Rais admin/distributor tayinlaydi. **`mahalla_rais` roli bu orqali BERILMAYDI** (faqat platforma).
- `DELETE /api/mahalla/members/{memberId}` — **rais**
  A'zoni mahalladan chiqaradi.

**Muhim qoidalar:**
- Rezident o'zini ko'tara olmaydi; faqat rais admin/distributor beradi; faqat platforma rais beradi.
- Rol o'zgarishlarini **log qiling** (audit).
- **Gaz navbatiga faqat `is_verified=true` xonadonlar kiradi.**

---

## 3. DTO'lar (frontend `types/mahalla.ts`ga AYNAN mos)

```
MahallaDto {
  id: number
  name: string
  district: string
  region: string
}

MahallaMemberDto {
  id: number
  mahalla_id: number
  user_id: number
  role: "resident" | "distributor" | "mahalla_admin" | "mahalla_rais"
  is_verified: boolean       // false = pending (rais tasdig'ini kutmoqda)
  household_id: number | null
  mahalla: MahallaDto        // /my ikkinchi so'rovsiz ishlashi uchun ichida
}

JoinMahallaRequest {
  mahalla_id: number
  house_number: string
  street_name?: string
}
```

---

## 4. Ruxsatlar

**Endpoint ruxsatlari:**
| Endpoint | Ruxsat |
|---|---|
| `GET /api/mahalla`, `GET /api/mahalla/{id}` | Public |
| `GET /api/mahalla/my`, `POST /api/mahalla/join` | Auth |
| `.../members` (list · verify · reject · role · delete) | `mahalla_rais` |

**Rollar matritsasi:**
| Amal | rais | admin | distributor | resident |
|---|---|---|---|---|
| Admin/distributor tayinlash | ✅ | ❌ | ❌ | ❌ |
| Rezident tasdiqlash/rad etish | ✅ | ❌ | ❌ | ❌ |
| Gaz sessiya + lifecycle | ✅ | ✅ | ❌ | ❌ |
| Jonli tarqatish (position/status) | ✅ | ✅ | ✅ | ❌ |
| O'z uyi tasdig'i (oldim/kelmadi) | ✅ | ✅ | ✅ | ✅ |

---

## 5. Parity checklist

- [ ] `mahalla`, `mahalla_member` (+ `is_verified`/`verified_by`/`verified_at`), `household` jadvallari
- [ ] 4 asosiy endpoint (list/my/join/{id}) + **rais paneli** (§2.5: pending/verify/reject/role/delete)
- [ ] `MahallaMemberDto.mahalla` ichida to'liq `MahallaDto`; `is_verified` maydoni bor
- [ ] `role` = `resident` | `distributor` | `mahalla_admin` | `mahalla_rais` (ierarxiya)
- [ ] `join` → member `is_verified=false` (pending); rais tasdiqlaydi
- [ ] Gaz navbatiga faqat `is_verified=true` xonadonlar
- [ ] `mahalla_rais` faqat platforma tomonidan tayinlanadi (self-service emas)
- [ ] Rol o'zgarishlari audit-log qilinadi
- [ ] list/{id} public; my/join auth; rais paneli — `mahalla_rais`

> **Bog'liqlik:** bu modul **Gaz**dan oldin kerak (mahallaId manbai). Tavsiya
> etilgan tartib: Service → **Mahalla** → Gas.
