# Home Product Error Message — Fix Report (Fix E)

## Problem

The Home product list (`components/Lists/ProductsList.tsx`) rendered a single,
hard-coded error block for **every** failure:

```
{t('home.error')}            // "Failed to load products"
{t('home.retry_set_address')} // "Address... try setting it again"
```

So an auth/session expiry, a dropped internet connection, or a backend 5xx all
told the user to *fix their address* — misleading guidance that sent users down
the wrong path.

## Fix

Classify the actual error and show a message that matches the cause. UI layout
is unchanged: same two-line text block + the same retry button.

### Error → message map

| Cause | Detection (`classifyGeoApiError`) | Message key |
| --- | --- | --- |
| Session / auth | axios error, `status` 401 or 403 | `home.error_auth` |
| No internet | axios error, **no** `response` (offline / DNS / timeout) | `home.error_network` |
| Server error | `status` ≥ 500 | `home.error_server` |
| Missing / out-of-area location | `status` 400 or 404 (the endpoint is geo-gated on `user_lat`/`user_long`) | `home.error_location` |
| Unknown | anything else (incl. non-axios errors) | `home.error_generic` |

Order matters: auth and transport failures are matched **before** the location
bucket, so a session/network/server failure can never be mislabelled as a
location problem. Only a genuine 4xx on this geo-gated endpoint maps to the
location message.

## Files changed

| File | Change |
| --- | --- |
| `utils/apiError.ts` | Added `ApiErrorKind` type + `classifyGeoApiError(error)`. (ESLint `--fix` also normalised the pre-existing `parseApiError` to project quote/semicolon style — no behavioural change.) |
| `components/Lists/ProductsList.tsx` | Destructure `error` from the query; in the `isError` branch, map `classifyGeoApiError(error)` to the matching `home.error_*` key instead of always rendering `home.retry_set_address`. |
| `locales/en.json`, `locales/ru.json`, `locales/uz.json` | Added `home.error_auth`, `home.error_network`, `home.error_server`, `home.error_location`, `home.error_generic`. |

### New i18n keys

| Key | en | ru | uz |
| --- | --- | --- | --- |
| `home.error_auth` | Your session has ended. Please log in again. | Сессия завершена. Пожалуйста, войдите снова. | Sessiya tugadi. Iltimos, qayta kiring. |
| `home.error_network` | No internet connection. Check your network and try again. | Нет подключения к интернету. Проверьте сеть и повторите попытку. | Internet aloqasi yo'q. Tarmoqni tekshirib, qayta urinib ko'ring. |
| `home.error_server` | Server error. Please try again in a moment. | Ошибка сервера. Повторите попытку через мгновение. | Server xatosi. Bir lahzadan so'ng qayta urinib ko'ring. |
| `home.error_location` | Couldn't load products for your area. Try updating your location. | Не удалось загрузить товары для вашего региона. Попробуйте обновить местоположение. | Hududingiz uchun mahsulotlarni yuklab bo'lmadi. Joylashuvni yangilab ko'ring. |
| `home.error_generic` | Couldn't load products. Please try again. | Не удалось загрузить товары. Повторите попытку. | Mahsulotlarni yuklab bo'lmadi. Qayta urinib ko'ring. |

The existing `home.error` ("Failed to load products") is kept as the first line;
the classified message replaces only the misleading second line.

## Out of scope (unchanged, per task)

Auth storage, token refresh logic, backend API, and the product query itself are
untouched. The only product-side change is reading the query's existing `error`
to choose a string.

## Verification

- `npx tsc --noEmit` → **pass** (exit 0, no output).
- `npx eslint utils/apiError.ts components/Lists/ProductsList.tsx` → **pass**
  (no errors; only the benign `MODULE_TYPELESS_PACKAGE_JSON` warning). JSON
  locale files are not covered by the ESLint config (reported as "ignored").

## Manual QA

1. **Airplane mode → open Home** → "No internet connection…".
2. **Expired session reaches the list as 401** → "Your session has ended…".
3. **Backend 5xx** → "Server error…".
4. **400/404 from `/product/all`** (e.g. invalid/missing coordinates) → location message.
5. **All three languages** render the correct string.
6. **Retry button** still refetches.

## Remaining notes

- The location bucket is a heuristic: any 400/404 on `/product/all` is treated as
  a location issue because the endpoint is geo-gated. If the backend later adds
  distinct 4xx codes for non-location validation, the classifier can branch on
  the parsed `errors`/`status_code` body (`parseApiError` already extracts it).
- Not committed, per instructions.
</content>
