# Backend Handoff — Xizmat (Service) + Guest + Gaz

> Mobil ilovaga yangi **Xizmat (Mahalla xizmatlari)** bo'limi qo'shildi.
> Frontend to'liq tayyor va backend qismini kutyapti. `develop` branch'dan
> tortib oling; batafsil kontraktlar `docs/` ичida.

---

## PRIORITET 1 — Xizmat (Service) ⬅️ eng muhim, frontend bloklangan

**Spec:** [SERVICE_BACKEND_SPEC.md](SERVICE_BACKEND_SPEC.md) (to'liq kontrakt + parity checklist)

Qisqacha:
- Yangi 2 jadval: `service` + `service_image` (`service_image` = `product_image` ko'zgusi)
- 6 endpoint:
  - `POST   /api/service/create` — multipart, javob `{ service_id }`
  - `GET    /api/service/all` — **public**, masofa bo'yicha, `PaginatedResponse`
  - `GET    /api/service/my` — auth
  - `GET    /api/service/{id}` — **public**
  - `PUT    /api/service/{id}` — auth, faqat ega
  - `DELETE /api/service/{id}` — auth, faqat ega

**Mutlaqo mos bo'lishi shart** (frontend shu qiymatlarni yuboradi):
- `EServiceCategory` = 1000, 1010, …, 1090 (10 ta)
- `EServicePriceType` = 1000 (soatlik), 1010 (ish boshiga), 1020 (kelishiladi)
- DTO maydon nomlari `snake_case`, spec §4 dagidek aynan
- `create` — multipart; `images_json` product'ning mavjud draft-upload'ini qayta
  ishlatadi (yangi upload endpoint kerak emas)
- `price` — ro'yxat/detalда formatlangan string; "kelishiladi" bo'lsa `null`

---

## PRIORITET 2 — Guest (mehmon) ko'rishi

`service/all` va `service/{id}` ni **public** qiling (xuddi `product/all`,
`product/{id}` kabi) — mehmon foydalanuvchi ham xizmatlarni ko'rsin.

---

## PRIORITET 3 — Gaz navbati (keyinroq)

**Spec:** [GAZ_NAVBATI_BACKEND_SPEC.md](GAZ_NAVBATI_BACKEND_SPEC.md)

Tayyor, lekin frontend hali qurilmoqda — 1 va 2 dan keyin qarasangiz bo'ladi.

---

Savol bo'lsa yozing. Rahmat!
