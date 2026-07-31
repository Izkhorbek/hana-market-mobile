# Gaz Navbati — Backend Spec (Mahalla → Xonadon → Sessiya → UyStatus)

> **Maqsad:** Mahalla darajasida suyultirilgan gaz (balon) taqsimotini shaffof,
> kuzatiladigan va adolatli qilish. Bu davlatning gaz taqsimlash funksiyasini
> ALMASHTIRMAYDI — u ustiga **ma'lumot / shaffoflik qatlami** qo'shadi.
> Huquqiy asos: VMQ 2018-08-10, 646-son (asl hujjatdan tasdiqlansin).
>
> **Konvensiyalar** (mavjud kodga mos):
> - REST path'lar prefix-siz (axios `baseURL` allaqachon `/api` ni o'z ichiga oladi)
> - Request/response body — `snake_case`
> - Barcha javoblar `ApiResponse<T>` bilan o'raladi; ro'yxatlar `PaginatedResponse<T>`
> - Realtime — SignalR (mavjud `signalRService` pattern'i)
> - Auth — mavjud OTP/JWT tizimi; rollar quyida

---

## 1. Rollar (Roles)

| Rol | Kim | Huquqlar |
|---|---|---|
| `mahalla_rais` | Mahalla rahbari | Admin'larni tayinlash, rezidentlarni tasdiqlash + barcha admin amallari |
| `mahalla_admin` | Operatsion (rais tayinlaydi) | Xonadonlarni boshqarish, sessiya ochish, e'lon berish, status belgilash |
| `distributor` | Gaz tarqatuvchi (ixtiyoriy) | Sessiya davomida "hozir qayerda" + uy statusini belgilash |
| `resident` | Oddiy foydalanuvchi | O'z uyini "claim" qilish, sessiyani kuzatish, "oldim/olmadim" tasdiqlash |

Rol `mahalla_member` jadvalida saqlanadi (pastga qarang). Bir foydalanuvchi bir
nechta mahallada har xil rolga ega bo'lishi mumkin.

---

## 2. Ma'lumotlar modeli (Entities)

### 2.1 `mahalla`
Mahalla (MFY) — asosiy hududiy birlik.

| Ustun | Tur | Izoh |
|---|---|---|
| `id` | PK | |
| `name` | string | "Guliston MFY" |
| `district` | string | Tuman |
| `region` | string | Viloyat |
| `center_lat` | double? | Xarita markazi (ixtiyoriy) |
| `center_lng` | double? | |
| `is_active` | bool | |
| `created_at` | datetime | |

### 2.2 `street` (ixtiyoriy, lekin navbat tartibi uchun tavsiya etiladi)
| Ustun | Tur | Izoh |
|---|---|---|
| `id` | PK | |
| `mahalla_id` | FK → mahalla | |
| `name` | string | "Guliston ko'chasi" |
| `order_index` | int | Default marshrut tartibi |

### 2.3 `household` (Xonadon)
| Ustun | Tur | Izoh |
|---|---|---|
| `id` | PK | |
| `mahalla_id` | FK → mahalla | |
| `street_id` | FK → street? | Nullable |
| `house_number` | string | "12", "12A" |
| `address_label` | string | "Guliston ko'chasi, 12-uy" |
| `owner_user_id` | FK → user? | Rezident "claim" qilganda bog'lanadi |
| `lat` / `lng` | double? | Ixtiyoriy |
| `is_verified` | bool | Rais tasdiqlagan |
| `created_at` | datetime | |

### 2.4 `mahalla_member`
Foydalanuvchi ↔ mahalla ↔ rol bog'lovchisi.

| Ustun | Tur | Izoh |
|---|---|---|
| `id` | PK | |
| `mahalla_id` | FK → mahalla | |
| `user_id` | FK → user | |
| `role` | enum | `resident` \| `distributor` \| `mahalla_admin` \| `mahalla_rais` |
| `household_id` | FK → household? | resident uchun |
| `created_at` | datetime | |

### 2.5 `distribution_session` (Sessiya)
Bitta gaz taqsimlash "yurishi".

| Ustun | Tur | Izoh |
|---|---|---|
| `id` | PK | |
| `mahalla_id` | FK → mahalla | |
| `resource_type` | enum | `gas_balloon` (kelajakda `water`, `electricity`) |
| `scheduled_date` | date | |
| `scheduled_time` | time? | |
| `status` | enum | `planned` \| `active` \| `paused` \| `completed` \| `cancelled` |
| `street_order` | int[] (json) | Marshrut: street_id lar tartibi |
| `current_household_id` | FK → household? | **"Hozir qayerda"** — jonli holat |
| `delivered_count` | int | Denormalize (tez o'qish uchun) |
| `total_count` | int | Sessiyadagi jami xonadon |
| `note` | string? | |
| `created_by_user_id` | FK → user | Rais |
| `created_at` / `started_at` / `completed_at` | datetime? | |

### 2.6 `household_status` (UyStatus)
Sessiya ichida har bir xonadonning holati.

| Ustun | Tur | Izoh |
|---|---|---|
| `id` | PK | |
| `session_id` | FK → distribution_session | |
| `household_id` | FK → household | |
| `status` | enum | `pending` \| `current` \| `delivered` \| `skipped` |
| `delivered_at` | datetime? | |
| `confirmed_by` | enum? | `distributor` \| `mahalla_admin` \| `resident` |
| `resident_confirmed` | bool | Rezident o'zi "oldim" bosgan |
| `note` | string? | "uyda yo'q edi" |
| `updated_at` | datetime | |

**Unikal cheklov:** `(session_id, household_id)` — bitta uy bir sessiyada bir marta.

### 2.7 Adolat daftari (fairness) — alohida jadval SHART EMAS
`household_status` tarixidan hisoblanadi:
- Har uyning **oxirgi `delivered_at`** i → adolat ko'rsatkichi
- Oldingi sessiyada `skipped` bo'lgan uylar → keyingi sessiyada **birinchi navbat**
- Yangi sessiya yaratilganda `priority_household_ids` avtomatik to'ldiriladi
  (oxirgi sessiyadagi `skipped` lar).

---

## 3. Holat mashinasi (State machine)

**Session:** `planned → active → (paused ⇄ active) → completed` (yoki istalgan paytda `cancelled`)

**Household status:** `pending → current → delivered`
`pending → current → skipped` (uyda yo'q edi)
`skipped → delivered` (rezident qayta so'rov bergach, keyinroq berilsa)

Sessiya `active` bo'lganda `current_household_id` bitta uyda turadi; keyingisiga
o'tganda oldingisi `delivered`/`skipped` ga o'zgaradi va yangisi `current` bo'ladi.

---

## 4. REST API

### 4.1 Mahalla & a'zolik
```
GET   mahalla/my
      → ApiResponse<MahallaDto[]>   // foydalanuvchi a'zo bo'lgan mahallalar

GET   mahalla/{id}
      → ApiResponse<MahallaDto>

POST  mahalla/join
      body: { mahalla_id, house_number, street_name? }
      → ApiResponse<MahallaMemberDto>   // resident sifatida qo'shiladi + household claim

GET   mahalla/{id}/households?current_page=1&page_size=50   // admin
      → ApiResponse<PaginatedResponse<HouseholdDto>>
```

### 4.2 Xonadon (admin)
```
POST  mahalla/{id}/households
      body: { house_number, street_name?, address_label? }
      → ApiResponse<HouseholdDto>

PUT   households/{household_id}
      body: { house_number?, street_id?, address_label?, is_verified? }
      → ApiResponse<HouseholdDto>

POST  households/{household_id}/claim   // resident o'z uyini biriktiradi
      → ApiResponse<HouseholdDto>
```

### 4.3 Sessiya
```
POST  gas/sessions                       // admin ochadi
      body: { mahalla_id, scheduled_date, scheduled_time?, street_order:int[], note? }
      → ApiResponse<SessionDto>
      // yaratilganda household_status lar 'pending' bilan generatsiya qilinadi
      // + priority (oldingi skipped) hisobga olinadi

GET   gas/sessions/active?mahalla_id={id} // ASOSIY rezident ko'rinishi
      → ApiResponse<SessionDto | null>    // joriy active/planned sessiya

GET   gas/sessions/{id}                   // to'liq: statuslar bilan
      → ApiResponse<SessionDetailDto>     // { session, streets[], households[] with status }

GET   gas/sessions/{id}/my-status         // rezidentning o'z uyi holati
      → ApiResponse<HouseholdStatusDto>   // { status, position_in_queue, houses_ahead, eta_minutes? }

POST  gas/sessions/{id}/start   → ApiResponse<SessionDto>
POST  gas/sessions/{id}/pause   → ApiResponse<SessionDto>
POST  gas/sessions/{id}/complete → ApiResponse<SessionDto>

PATCH gas/sessions/{id}/position          // "hozir qayerda" — admin/distributor
      body: { current_household_id }
      → ApiResponse<SessionDto>
      // → SignalR: GasPositionUpdated
```

### 4.4 UyStatus
```
PATCH gas/sessions/{id}/households/{household_id}/status   // admin/distributor
      body: { status: 'delivered'|'skipped', note? }
      → ApiResponse<HouseholdStatusDto>
      // → SignalR: GasHouseholdStatusChanged

POST  gas/sessions/{id}/households/{household_id}/confirm  // rezident o'zi
      body: { received: boolean, note? }
      → ApiResponse<HouseholdStatusDto>
      // received=false → "kelmadingiz" flag; adolat daftariga tushadi
```

### 4.5 E'lonlar (rais posti — Telegramni yengadigan qatlam)
```
POST  mahalla/{id}/announcements
      body: {
        type: 'gas'|'water'|'electricity'|'general',
        title, body?,
        scheduled_at?,               // qachon
        street_names?: string[],     // qayerda
        session_id?                  // gaz sessiyasiga bog'lash
      }
      → ApiResponse<AnnouncementDto>
      // → butun mahallaga push + (ixtiyoriy) Telegram bridge

GET   mahalla/{id}/announcements?current_page=1&page_size=20
      → ApiResponse<PaginatedResponse<AnnouncementDto>>
```

---

## 5. SignalR (realtime)

Mavjud `signalRService` pattern'iga mos. Guruh: `mahalla:{mahalla_id}`.
Rezident sessiyani ochganda shu guruhga `join` qiladi.

| Event | Payload | Qachon |
|---|---|---|
| `GasSessionStarted` | `{ session_id, mahalla_id, scheduled_time }` | Sessiya `active` bo'ldi |
| `GasPositionUpdated` | `{ session_id, current_household_id, delivered_count, total_count }` | "Hozir qayerda" o'zgardi |
| `GasHouseholdStatusChanged` | `{ session_id, household_id, status }` | Uy delivered/skipped bo'ldi |
| `GasSessionCompleted` | `{ session_id }` | Sessiya tugadi |

---

## 6. Push bildirishnomalar (mavjud notification.service)

| Trigger | Xabar (namuna) | Kimga |
|---|---|---|
| Sessiya `active` | "⛽ Gaz bugun {time} da mahallaga keladi" | Mahalladagi hamma |
| Tarqatuvchi N uy qolganda yaqinlashdi | "Gaz ko'changizga yaqinlashdi — {n} uy qoldi" | Faqat oldinda turgan uylar |
| Rezident uyi `skipped` | "Siz o'tkazib yuborildingiz — qayta so'rov bering" | Shu xonadon egasi |
| Sessiya `completed` | "Bugungi gaz taqsimoti yakunlandi" | Ixtiyoriy |

Notification `type` + `related_id` (session_id / household_id) orqali marshrutlanadi
(mavjud `navigateFromNotification` pattern'i).

---

## 7. DTO namunalari (frontend uchun `types/index.ts` ga)

```ts
export interface SessionDto {
  id: number
  mahalla_id: number
  resource_type: 'gas_balloon'
  scheduled_date: string
  scheduled_time: string | null
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
  current_household_id: number | null
  delivered_count: number
  total_count: number
  note: string | null
}

export interface HouseholdStatusDto {
  household_id: number
  address_label: string
  status: 'pending' | 'current' | 'delivered' | 'skipped'
  houses_ahead: number | null      // "sizgacha N uy"
  eta_minutes: number | null       // taxminiy vaqt (ixtiyoriy, hisoblanadi)
  resident_confirmed: boolean
}
```

---

## 8. Ruxsatlar (authorization) — qisqacha

| Amal | Ruxsat |
|---|---|
| Sessiya ochish/boshqarish, xonadon CRUD, e'lon | `mahalla_admin` (shu mahallada) |
| Position + status belgilash | `mahalla_admin` yoki `distributor` (shu sessiyada) |
| O'z uyi statusini tasdiqlash | `resident` (faqat o'z `household_id` si) |
| Sessiyani ko'rish | Shu mahalla a'zosi |

---

## 9. Muhim qarorlar (rationale)

1. **`street` ixtiyoriy** — MVP da uyni to'g'ridan-to'g'ri mahallaga bog'lasa ham
   ishlaydi; ko'cha keyin qo'shiladi.
2. **Adolat daftari alohida jadval emas** — `household_status` tarixidan
   hisoblanadi. Kod soddaligi uchun.
3. **`delivered_count`/`total_count` denormalize** — rezident ekrani tez-tez
   o'qiydi; har safar COUNT qilmaslik uchun.
4. **Bitta odam yetarli** — hatto faqat `current_household_id` yangilansa ham
   (uy-uy status belgilamasdan) rezident "sizgacha N uy" ni ko'radi. Bu — eng
   kam mehnat bilan asosiy qiymat.
