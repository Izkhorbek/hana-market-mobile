# 🛠️ Nebor-app — Fix Progress Tracker

> Jonli hisobot. Manba: [`docs/ANALYSIS.md`](./ANALYSIS.md). Tartib: **P0 → P1 → P2**, bitta-bittalab.
> Har fixdan keyin shu fayl yangilanadi. Buglar ID'lari ANALYSIS.md bilan mos.

**Branch:** `refactoring` · **Oxirgi yangilanish:** 2026-06-03

---

## 📊 Umumiy holat

| Bosqich | Jami | ✅ Tuzatildi | 🔜 Navbatda | ⏸️ Bloklangan / kechiktirilgan |
|---------|------|-------------|-------------|-------------------------------|
| **P0**  | 3    | 3 (✅ tugadi) | 0          | 0 |
| **P1**  | 3    | 3 (✅ tugadi) | 0          | 0 |
| **P2**  | 3    | 0           | 0           | 3 (5.3 refactoriga bog'liq) |

> **P0 to'liq tugadi** (2.1, 2.3, 3.2, 3.3). Keyingi bosqich: **P1**.
> **P0 #2 — qismlar:** (B) 2.3 stale chat-list fallback ✅ + (A) 3.2 no-op tugmalar ✅ (Variant 1).
> **P0 #3 — 3.3:** UI no-op (attach tugma) ✅ yashirildi. ⚠️ Haqiqiy rasm-yuborish **backendga bog'liq** (chat-image upload endpointi yo'q) — pastdagi "Backendga bog'liq" bo'limiga qarang.

**Legenda:** ✅ Tuzatildi · 🔜 Navbatda · 🟡 Jarayonda · ⏸️ Bloklangan · ⏭️ Atayin kechiktirildi

---

## ✅ Tuzatilgan buglar

### 2.1 — Ikki marta logout / ikki marta "Session expired" `[P0 #1]` ✅
- **Sana:** 2026-06-03
- **Fayl(lar):** `modules/Auth/auth-store.ts` (`fetchUser` catch bloki + `isAxiosError` import)
- **Ildiz sabab:** `api/api.ts` interceptori va `fetchUser` catch'i bir xil 401 ni ikki marta qayta ishlardi → `logout()` + `queryClient.clear()` + `signalRService.disconnect()` + keychain wipe ikki marta bajarilardi. `fetchUser`ning to'g'ridan-to'g'ri `get().logout()` chaqiruvi interceptorning `sessionExpiredHandled` guardini chetlab o'tardi.
- **Yechim:** Token refresh/logout endi **faqat interceptorda**. `fetchUser` catch:
  - `401` → faqat `logger.warn`, side-effect yo'q (interceptor allaqachon logout qilgan).
  - `403` → mavjud xulq saqlandi (logout + `sessionExpiredOnStart`), faqat noto'g'ri refresh urinishi olib tashlandi.
  - Network/5xx → o'zgarmadi (warn, logout yo'q).
- **Qo'shimcha sifat:** `any`-cast o'rniga `axios.isAxiosError` bilan type-xavfsiz narrowing; Chesterton's-fence izohi qoldirildi (orqaga qaytarilmasligi uchun).
- **Kontrakt:** `fetchUser` doim `void` resolve qiladi (o'zgarmadi). Chaqiruvchilar (`profile.tsx`, `verifyOtp`, hydrate) natijaga tayanmaydi — regressiya yo'q.
- **Tekshiruv:** `npx tsc --noEmit` → EXIT 0.
- **Qo'lda sinov:** refresh 401 holatini taqlid qilib → logout BIR marta, Alert BIR marta, `disconnect()`/`clear()`/keychain wipe BIR martadan ekanini tasdiqlash.

### 2.3 — Stale chat-list fallback (oxirgi chat o'chirilganda qayta ko'rinadi) `[P0 #2 / B-qism]` ✅
- **Sana:** 2026-06-03
- **Fayl(lar):** `app/(tabs)/chat.tsx` (`useMyChatQuery` destructuringiga `isFetched` + `displayChats` ternary)
- **Ildiz sabab:** `displayChats = chatList.length > 0 ? chatList : (chatListResponse...)`. Diskriminator `chatList.length` edi → oxirgi chatni o'chirsam `setChatList([])` → ternary stale React Query cache'ga qaytib, o'chirilgan chatni qayta ko'rsatardi (refetch tugaguncha). `chatList`ni ikki manba to'ldiradi: global `ChatBootstrap` + ekran `useEffect`'i (bir xil `['MY_CHATS', {}]` kalit).
- **Chesterton's fence:** Eski ternary cold-open'da bo'sh-flash'ni oldini olardi (query resolve bo'lib, store hali `setChatList` bilan yangilanmagan render oynasi). Shunchaki `chatList`ga almashtirish yangi regressiya berardi.
- **Yechim:** Diskriminator `chatList.length > 0` → **`isFetched`** ("dastlabki yuklash tugadimi?"). Yuklash tugagach store yagona hokim (SignalR + delete mutatsiyalari bilan jonli); faqat birinchi fetchgacha xom payload'ga qaytamiz. Oxirgi chat o'chirilganda `isFetched=true` qoladi → `displayChats = [] ` → to'g'ri bo'sh holat, stale resurrection yo'q. Yuqoridagi `isLoading && !chatListResponse` spinner guard'i o'zgarmadi.
- **Kontrakt:** Filtrlash (`filteredChats`), `renderChatItem`, delete oqimi o'zgarmadi. `isSuccess` emas `isFetched` tanlandi (success/error farqsiz "yuklash tugadi" signali; store ChatBootstrap+SignalR bilan tirik).
- **Tekshiruv:** `npx tsc --noEmit` → EXIT 0.
- **Qo'lda sinov:** (1) Cold-open → bo'sh-flash YO'Q, spinner → ro'yxat. (2) Oxirgi chatni o'chir → ro'yxat darhol bo'sh qoladi, o'chirilgan chat QAYTA ko'rinmaydi. (3) Bir nechta chat bo'lsa, bittasini o'chir → faqat o'sha yo'qoladi.

### 3.2 — No-op tugmalar (chat header: Filter / Bookmark / Notification) `[P0 #2 / A-qism]` ✅
- **Sana:** 2026-06-03
- **Variant:** 1 (foydalanuvchi tanlovi) — bor narsani ula, yo'qni yashir.
- **Fayl(lar):** `components/headers/ChatPageHeader.tsx`, `app/(tabs)/chat.tsx`
- **Ildiz sabab:** `handleFilterPress`, `handleBookmarkPress`, `handleNotificationPress` faqat `console.log` edi — bosilganda hech narsa qilmaydigan "o'lik" tugmalar.
- **Aniqlangan holat (koddan):** Filter → ulanadigan modal YO'Q (inline `FilterTabs` allaqachon bor → dublikat). Bookmark → `app/(settings)/favorites.tsx` ekrani BOR (`profile.tsx` ham shu route'ni ishlatadi). Notification → ro'yxat ekrani YO'Q (faqat `settings.tsx` toggle'lar).
- **Yechim:**
  - `ChatPageHeader`: har ikonka endi o'z `on*Press` propi berilgandagina render qilinadi (`{onFilterPress && ...}`). Reusable, o'lik tugma chiqmaydi.
  - `chat.tsx`: `handleBookmarkPress` → `router.push('/(settings)/favorites')`. Filter/Notification handlerlari va header proplari olib tashlandi → bu ikkala ikonka chiqmaydi.
  - Notification dot'ning yagona iste'molchisi yo'qolgani uchun, iste'molchisiz qolgan `useUnreadCountQuery()` chat.tsx'dan tozalandi (importi bilan). **Behavior o'zgarmadi:** bu query global `ChatBootstrap`da bir xil kalit bilan mavjud (React Query observerlarni dedupe qiladi) → polling/badge ta'sirlanmaydi.
- **Kontrakt:** `ChatPageHeader` proplari allaqachon optional (type-xavfsiz). `hasNotifications` propi interfeysda saqlandi — kelajakda notifications ekrani qo'shilsa, `onNotificationPress` berib qayta yoqiladi. `handleRefresh`'dagi `['UNREAD_COUNT']` invalidatsiyasi tegilmadi.
- **Tekshiruv:** `npx tsc --noEmit` → EXIT 0.
- **Qo'lda sinov:** (1) Chat tab header'da faqat **Bookmark** ikonkasi ko'rinadi; Filter va Bell YO'Q. (2) Bookmark bossang → favorites ekrani ochiladi. (3) Filtrlash header tagidagi `FilterTabs` (all/selling/buying/unread) bilan ishlayveradi. (4) Konsolda 'Open filter modal' / 'Open notifications' loglari endi chiqmaydi.

### 3.3 — `handleAttach` no-op attach tugmasi (rasm yuborish) `[P0 #3]` ✅ (UI qismi)
- **Sana:** 2026-06-03
- **Variant:** Attach tugmasini yashir (foydalanuvchi tanlovi).
- **Fayl(lar):** `app/chat/[id].tsx` (`MessageInput` `onAttach` optional + gate; `handleAttach` va header propi olib tashlandi)
- **Chuqur tahlil (3 hujjat + kod):** Jonli kontrakt — SignalR `SendMessage` faqat `attachmentUrl?: string` (**tayyor URL**, fayl emas) kutadi. Loyihada **chat-image upload endpointi YO'Q** (faqat `user/upload/profile-image` va `product/images/upload-draft` — ikkalasi ham semantik jihatdan noto'g'ri). `MOBILE_API_DOCUMENTATION.md` eskirgan (`textContent/messageType`), kod `Chat_API.md` kontraktini ishlatadi.
- **Nega oddiy "ulash" = bug:** `sendImage(localUri)` → backendga `file:///...` lokal yo'l `attachmentUrl` sifatida ketardi → qabul qiluvchi ocha olmaydi, xabar tarixiga **buzuq URL** yoziladi (ma'lumot yaxlitligi bug'i). Shuning uchun ulanmadi.
- **Yechim (UI):** `MessageInput`'da '+' attach tugmasi `onAttach` propi berilgandagina render qilinadi (3.2 va `ChatPageHeader` bilan bir xil pattern). `ChatRoomPage` endi `onAttach` uzatmaydi → tugma yashirin. No-op TODO `handleAttach` olib tashlandi.
- **Kontrakt:** Backendga **hech narsa yuborilmaydi** (data structura tegilmadi). `sendImage`/`sendImageMessage` store'da o'zgarmagan holda qoldi — backend endpoint tayyor bo'lgach, `onAttach`ni qayta ulab yoqiladi. `handleCall` o'lik (Phone tugmasi header'da allaqachon kommentlangan) — tegilmadi.
- **Tekshiruv:** `npx tsc --noEmit` → EXIT 0.
- **Qo'lda sinov:** (1) Chat xonasida xabar input'ida '+' tugma endi YO'Q. (2) Matn yozish/yuborish, typing, send tugmasi avvalgidek ishlaydi. (3) Hech qanday rasm backendga yuborilmaydi.

### 2.7 — Hardcoded inglizcha matnlar (chat i18n) `[P1 #4]` ✅
- **Sana:** 2026-06-03
- **Fayl(lar):** `locales/{en,uz,ru}.json` (yangi kalitlar), `app/chat/[id].tsx`, `modules/Chat/chat-store.ts`, `app/(tabs)/chat.tsx`
- **Ildiz sabab:** Chat qatlamida foydalanuvchiga ko'rinadigan matnlar hardcoded inglizcha edi (3 til borligiga qaramay).
- **Yechim:**
  - Yangi locale kalitlari **3 tilda ham** qo'shildi (mavjud kalitlar tegilmadi):
    - `chat_room`: `date_today` (Bugun/Сегодня), `date_yesterday` (Kecha/Вчера), `date_unknown`, `unknown_user` (Noma'lum/Неизвестно), `chat_fallback` (Chat/Чат), `product_fallback` (Mahsulot/Товар — foydalanuvchi tanlovi).
    - `chat`: `image_attachment` (📷 Rasm/Изображение), `file_attachment` (📎 Fayl/Файл).
  - Komponent ichidagilar (`chatData`/`effectiveChatData` fallbacklari) → `t()`.
  - Module-level funksiyalar va store (React emas) → global `i18n` (`@/constants/localization` default eksporti): `formatMessageDate`, `groupMessagesByDate`, `transformChatItem`, `chat-store` last_message preview.
- **Ehtiyotkorlik / kontrakt:**
  - **Brend nomlari va "Post" konвensiyasiga tegilmadi** — faqat yangi kalit qo'shildi, mavjudlari o'zgarmadi. ru'da "Товар" allaqachon ishlatilgan (mos).
  - `t()` ishlatadigan ikkita `useMemo` deps'iga `t` qo'shildi (fayl konвensiyasiga mos; til almashganda fallbacklar to'g'ri yangilanadi; `t` faqat til o'zgarganda identity almashtirgani uchun cheksiz render yo'q).
  - **Backendga hech narsa o'zgarmadi** (faqat UI matnlari).
- **Ma'lum cheklov:** Sana ajratuvchilari (`messageGroups` memo) til real-time almashganda darhol qayta tarjima qilinmaydi — lekin til almashtirish boshqa ekranda (Settings) bo'lgani uchun chat ekrani remount bo'ladi → amalda muammo yo'q.
- **Qoldirildi:** `chat/[id].tsx:159` `"Trust Score:"` — bu **2.6** (soxta metrika) doirasida, alohida hal qilinadi.
- **Tekshiruv:** `npx tsc --noEmit` → EXIT 0; 3 ta JSON ham `JSON.parse` bilan VALID.
- **Qo'lda sinov:** (1) Til = uz/ru/en almashtirib, chat xonasi va ro'yxatida sana ajratuvchilari (Bugun/Kecha), nom yo'q bo'lsa "Noma'lum", mahsulot nomi yo'q bo'lsa "Mahsulot", rasm/fayl xabar preview ("📷 Rasm") to'g'ri tilda chiqishini tekshir. (2) Brend nomi va "Post" o'zgarmaganini tasdiqla.

### 4.1 — Ortiqcha polling `[P1 #5]` ✅ (konservativ yopildi — KOD O'ZGARMADI)
- **Sana:** 2026-06-03
- **Qaror:** Foydalanuvchi tanlovi — riskli o'zgarish qilinmadi.
- **Chuqur tahlil natijasi (ANALYSIS premissasi eskirgan edi):**
  - `useUserStatusQuery` (10s poll) — **O'LIK KOD**: loyihada hech qayerda ishlatilmaydi, ya'ni "10s polling" amalda **umuman ishlamaydi**. Online status faqat SignalR `UserStatusChanged` + chat-list seed orqali keladi.
  - `useUnreadCountQuery` (30s poll) — **3.2 fix'idan keyin** faqat `ChatBootstrap`da qoldi (dublikat allaqachon yo'qolgan). Qolgani — butun ilova uchun **bitta** 30s poll, bu arzon **safety-net**: boshqa qurilmada o'qilgan yoki SignalR uzilganda yarashtiradi. SignalR `_handleReceiveMessage`/`markAsRead` allaqachon `UNREAD_COUNT`ni invalidate qiladi.
- **Nega o'zgartirilmadi:** SignalR connection'ga bog'lab pollni o'chirish → "connected-yu-event-o'tkazib-yuborilgan" holatda badge eskirish riski (regressiya). Foyda esa marginal (1 req/30s). Xavf > foyda.
- **Kelajak (ixtiyoriy, alohida):** AppState→`focusManager` ulash fon rejimidagi pollni pauza qilardi (batareya), lekin bu global infratuzilma o'zgarishi — alohida ko'rib chiqiladi.
- **Bog'liq:** o'lik `useUserStatusQuery` ni **P2 dead-code** bosqichida (3.6/3.7) olib tashlash kerak.
- **Kontrakt:** Hech qanday kod o'zgartirilmadi → tsc/regressiya yo'q.

### 4.2 — Dublikat REST invalidation (per-message refetch) `[P1 #6]` ✅
- **Sana:** 2026-06-03
- **Fayl(lar):** `modules/Chat/chat-store.ts` (`_handleReceiveMessage` — trailing invalidation bloki olib tashlandi)
- **Ildiz sabab:** Har kelgan xabarda `MY_CHATS` + `UNREAD_COUNT` invalidate qilinardi, garchi xuddi shu funksiya yuqorida store'ni allaqachon lokal yangilagan bo'lsa-da (chat-list row, yangi xona, global badge). UI store'dan o'qiydi → invalidation = ortiqcha refetch + har xabarda ro'yxat REST'dan qayta yozilib churn/miltillash.
- **5 ta xulq-atvor tekshiruvi (foydalanuvchi talabi) — hammasi saqlanadi, hech biri invalidation'ga bog'liq emas:**
  1. Yangi xabar → pastga scroll: `mergedMessages` (store) → auto-scroll effect. ✅
  2. Real-time: SignalR → `addMessage` (store). ✅
  3. Unread belgilanadi: `updateChatListItem(unread_count)` + `incrementUnreadCount` (lokal). ✅
  4. Xonaga kirsa → read: `markAsRead` + REST (alohida yo'l, tegilmadi). ✅
  5. Online/offline: SignalR `UserStatusChanged` + chat-list seed (alohida, tegilmadi). ✅
- **Yechim:** `_handleReceiveMessage`dagi per-message invalidation bloki olib tashlandi; o'rniga nega store yetarli ekanini tushuntiruvchi Chesterton's-fence izoh. Reconciliation 30s poll (ChatBootstrap) + `markAsRead` invalidation orqali saqlanadi.
- **Kontrakt:** Boshqa invalidation joylari (`markAsRead`, `_handleChatRoomCreated`, `_handleMessageDeleted`, `_handleChatRoomDeleted`) **tegilmadi** — kam-chastotali, real reconciliation. `queryClient` import hamon ishlatiladi (10 joy). Backendga hech narsa o'zgarmadi.
- **Tekshiruv:** `npx tsc --noEmit` → EXIT 0.
- **Qo'lda sinov:** (1) Chat ro'yxatida turib boshqa userdan xabar kel → ro'yxat tepasiga chiqadi, last_message + unread badge **darhol** yangilanadi (miltillashsiz). (2) Xonada turib xabar kel → pastga scroll, read bo'ladi. (3) Tab badge unread soni to'g'ri. (4) Network tab'da: har xabarda MY_CHATS/UNREAD_COUNT refetch endi **bo'lmaydi** (faqat 30s poll + read'da).

---

## 🔜 Navbatdagi buglar

### P2 (refactor)
- **5.3 — Chat ikki manbali holat (REST + Zustand)** `[P2 #7]` ⏸️ — eng katta ish; Zustand'ni yagona manba qilish.
- **4.4 — Messages map evict** `[P2 #8]` ⏸️ — cheksiz xotira o'sishi; LRU/cap.
- **3.6 / 3.7 — O'lik kod** `[P2 #9]` ⏸️ — `useChatMessagesQuery`, kommentlangan `transformApiMessage`, **`useUserStatusQuery`** (4.1 tahlilida aniqlandi — hech qayerda ishlatilmaydi).

---

## ⏭️ Atayin kechiktirilgan (5.3 refactori bilan birga hal bo'ladi)

Bularga ALOHIDA tegilmaydi — ikki manbali holat refactori (5.3) ularni tabiiy hal qiladi:
- **2.2** — `messagesLoading` hech qachon `true` bo'lmaydi.
- **4.3** — `mergedMessages` har renderda O(n log n) sort.
- **4.5** — `groupMessagesByDate` har renderda qayta hisoblash.

> ⚠️ 5.3 ga yetganda foydalanuvchiga eslatiladi.

---

## 🔌 Backendga bog'liq (frontend o'zi yakunlay olmaydi)

- **Chatda rasm yuborish (3.3 ning haqiqiy xususiyati)** ⛔ Bloklangan
  - **Sabab:** SignalR `SendMessage` faqat `attachmentUrl: string` (tayyor URL) qabul qiladi, lekin **chat-image upload endpointi yo'q**.
  - **Kerak:** Backend jamoasi chat uchun rasm yuklash endpointi qo'shsin (masalan `POST /api/chats/upload-image` → hosted URL qaytaradi). So'ng frontend: image picker → upload → `sendImage(hostedUrl)`.
  - **Tayyor qismlar:** `chat-store.sendImageMessage`, `signalRService.sendMessage(..., 'image', attachmentUrl)` allaqachon mavjud; faqat upload + `onAttach` ulanishi qoladi.
  - Endpoint tayyor bo'lgach: `MessageInput`ga `onAttach` qayta uzatiladi (UI avtomatik qayta paydo bo'ladi).

---

## 📝 Ish qoidalari (eslatma)

1. Har bug: avval kodni o'qib ildiz sababni tasdiqlash (ANALYSIS.md qator raqamlari eskirgan bo'lishi mumkin).
2. Fix oldidan reja → foydalanuvchi tasdig'i → keyin kod.
3. Minimal, nuqtaviy diff. Bog'liq bo'lmagan kod/format/importga tegmaslik.
4. Har fixdan keyin `npx tsc --noEmit`.
5. Migration / dependency / `.env` / build config — faqat aniq ruxsat bilan.
6. **Har fixdan keyin shu fayl yangilanadi.**
