# Backend FINAL Spec — Nebor / Hana Market (Mahalla OS)

**Auditoriya:** .NET backend dasturchisi · **Manba:** mobil frontend kodi (endpoints/types/services/SignalR) — bu yagona haqiqat.
**Vazifa:** quyidagi endpointlarni **yaratish/yangilash**. Frontend allaqachon shularni chaqiradi.

> Bu — **master** hujjat. Chuqur dizayn izohlari: [GAZ_NAVBATI_BACKEND_SPEC.md](GAZ_NAVBATI_BACKEND_SPEC.md),
> [MAHALLA_BACKEND_SPEC.md](MAHALLA_BACKEND_SPEC.md), [SERVICE_BACKEND_SPEC.md](SERVICE_BACKEND_SPEC.md).
> Ziddiyat bo'lsa — **shu hujjat** ustuvor (kod bilan sinxron).

---

## 0. Umumiy konvensiyalar

- **Base URL:** hamma path `/api` bilan boshlanadi (`EXPO_PUBLIC_API_URL` = `https://.../api`).
- **Auth:** Bearer token (OTP oqimidan). Har endpointда auth darajasi ko'rsatilgan.
- **Boundary snake_case:** BARCHA request/response maydonlari `snake_case`.
- **Sana/vaqt:** sana `yyyy-MM-dd`, vaqt `HH:mm` (24h), timestamp ISO-8601.
- **Telefon:** ochiq raqamlar E.164 (`+99890...`) — OTP/shaxsiy raqam EMAS.

### Envelope (har javob shu qobiqда)
```
ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors: string[]
  status_code: number
}
PaginatedResponse<T> {
  items: T[]
  current_page: number
  page_size: number
  total_records: number
}
```

### Enumlar (RAQAMLI — aynan shu qiymatlar)
```
ECurrencyType     { UZS = 1000, USD = 1010 }
EServiceCategory  { PLUMBER=1000, ELECTRICIAN=1010, REPAIR=1020, CLEANING=1030,
                    MOVING=1040, TUTOR=1050, GARDENER=1060, APPLIANCE=1070,
                    BEAUTY=1080, OTHER=1090 }
EServicePriceType { HOURLY=1000, PER_JOB=1010, NEGOTIABLE=1020 }
```

### Status unionlari (STRING)
```
MahallaRole            = "resident" | "distributor" | "mahalla_admin" | "mahalla_rais"
ServiceStatus          = "active" | "hidden"
GasSessionStatus       = "planned" | "active" | "paused" | "completed" | "cancelled"
GasHouseholdStatus     = "pending" | "current" | "delivered" | "skipped"
DistributorCompanyStatus = "active" | "liquidating" | "suspended"
```

---

## 1. Ish hajmi — qisqacha

| Domen | Endpointlar | Holat |
|-------|-------------|-------|
| **Mahalla** a'zolik | list, my, by-id, join, distributors | 🔴 YANGI |
| **Distributor** (admin) | admin CRUD | 🔴 YANGI |
| **Xizmat (Service)** | all, by-id, my, create, update, delete | 🔴 YANGI |
| **Gaz — sessiya** | create, **list(tarix)**, active, by-id, my-status, start/pause/complete/cancel, position, household-status, confirm | 🔴 YANGI |
| **Adolat (fairness)** | ALOHIDA "davr" endpoint YO'Q — session-create avtomatik seed qiladi (§3.5) | ⚙️ |
| **Shoshilinch raqamlar** | list + admin CRUD | 🔴 YANGI |
| **SignalR** gaz eventlari | 5 event + JoinMahalla/LeaveMahalla | 🔴 YANGI |

---

## 2. Ma'lumotlar modeli (jadvallar)

**`mahalla`** — id, name, district, region.
**`mahalla_member`** — id, mahalla_id(FK), user_id(FK), role(enum, **BITTA rol**), **is_verified**(bool, false=rais tasdig'ini kutmoqda), household_id(FK,null), **contact_phone**(distributor uchun ochiq raqam, null).
> ⚠️ **UNIQUE (user_id, mahalla_id)** — bir foydalanuvchi bir mahallaда **faqat bitta** member yozuviga ega. Ikki yozuv/ikki rol YARATILMASIN (aks holda `/my` noto'g'ri rolni qaytaradi → app'да rezident admin bo'lib ko'rinadi). `GET /mahalla/my` doim **bitta** membershipни bitta rol bilan qaytaradi.
**`household`** — id, mahalla_id(FK), street_id(FK,null), house_number, address_label, (user_id egasi).
**`distributor_company`** — §4.2 DTO maydonlari + mahalla_id(FK).
**`service`** — §4.3 DTO maydonlari (Product'дан alohida jadval), user_id(FK).
**`distribution_session`** — id, mahalla_id, resource_type, scheduled_date, scheduled_time(null), status, current_household_id(null), delivered_count, total_count, note(null). *(cycle_id YO'Q — "davr" tushunchasi olib tashlandi.)*
**`gas_household`** (sessiya ichi) — session_id(FK), household_id(FK), street_id, house_number, address_label, status(enum), resident_confirmed(bool), confirmed_by(enum: distributor|mahalla_admin|resident, null).
**`mahalla_distribution_state`** (adolat holati — mahalla uchun BITTA qator) — mahalla_id(FK, unique), last_served_household_id(null, resume pointer), skipped_household_ids(oldingi sessiyada o'tkazib yuborilganlar → keyingi safar birinchi). *(Alohida "cycle" jadvali shart emas — oxirgi sessiyadan ham hosil qilса bo'ladi.)*
**`emergency_section`** / **`emergency_number`** — §4.6.

---

## 3. Endpointlar

### 3.1 Mahalla a'zolik
```
GET    /api/mahalla?region=&district=&search=        auth   → ApiResponse<MahallaDto[]>
GET    /api/mahalla/my                                auth   → ApiResponse<MahallaMemberDto | null>
GET    /api/mahalla/{id}                              public → ApiResponse<MahallaDto>
POST   /api/mahalla/join    body: JoinMahallaRequest  auth   → ApiResponse<MahallaMemberDto>
GET    /api/mahalla/{id}/distributors                 auth (a'zo) → ApiResponse<MahallaDistributorDto[]>
```
- `/join` — user'ni mahallaga bog'laydi + xonadonni band qiladi; `is_verified=false` (rais tasdiqlaydi).
- `/distributors` — tarqatuvchi **kompaniyalar** (rasmiy/yuridik ma'lumot + ochiq `phone`).

### 3.2 Distributor (admin dashboard — mobil app'дан TASHQARIDA)
```
POST   /api/admin/distributors        platforma admin  body: MahallaDistributorDto(id'siz) + mahalla_id
PUT    /api/admin/distributors/{id}   platforma admin
DELETE /api/admin/distributors/{id}   platforma admin
```
Rasmiy maydonlarni (STIR, manzil, OKED, holat, QQS, ro'yxat sana/raqami, direktor) **platforma admini** kiritadi — mahalla foydalanuvchisi emas.

### 3.3 Xizmat (Service) — Product'дан alohida domen
```
GET    /api/service/all?user_lat=&user_long=&current_page=&page_size=&category=&search_query=&radius_km=
       auth → ApiResponse<PaginatedResponse<ServiceListItemDto>>
GET    /api/service/{id}                 auth → ApiResponse<SingleServiceDto>
GET    /api/service/my                   auth → ApiResponse<ServiceListItemDto[]>
POST   /api/service/create               auth   multipart/form-data (ServiceCreateRequest maydonlari + images)
       → ApiResponse<{ service_id: number }>
PUT    /api/service/{id}   body: ServiceUpdateRequest   auth → ApiResponse<object>
DELETE /api/service/{id}                 auth → ApiResponse<object>
```
- Provayder **telefon orqali** bog'lanadi (Path A) — chat/product bog'lanishi YO'Q.
- Draft rasmlar mavjud **product** draft-upload endpoint'ini qayta ishlatadi (`images_json`).

### 3.4 Gaz — sessiya
```
POST   /api/gas/sessions   body: CreateGasSessionRequest   manager (admin/rais/distributor)
       → ApiResponse<GasSessionDto>
       // ADOLAT — AVTOMATIK seed (§3.5): yangi sessiya household queue'si
       //   1) oldingi sessiyada o'tkazib yuborilganlar (skipped) → BIRINCHI
       //   2) keyin resume pointer'dan (oxirgi berilgan uydan) davom etadi
       // → hech kim "davr" ochmaydi; UI'да davr YO'Q.
GET    /api/gas/sessions?mahalla_id=&current_page=&page_size=   rais/admin (TARIX)
       → ApiResponse<PaginatedResponse<GasSessionDto>>   // yangi→eski
GET    /api/gas/sessions/active?mahalla_id={id}   a'zo → ApiResponse<GasSessionDto | null>
GET    /api/gas/sessions/{id}                     a'zo → ApiResponse<GasSessionDetailDto>
GET    /api/gas/sessions/{id}/my-status           a'zo → ApiResponse<GasHouseholdStatusDto>
POST   /api/gas/sessions/{id}/start               admin → ApiResponse<GasSessionDto>
POST   /api/gas/sessions/{id}/pause               admin → ApiResponse<GasSessionDto>
POST   /api/gas/sessions/{id}/complete            admin → ApiResponse<GasSessionDto>
POST   /api/gas/sessions/{id}/cancel              admin → ApiResponse<GasSessionDto>
       // planned/paused sessiya → status='cancelled'. /active endi uni QAYTARMAYDI
       // (faqat planned/active/paused). complete EMAS — bekor qilingan alohida holat.
PATCH  /api/gas/sessions/{id}/position   body: { current_household_id }   admin/distributor
       → ApiResponse<GasSessionDto>   // → SignalR GasPositionUpdated
PATCH  /api/gas/sessions/{id}/households/{household_id}/status
       body: { status: "delivered"|"skipped", note? }   admin/distributor
       → ApiResponse<GasHouseholdStatusDto>   // → SignalR GasHouseholdStatusChanged
POST   /api/gas/sessions/{id}/households/{household_id}/confirm
       body: { received: boolean, note? }   rezident (o'zi)
       → ApiResponse<GasHouseholdStatusDto>   // → SignalR GasHouseholdStatusChanged
```

### 3.5 Adolat (fairness) — ALOHIDA endpoint YO'Q, avtomatik

"Davr (cycle)" tushunchasi **olib tashlandi** — sodda va tushunarli bo'lsin uchun.
Adolat sessiya ketma-ketligiga **ichki**: hech kim davr ochmaydi/yopmaydi.

Backend `mahalla_distribution_state` yuritadi (mahalla uchun bitta qator):
```
last_served_household_id   // resume pointer — gaz tugagan/to'xtagan joy
skipped_household_ids[]     // oldingi sessiyada uyda yo'q bo'lganlar
```
**`POST /api/gas/sessions` (yangi sessiya) → queue AVTOMATIK generatsiya:**
1. `skipped_household_ids` → BIRINCHI navbatga (o'tkazib yuborilganlar oldin oladi).
2. Keyin `last_served_household_id` dan N gacha davom (qolgan joyidan).
3. Sessiya davomida delivered/skipped belgilanadi; **complete/pause** bo'lganда
   backend `last_served_household_id` va `skipped_household_ids` ni yangilaydi.

**Tartib buzilса** (masalan navbatsiz berilса) → `GasCycleWarning` SignalR eventi
barcha a'zolarga ("Tartib buzildi") — accountability. Bu YAGONA "warning" signali.

### 3.6 Shoshilinch raqamlar (admin boshqaradi)
```
GET    /api/emergency-numbers            public/auth → ApiResponse<EmergencySectionDto[]>
```
- Mobil app shuni chaqiradi; backend bermaguncha frontend lokal seed ko'rsatadi.
- **Admin CRUD (admin dashboard):**
```
POST/PUT/DELETE  /api/admin/emergency-sections        platforma admin
POST/PUT/DELETE  /api/admin/emergency-numbers         platforma admin
```
Admin bo'lim (title, emoji, order) va raqamlarni (number, name) qo'shadi/o'chiradi.

---

## 4. DTO'lar (frontend `types/*`ga AYNAN mos)

### Mahalla
```
MahallaDto { id, name, district, region }

MahallaMemberDto {
  id, mahalla_id, user_id
  role: MahallaRole
  is_verified: boolean          // false = rais tasdig'ini kutmoqda
  household_id: number | null
  mahalla: MahallaDto           // /my ikkinchi so'rovsiz ishlashi uchun
}

JoinMahallaRequest { mahalla_id, house_number, street_name? }
MahallaListParams  { region?, district?, search? }

// Tarqatuvchi KOMPANIYA profili — rasmiy maydonlar admin dashboard'дан.
MahallaDistributorDto {
  id: number
  user_id: number | null        // jonli sessiya yurituvchi akkaunt (bo'lsa)
  company_name: string          // rasmiy kompaniya / YATT nomi
  tin: string                   // STIR (INN) — 9 xonali
  legal_address: string | null
  oked: string | null           // OKED (IFUT) "kod — nomi"
  company_status: DistributorCompanyStatus   // active|liquidating|suspended
  is_vat_payer: boolean
  vat_certificate_no: string | null
  registered_at: string | null  // yyyy-MM-dd
  registry_number: string | null
  director_name: string | null  // YATT uchun null
  phone: string                 // ochiq raqam (E.164) — OTP EMAS
}
```

### Xizmat (Service)
```
ServiceCreateRequest (multipart) {
  category: EServiceCategory
  title: string
  description?: string
  price_type: EServicePriceType
  currency_type?: ECurrencyType
  price_uzs?: number
  price_usd?: number
  phone_number: string          // ochiq raqam
  latitude?: number
  longitude?: number
  moljal?: string               // mo'ljal
  availability?: string         // ish vaqti, erkin matn
  images_json?: string          // JSON.stringify(DraftImageDto[])
}
ServiceUpdateRequest { category?, title?, description?, price_type?, currency_type?,
  price_uzs?, price_usd?, phone_number?, moljal?, availability?, status?: ServiceStatus }

ServiceListItemDto {
  id, category, category_name: string|null, title: string|null, description: string|null,
  price: string|null, price_type, price_type_name: string|null, phone_number: string|null,
  main_image_url: string|null, distance: string|null, moljal: string|null, created_ago: string|null
}
SingleServiceDto {
  id, user_id, provider: User, category, category_name, title, description,
  price, price_type, price_type_name, currency_type, phone_number,
  latitude: number|null, longitude: number|null, moljal, availability,
  status: ServiceStatus, images: string[], distance, created_ago, created_at
}
ServiceListParams { user_lat, user_long, current_page?, page_size?, category?, search_query?, radius_km? }
```

### Gaz — sessiya
```
GasSessionDto {
  id, mahalla_id, resource_type: "gas_balloon",
  scheduled_date, scheduled_time: string|null, status: GasSessionStatus,
  current_household_id: number|null, delivered_count, total_count, note: string|null
}
GasHouseholdStatusDto {          // my-status + confirm/status javoblari
  household_id, address_label, status: GasHouseholdStatus,
  houses_ahead: number|null, eta_minutes: number|null, resident_confirmed: boolean
}
GasHouseholdRow { household_id, street_id: number|null, house_number, address_label, status, is_mine? }
GasStreetRow    { street_id, name, order_index, delivered_count, total_count }
GasSessionDetailDto { session: GasSessionDto, streets: GasStreetRow[], households: GasHouseholdRow[] }

CreateGasSessionRequest { mahalla_id, scheduled_date, scheduled_time?, street_order: number[], note? }
UpdateGasPositionRequest { current_household_id }
UpdateGasHouseholdStatusRequest { status: "delivered"|"skipped", note? }
ConfirmGasReceiptRequest { received: boolean, note? }
```

### Shoshilinch raqamlar
```
EmergencyNumberDto  { id?: number, number: string, name: string }
EmergencySectionDto { id?: number, title: string, emoji: string, order?: number, items: EmergencyNumberDto[] }
```

---

## 5. SignalR (realtime — hozircha backend'da YO'Q, yaratish kerak)

- **Hub:** `/hubs/chat` (mavjud chat hub — gaz eventlari **additive**, chatni buzmaydi).
- **Guruh:** `mahalla:{mahallaId}` — mijoz `JoinMahalla(mahallaId)` / `LeaveMahalla(mahallaId)` invoke qiladi.
- **Access token:** `accessTokenFactory` har (re)connect'да tokenni qayta o'qiydi.

**Server → client eventlar (mahalla guruhiga):**
```
GasSessionStarted        { session_id, mahalla_id, scheduled_time: string|null }
GasPositionUpdated       { session_id, current_household_id: number|null, delivered_count, total_count }
GasHouseholdStatusChanged{ session_id, household_id, status: GasHouseholdStatus }
GasSessionCompleted      { session_id }
GasCycleWarning          { mahalla_id, cycle_number, forced_by_user_id, unserved_count, reason }
```
**Client → server metodlar:** `JoinMahalla(mahallaId)`, `LeaveMahalla(mahallaId)`.

> Eslatma: SignalR yo'q bo'lsa ham app ishlaydi (frontend polling + refetch qiladi), lekin realtime uchun bu eventlar kerak.

---

## 6. Muhim biznes qoidalar

**Rezident tasdig'i (`confirm`) — MVP SODDA:**
- Rezidentда faqat **"Oldim"** (`received=true`) → `status=delivered`, `resident_confirmed=true`, `confirmed_by=resident`.
- Rezident `skipped` qila OLMAYDI. MVP frontend `received=false` **yubormaydi**.
- **`skipped` ("Uyda yo'q") + `delivered` ("Berildi")** — admin/rais/distributor `PATCH .../status` orqali.
- **`miss_count++` faqat RASMIY `skipped`da** (admin/rais belgilaydi yoki sessiya oxirida yetkazilmagan `pending` uy avtomatik skip). Rezident miss keltirmaydi.

**Adolat (SODDA — "davr" tushunchasisiz):**
- Tartib xonadon tartibida (order_index). Yangi sessiya = [skipped] + [resume pointer dan N gacha] (3.5). Hech kim davr ochmaydi.
- Uyda yo yo (skipped) -> keyingi sessiyada BIRINCHI oladi. Gaz tugasa -> keyingi safar qolgan joyidan.
- Rollar SODDA: sessiyani MANAGER (admin/rais/distributor) ochadi va yuritadi. Alohida davr roli/oqimi YO Q.
- Tartib buzilsa -> GasCycleWarning ("Tartib buzildi") barcha a zolarga (accountability).

**Distributor & Emergency — admin boshqaradi:** rasmiy ma'lumotlar platforma admini tomonidan (admin dashboard), mobil foydalanuvchi emas.

---

## 7. Checklist (backend)

- [ ] Envelope `ApiResponse<T>` / `PaginatedResponse<T>` — barcha javoblar shu qobiqда
- [ ] Enumlar aynan raqamli qiymatlar bilan
- [ ] Mahalla: list/my/by-id/join/distributors + `is_verified` verifikatsiya oqimi
- [ ] **`mahalla_member` UNIQUE (user_id, mahalla_id)** — bir user bir mahallaда bitta rol; `/my` bitta membership qaytaradi
- [ ] `distributor_company` jadvali + admin CRUD (`/api/admin/distributors`)
- [ ] Service: all/by-id/my/create(multipart)/update/delete
- [ ] Gaz sessiya: create/**list(tarix)**/active/by-id/my-status/start/pause/complete/**cancel**/position/household-status/confirm
- [ ] `GET /active` faqat planned|active|paused qaytaradi (completed/cancelled → null)
- [ ] **Adolat AVTOMATIK** (§3.5): `mahalla_distribution_state` (resume pointer + skipped) →
      `POST /gas/sessions` queue'ни skipped-birinchi + qolgan joyidan seed qiladi. Alohida "davr" endpoint YO'Q.
- [ ] `confirm` MVP semantikasi (received=true→delivered; skip faqat admin; miss faqat rasmiy skip)
- [ ] Emergency: `GET /api/emergency-numbers` + admin CRUD
- [ ] SignalR: `mahalla:{id}` guruh, JoinMahalla/LeaveMahalla, 5 gaz eventi
- [ ] `phone`/`contact_phone` — ochiq raqam, OTP/shaxsiy raqam qaytarilMASin
- [ ] snake_case boundary, sana `yyyy-MM-dd`, vaqt `HH:mm`
