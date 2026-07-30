# Xizmat (Service) — Backend Spec

> **Maqsad:** Mobil ilovadagi Xizmat (Service) oqimi uchun backend kontrakti.
> Frontend allaqachon tayyor (`types/service.ts`, `api/services/service.service.ts`,
> `api/hooks/useService.ts`). Backend shu kontraktni **1:1** amalga oshirishi kerak.
>
> **Konvensiyalar** (mavjud Product bilan bir xil):
> - REST path'lar `/api` prefiksi bilan; body/response — `snake_case`
> - Barcha javoblar `ApiResponse<T>` bilan o'raladi; ro'yxatlar `PaginatedResponse<T>`
> - Xizmat — **alohida domen** (o'z jadvali), Product'dan mustaqil
> - Ustaga **telefon** orqali bog'lanadi (Path A) — chat/product bog'lanishi YO'Q
> - Masofa (distance) hisoblash Product `all` bilan bir xil (Haversine + radius)

---

## 1. Enums (qiymatlar AYNAN mos bo'lishi shart)

Frontend `constants/enums.ts`:

```
EServiceCategory:                 EServicePriceType:
  PLUMBER      = 1000               HOURLY     = 1000   // Soatlik
  ELECTRICIAN  = 1010               PER_JOB    = 1010   // Ish boshiga
  REPAIR       = 1020               NEGOTIABLE = 1020   // Kelishiladi
  CLEANING     = 1030
  MOVING       = 1040             ECurrencyType (mavjud):
  TUTOR        = 1050               UZS = 1000
  GARDENER     = 1060               USD = 1010
  APPLIANCE    = 1070
  BEAUTY       = 1080            ServiceStatus: "active" | "hidden"
  OTHER        = 1090
```

---

## 2. Ma'lumotlar modeli (yangi jadvallar)

### 2.1 `service`
| Ustun | Tur | Izoh |
|---|---|---|
| `id` | PK | |
| `user_id` | FK → user | Xizmat egasi (provayder) |
| `category` | int (enum) | `EServiceCategory` |
| `title` | string | Majburiy |
| `description` | string? | |
| `price_type` | int (enum) | `EServicePriceType` |
| `currency_type` | int (enum)? | `ECurrencyType`; `negotiable`da null bo'lishi mumkin |
| `price_uzs` | decimal? | |
| `price_usd` | decimal? | |
| `phone_number` | string | E.164 (`+998...`), **ochiq** ko'rsatiladi |
| `latitude` | double? | |
| `longitude` | double? | |
| `moljal` | string? | Mo'ljal (landmark) |
| `availability` | string? | Ish vaqti, erkin matn ("9:00–18:00") |
| `status` | string | `active` \| `hidden`; default `active` |
| `created_at` / `updated_at` | datetime | |

### 2.2 `service_image`
`product_image` jadvalini aynan ko'zgu qiladi.

| Ustun | Tur |
|---|---|
| `id` | PK |
| `service_id` | FK → service |
| `image_url` | string |
| `sort_order` | int |

**Draft rasm mexanizmi:** frontend **mavjud product draft-upload endpoint'ini**
(`POST /api/product/images/upload-draft`) qayta ishlatadi. `service/create`
`images_json` maydonini xuddi `product/create` kabi qabul qiladi va draft
rasmlarni `service_image`ga ko'chiradi. Alohida upload endpoint kerak emas.

---

## 3. REST endpointlar

### 3.1 `POST /api/service/create` — **auth**
Content-Type: `multipart/form-data` (Product create bilan bir xil).

**Form maydonlari** (frontend `CreateServiceForm` aynan shularni yuboradi):
| Maydon | Majburiy | Izoh |
|---|---|---|
| `category` | ✅ | numeric enum |
| `title` | ✅ | |
| `description` | ⬜ | |
| `price_type` | ✅ | numeric enum |
| `currency_type` | ⬜ | narx bo'lsa yuboriladi |
| `price_uzs` **yoki** `price_usd` | ⬜ | `negotiable`da yuborilmaydi |
| `phone_number` | ✅ | E.164 |
| `latitude`, `longitude` | ⬜ | avtomatik aniqlanadi |
| `moljal` | ⬜ | |
| `availability` | ⬜ | |
| `images_json` | ⬜ | `JSON.stringify(DraftImageDto[])` |

**Javob:** `ApiResponse<{ service_id: number }>`

### 3.2 `GET /api/service/all` — **public (guest ham)**
Query params (`ServiceListParams`):
| Param | Tur | Izoh |
|---|---|---|
| `user_lat` | double | majburiy — masofa uchun |
| `user_long` | double | majburiy |
| `current_page` | int? | default 1 |
| `page_size` | int? | |
| `category` | int? | `EServiceCategory` filtri |
| `search_query` | string? | title/description bo'yicha |
| `radius_km` | int? | |

**Javob:** `ApiResponse<PaginatedResponse<ServiceListItemDto>>`
Faqat `status = active` qaytadi, masofa bo'yicha saralangan.

### 3.3 `GET /api/service/my` — **auth**
Joriy foydalanuvchining xizmatlari.
**Javob:** `ApiResponse<ServiceListItemDto[]>`

### 3.4 `GET /api/service/{id}` — **public**
**Javob:** `ApiResponse<SingleServiceDto>`

### 3.5 `PUT /api/service/{id}` — **auth, faqat ega**
Body: `ServiceUpdateRequest` (JSON).
**Javob:** `ApiResponse<object>`

### 3.6 `DELETE /api/service/{id}` — **auth, faqat ega**
**Javob:** `ApiResponse<object>`

---

## 4. Response DTO'lari (frontend `types/service.ts`ga AYNAN mos)

### `ServiceListItemDto` (ro'yxat qatori)
```
id: number
category: number            // EServiceCategory
category_name: string|null  // lokalizatsiyalangan ko'rinish nomi
title: string|null
description: string|null
price: string|null          // formatlangan ("150 000 so'm"); negotiable → null
price_type: number          // EServicePriceType
price_type_name: string|null
phone_number: string|null   // qo'ng'iroq tugmasi uchun
main_image_url: string|null
distance: string|null       // "1.2 km"
moljal: string|null
created_ago: string|null    // "2 soat oldin"
```

### `SingleServiceDto` (detal)
```
id, user_id
provider: User              // Product'dagi `seller: User` kabi
category: number
category_name: string|null
title: string
description: string|null
price: string|null
price_type: number
price_type_name: string|null
currency_type: number       // ECurrencyType
phone_number: string|null
latitude: number|null
longitude: number|null
moljal: string|null
availability: string|null
status: "active"|"hidden"
images: string[]            // to'liq URL'lar
distance: string|null
created_ago: string|null
created_at: string
```

### Yordamchi shakllar (mavjud, o'zgarmaydi)
```
ApiResponse<T>       = { success, message?, data?, errors, status_code }
PaginatedResponse<T> = { items: T[], current_page, page_size, total_records }
DraftImageDto        = { draft_uuid, draft_image_url, sort_order }
```

---

## 5. Ruxsatlar

| Endpoint | Ruxsat |
|---|---|
| `all`, `{id}` | Public (guest ham ko'radi) |
| `create`, `my` | Auth |
| `update`, `delete` | Auth + faqat xizmat egasi |

---

## 6. Muhim xatti-harakatlar (rationale)

1. **`category_name` / `price_type_name`** — backend lokalizatsiyalangan ko'rinish
   nomini beradi (Product'dagi `category_name_uz/ru` yondashuvi; til `Accept-Language`
   yoki so'rov konteksti bo'yicha).
2. **`price`** — ro'yxat/detalда **formatlangan string** (Product kabi); `negotiable`
   bo'lsa `null`. Xom `price_uzs/usd` faqat create/update'da.
3. **Guest ko'rishi** — `all`/`{id}` public, chunki xizmatlar telefon orqali,
   ochiq katalog mantiqiy (Product feed'i kabi).
4. **Chat yo'q** — xizmatga chat biriktirilmaydi; `phone_number` yagona bog'lanish.
5. **Draft rasm** — Product draft-upload'ini qayta ishlatadi; yangi upload endpoint yo'q.

---

## 7. Parity checklist (backend dasturchi uchun)

- [ ] `EServiceCategory` (1000–1090) va `EServicePriceType` (1000–1020) qiymatlari mos
- [ ] `service` + `service_image` jadvallari
- [ ] 6 endpoint (create/all/my/{id} GET/PUT/DELETE)
- [ ] `create` multipart, `images_json` product draft'ni qayta ishlatadi
- [ ] `all` — masofa bo'yicha, faqat `active`, `PaginatedResponse`
- [ ] `ServiceListItemDto` / `SingleServiceDto` maydonlari `types/service.ts` bilan bir xil
- [ ] `all`/`{id}` public; `create/my/update/delete` auth; update/delete ega-tekshiruvi
- [ ] `{ service_id }` create javobi
