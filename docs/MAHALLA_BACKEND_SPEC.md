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
- **`mahalla_member`** — id, mahalla_id, user_id, role, household_id?
- **`household`** — id, mahalla_id, street_id?, house_number, address_label,
  owner_user_id?, is_verified

`role` enum: `resident` | `mahalla_admin` | `distributor`.

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
Xatti-harakat: `mahalla_member` yozuvi yaratiladi (role=`resident`), `household`
topiladi yoki yaratiladi (address_label = ko'cha + uy raqami) va a'zoga bog'lanadi.

**Javob:** `ApiResponse<MahallaMemberDto>`

### 2.4 `GET /api/mahalla/{id}` — **public**
**Javob:** `ApiResponse<MahallaDto>`

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
  role: "resident" | "mahalla_admin" | "distributor"
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

| Endpoint | Ruxsat |
|---|---|
| `GET /api/mahalla`, `GET /api/mahalla/{id}` | Public |
| `GET /api/mahalla/my`, `POST /api/mahalla/join` | Auth |

---

## 5. Parity checklist

- [ ] `mahalla`, `mahalla_member`, `household` jadvallari (Gaz spec §2 bilan umumiy)
- [ ] 4 endpoint (list/my/join/{id})
- [ ] `MahallaMemberDto.mahalla` ichida to'liq `MahallaDto` (frontend shunga tayanadi)
- [ ] `role` = `resident` | `mahalla_admin` | `distributor`
- [ ] `join` — member yaratadi + household claim, `MahallaMemberDto` qaytaradi
- [ ] list/{id} public; my/join auth

> **Bog'liqlik:** bu modul **Gaz**dan oldin kerak (mahallaId manbai). Tavsiya
> etilgan tartib: Service → **Mahalla** → Gas.
