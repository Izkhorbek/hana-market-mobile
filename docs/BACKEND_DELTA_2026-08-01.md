# Backend Delta — 2026-08-01 (mobil → .NET)

**Branch:** `develop` · **Repo:** hana-market-mobile
**Kimga:** .NET backend dasturchisi
**Nima:** oxirgi handoff'dan keyingi mobil o'zgarishlarning backend'ga tegishli qismi.

> To'liq kontrakt: [MAHALLA_BACKEND_SPEC.md](MAHALLA_BACKEND_SPEC.md),
> [GAZ_NAVBATI_BACKEND_SPEC.md](GAZ_NAVBATI_BACKEND_SPEC.md),
> [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md). Bu fayl faqat **delta** (o'zgargan qism).

---

## TL;DR — backend uchun bajariladigan ish

| # | Ish | Holat |
|---|-----|-------|
| 1 | **Tarqatuvchi kompaniya profili** — yangi jadval + kengaytirilgan DTO + admin CRUD | 🔴 YANGI — bajarish kerak |
| 2 | "cikl → davr" nomi | 🟢 UI-only — backend'da **hech narsa o'zgartirilMAYDI** (pastda tushuntirish) |
| 3 | Session sana/vaqt formati | 🟢 O'zgarmagan — tasdiq (pastda) |

---

## 1. Tarqatuvchi kompaniya profili  🔴 YANGI

Ilgari tarqatuvchi = `{ user_id, name, phone }` edi. Endi u **rasmiy/yuridik
kompaniya profili** — mahalla a'zolari gaz kim tarqatishini tekshirishi uchun.

### 1.1 Ma'lumotni kim kiritadi
Rasmiy maydonlarni (STIR, manzil, OKED, holat, QQS, ro'yxat sana/raqami,
direktor) **Hana Market platforma admini** o'zining **admin dashboard**idan
kiritadi/tahrirlaydi — mobil app foydalanuvchisi (rais/admin/rezident) EMAS.
Manba: davlat reestri.

### 1.2 Jadval — `distributor_company`
```
id                 PK
mahalla_id         FK -> mahalla(id)            NOT NULL
user_id            FK -> users(id)              NULL   // jonli sessiya yurituvchi akkaunt (bo'lsa)
company_name       string                       NOT NULL   // rasmiy kompaniya / YATT nomi
tin                string(9)                    NOT NULL   // STIR (INN)
legal_address      string                       NULL
oked               string                       NULL       // OKED (IFUT), "kod — nomi"
company_status     enum(active|liquidating|suspended) NOT NULL DEFAULT active
is_vat_payer       bool                         NOT NULL DEFAULT false   // QQS to'lovchisi
vat_certificate_no string                       NULL
registered_at      date                         NULL       // davlat ro'yxatidan o'tgan sana
registry_number    string                       NULL
director_name      string                       NULL       // MChJ rahbari F.I.SH. (YATT uchun null)
phone              string                       NOT NULL   // OCHIQ raqam (E.164) — OTP raqam EMAS
created_at / updated_at
```

### 1.3 DTO — `MahallaDistributorDto` (frontend `types/mahalla.ts`ga AYNAN mos)
```
MahallaDistributorDto {
  id: number
  user_id: number | null
  company_name: string
  tin: string
  legal_address: string | null
  oked: string | null
  company_status: "active" | "liquidating" | "suspended"
  is_vat_payer: boolean
  vat_certificate_no: string | null
  registered_at: string | null      // ISO "yyyy-MM-dd"
  registry_number: string | null
  director_name: string | null
  phone: string
}
```

### 1.4 Endpointlar

**A) Rezidentга (mobil app ishlatadi) — MAVJUD endpoint, javob KENGAYDI:**
```
GET /api/mahalla/{id}/distributors        auth (mahalla a'zosi)
-> ApiResponse<MahallaDistributorDto[]>
```
Ilgari `{user_id,name,phone}` qaytardi; endi to'liq kengaytirilgan DTO qaytadi.
Faqat shu mahalladagi tarqatuvchilar. `phone` = ochiq `phone` ustuni (OTP EMAS).

**B) Adminga (admin dashboard ishlatadi — mobil app'дан TASHQARIDA):**
```
POST   /api/admin/distributors            platforma admin roli
PUT    /api/admin/distributors/{id}       platforma admin roli
DELETE /api/admin/distributors/{id}       platforma admin roli
```
Bu endpointlar admin-panel loyihasiga tegishli; mobil app ularni chaqirmaydi.
Body = DTO maydonlari (id/created/updated'сиз) + `mahalla_id`.

### 1.5 `company_status` enum
`active` (faoliyat ko'rsatmoqda) · `liquidating` (tugatilish jarayonida) ·
`suspended` (muzlatilgan). Mobil app'да rangli badge sifatida ko'rsatiladi.

---

## 2. "cikl → davr" — UI-only, backend O'ZGARMAYDI  🟢

Mobil'да foydalanuvchiga ko'rinadigan o'zbekcha **so'z** "cikl"дан "davr"ga
o'zgardi (i18n qiymatlar + izohlar + hujjatlar). Bu **faqat matn**.

**Backend uchun MUHIM — hech narsa qayta nomlamang:**
- `GasCycleDto`, `CycleHouseholdDto`, `cycle_number`, `distribution_cycle`,
  `/api/gas/cycles*`, i18n **kalitlar** (`cycle`, `cycle_n`, ...) — hammasi
  inglizcha `cycle` bo'lib **QOLADI**. Kontrakt o'zgarmadi.
- Faqat ko'rsatiladigan matn o'zbekcha "davr" — bu backend'ga ta'sir qilmaydi.

GAZ spec §10 (Davr / fairness) kontrakti avvalgidek. Yangi ish yo'q.

---

## 3. Session sana/vaqt formati — o'zgarmagan  🟢

Mobil'да gaz session yaratishда qo'lда matn kiritish o'rniga real date/time
picker qo'yildi, LEKIN backendga yuboriladigan format **avvalgidek**:
```
POST /api/gas/sessions
  scheduled_date: "yyyy-MM-dd"     (masalan "2026-08-15")
  scheduled_time: "HH:mm" | null   (masalan "14:00", 24-soatlik)
```
Backend tomonда o'zgarish shart emas — faqat tasdiq uchun.

---

## 4. Rezident tasdig'i (`confirm`) — MVP: SODDA  🟡

Yangi endpoint emas, [GAZ_NAVBATI_BACKEND_SPEC.md §4.4](GAZ_NAVBATI_BACKEND_SPEC.md):
- **Rezidentда faqat "Oldim"** tugmasi (`received=true`) → sessiya `delivered` +
  `resident_confirmed=true`. Rezident `skipped` qila OLMAYDI.
- **`skipped` ("Uyda yo'q") — faqat admin/rais** (PATCH status).
- **`miss_count++` faqat RASMIY `skipped`da** (admin/rais belgilaydi yoki sessiya
  oxirida yetkazilmagan `pending` uy avtomatik skip bo'ladi). Rezident miss
  keltirmaydi.
- Endpoint `received: boolean` qabul qiladi, lekin MVP frontend faqat `true`
  yuboradi. `received=false` (shikoyat/dispute) — kelajak, hozircha yo'q.

---

## 5. Sessiya tarixi (rais/admin)  🔴 YANGI

Rais/admin o'tgan sessiyalarда "kim oldi / kim olmadi"ni ko'rishi uchun:
```
GET /api/gas/sessions?mahalla_id={id}&current_page=&page_size=   // rais/admin
    → ApiResponse<Paginated<SessionDto>>   // yangi→eski tartibда
```
- Mavjud `POST /api/gas/sessions` (yaratish) bilan **bir path, boshqa metod** (GET=ro'yxat).
- Detali (`SessionDetailDto` — uy-uy statuslar) allaqachon `GET /gas/sessions/{id}`da bor;
  frontend tarix sahifasi shuni qayta ishlatadi.

---

## Checklist (backend)
- [ ] `distributor_company` jadvali (§1.2) + migratsiya
- [ ] `company_status` enum (`active|liquidating|suspended`)
- [ ] `GET /api/mahalla/{id}/distributors` javobini kengaytirilgan DTO'ga o'tkazish (§1.3)
- [ ] Admin CRUD: `POST/PUT/DELETE /api/admin/distributors` (platforma admin roli, §1.4-B)
- [ ] `phone` = ochiq raqam, OTP/shaxsiy raqam qaytarilMASin
- [ ] `confirm` (§4, MVP): rezident faqat received=true→delivered; `skipped`
      faqat admin/rais; miss_count++ faqat rasmiy skip'da (rezident miss keltirmaydi)
- [ ] `GET /api/gas/sessions?mahalla_id=` — sessiya tarixi ro'yxati (rais/admin, §5)
- [ ] (Tekshirish) gaz cycle kontrakti va session sana/vaqt formati o'zgarmagan (§2, §3)
