# Backend Handoff — Nebor (Xizmat · Mahalla · Gaz)

> Mobil ilovaga uch yangi bo'lim qo'shildi: **Xizmat** (mahalla xizmatlari),
> **Mahalla** (a'zolik) va **Gaz navbati** (jonli gaz taqsimoti). **Frontend
> to'liq tayyor** va backend qismini kutyapti. `develop` branch'ni tortib oling;
> to'liq kontraktlar `docs/*_BACKEND_SPEC.md` ichida (har birida parity checklist).
>
> Bu hujjat — **kirish nuqtasi**: umumiy qoidalar, ishlash tartibi, endpoint
> jadvali va "tayyor" mezoni. Batafsil DTO/jadval — tegishli spec'da.

---

## 0. Umumiy konvensiyalar (barcha yangi endpointlar uchun)

- **Prefiks:** hamma REST path `/api` bilan.
- **Body/response:** `snake_case`.
- **O'rov:** har javob `ApiResponse<T>`; ro'yxatlar `PaginatedResponse<T>`:
  ```
  ApiResponse<T>       = { success, message?, data?, errors, status_code }
  PaginatedResponse<T> = { items: T[], current_page, page_size, total_records }
  ```
- **Auth:** mavjud JWT (Bearer). "public" deb belgilanganlar mehmon (guest) uchun ham ochiq.
- **Masofa (distance):** Product `all` bilan bir xil (Haversine + radius); formatlangan string ("1.2 km").
- **Enum qiymatlari AYNAN mos bo'lishi shart** — frontend raqamlarni yuboradi (§ pastda).
- **Draft rasm:** Xizmat mavjud `POST /api/product/images/upload-draft` ni qayta
  ishlatadi — yangi upload endpoint kerak emas.

---

## Ishlash tartibi: **Service → Guest → Mahalla → Gaz**

Mahalla — Gaz'ning asosi (`mahallaId` manbai), shuning uchun Gaz'dan oldin.

---

## PRIORITET 1 — Xizmat (Service) ⬅️ eng muhim, frontend bloklangan

**Spec:** [SERVICE_BACKEND_SPEC.md](SERVICE_BACKEND_SPEC.md)

- Yangi 2 jadval: `service` + `service_image` (`service_image` = `product_image` ko'zgusi).
- 6 endpoint (pastdagi jadvalda).
- **Must-match:**
  - `EServiceCategory` = 1000, 1010, …, 1090 (10 ta) · `EServicePriceType` = 1000/1010/1020.
  - `create` — multipart; javob `{ service_id }`; `images_json` product draft'ni qayta ishlatadi.
  - `price` — ro'yxat/detalda formatlangan string; "kelishiladi" bo'lsa `null`.
  - `all` — faqat `status = active`, masofa bo'yicha saralangan, `PaginatedResponse`.

## PRIORITET 2 — Guest (mehmon) ko'rishi

`service/all` va `service/{id}` ni **public** qiling (xuddi `product/all`,
`product/{id}` kabi) — mehmon foydalanuvchi ham xizmatlarni ko'rsin.
(Eslatma: `product/all` + `product/{id}` public bo'lishi Guest Mode uchun oldindan
kutilayotgan talab — hali bajarilmagan bo'lsa, shu bilan birga bajaring.)

## PRIORITET 3 — Mahalla (membership)

**Spec:** [MAHALLA_BACKEND_SPEC.md](MAHALLA_BACKEND_SPEC.md)

- Jadvallar: `mahalla`, `mahalla_member`, `household`.
- 4 endpoint (jadvalda).
- **Must-match:** `MahallaMemberDto.mahalla` ichida to'liq `MahallaDto` bo'lishi shart
  (frontend `/my`ni ikkinchi so'rovsiz ishlatadi). `role` (ierarxiya) = `resident` |
  `distributor` | `mahalla_admin` | `mahalla_rais`.
- **Membership + verification:** self-join → member `is_verified=false` (pending);
  **mahalla_rais** tasdiqlaydi. Rais admin/distributor tayinlaydi; raisni faqat
  platforma tayinlaydi. Rais paneli endpointlari + ruxsatlar matritsasi — spec §2.5/§4.
  Gaz navbatiga faqat verified xonadonlar kiradi.

## PRIORITET 4 — Gaz navbati

**Spec:** [GAZ_NAVBATI_BACKEND_SPEC.md](GAZ_NAVBATI_BACKEND_SPEC.md)

- Jadvallar: `distribution_session`, `distribution_cycle`, `cycle_household`
  (+ Mahalla'nikilar).
- REST endpointlar (jadvalda) + realtime.
- **Realtime — muhim:** gaz eventlari **mavjud chat hub'iga** (`/hubs/chat`) qo'shiladi
  (alohida hub EMAS). Guruh: `mahalla:{id}`. Hub metodlari: `JoinMahalla(mahallaId)`,
  `LeaveMahalla(mahallaId)`. Eventlar: `GasSessionStarted`, `GasPositionUpdated`,
  `GasHouseholdStatusChanged`, `GasSessionCompleted`, `GasCycleWarning` (spec §5/§10).
- **Cikl (adolat kafolati) — spec §10:** taqsimot butun mahalladan bir to'liq o'tish
  (1→N). Gaz kam kelsa cikl bir necha sessiyaga bo'linadi, **oxirgi pozitsiyadan
  davom etadi**. Uy **2 marta** o'tkazib yuborilsa → `skipped`. Cikl hamma
  `delivered`/`skipped` bo'lganda yopiladi; skipped keyingi ciklda **prioritet**.
  **Tugamaguncha yangi cikl bloklangan** (409); `?force=true` → override +
  `cycle_override` log + hammaga warning.

---

## Endpoint jadvali (umumiy ko'rinish)

| Modul | Metod + Path | Auth |
|---|---|---|
| Service | `POST /api/service/create` (multipart) | auth |
| Service | `GET /api/service/all` | public |
| Service | `GET /api/service/my` | auth |
| Service | `GET /api/service/{id}` | public |
| Service | `PUT /api/service/{id}` | auth, ega |
| Service | `DELETE /api/service/{id}` | auth, ega |
| Mahalla | `GET /api/mahalla` | public |
| Mahalla | `GET /api/mahalla/my` | auth |
| Mahalla | `POST /api/mahalla/join` | auth |
| Mahalla | `GET /api/mahalla/{id}` | public |
| Mahalla | `GET /api/mahalla/{id}/distributors` | auth (a'zo) |
| Gaz | `POST /api/gas/sessions` | mahalla_admin / rais |
| Gaz | `GET /api/gas/sessions/active?mahalla_id=` | a'zo |
| Gaz | `GET /api/gas/sessions/{id}` | a'zo |
| Gaz | `GET /api/gas/sessions/{id}/my-status` | a'zo |
| Gaz | `POST /api/gas/sessions/{id}/start\|pause\|complete` | admin |
| Gaz | `PATCH /api/gas/sessions/{id}/position` | admin/distributor |
| Gaz | `PATCH /api/gas/sessions/{id}/households/{hid}/status` | admin/distributor |
| Gaz | `POST /api/gas/sessions/{id}/households/{hid}/confirm` | resident |
| Gaz | `POST /api/gas/cycles?force=` | admin/distributor |
| Gaz | `GET /api/gas/cycles/current?mahalla_id=` | a'zo |
| Gaz | `GET /api/gas/cycles/{id}/households` | a'zo |

---

## Enum reference (frontend shularni yuboradi)

```
EServiceCategory:  PLUMBER=1000 ELECTRICIAN=1010 REPAIR=1020 CLEANING=1030
                   MOVING=1040 TUTOR=1050 GARDENER=1060 APPLIANCE=1070
                   BEAUTY=1080 OTHER=1090
EServicePriceType: HOURLY=1000 PER_JOB=1010 NEGOTIABLE=1020
ECurrencyType:     UZS=1000 USD=1010        (mavjud)

MahallaRole:        "resident" | "distributor" | "mahalla_admin" | "mahalla_rais"
GasSessionStatus:   "planned" | "active" | "paused" | "completed" | "cancelled"
GasHouseholdStatus: "pending" | "current" | "delivered" | "skipped"
```

---

## "Tayyor" mezoni (Definition of Done)

Har modul uchun tegishli spec'dagi **parity checklist**ni belgilab chiqing. Umumiy:
- [ ] DTO maydon nomlari `types/*.ts` bilan aynan (`snake_case`)
- [ ] `ApiResponse` / `PaginatedResponse` o'rovi
- [ ] public/auth/ega-tekshiruvi to'g'ri
- [ ] enum qiymatlari mos
- [ ] (Gaz) eventlar chat hub'ida, `mahalla:{id}` guruhda

Frontend hech qanday mock'dan foydalanmaydi — endpointlar tayyor bo'lishi bilan
darrov real ma'lumot bilan ishlaydi.

---

Savol bo'lsa yozing. Rahmat!
