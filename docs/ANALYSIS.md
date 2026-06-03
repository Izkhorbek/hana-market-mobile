# 📊 Nebor-app — Chuqur Texnik Tahlil

**Sana:** 2026-06-03 · **Branch:** `develop` · **Stack:** Expo 54 / RN 0.81 / React 19 / Expo Router 6 / Zustand 5 / React Query 5 / SignalR 10 / Axios

> Bu hujjat faqat tahliliy material. Kod o'zgartirilmagan.

---

## 1. Umumiy Arxitektura Baholash

| Qatlam | Holat | Izoh |
|--------|-------|------|
| **Auth / Token** | 🟢 Kuchli | Single-flight refresh, keychain vault, bridge pattern bilan circular dependency yechilgan |
| **Chat / SignalR** | 🟡 O'rtacha | Ishlaydi, lekin ikki manbali (REST + store) holat boshqaruvi murakkab |
| **States (Zustand)** | 🟡 O'rtacha | Yaxshi tuzilgan, lekin React Query bilan dublikat sinxronizatsiya |
| **Notifications** | 🟢 Yaxshi | FCM/APNS to'g'ri, lifecycle aniq |
| **i18n** | 🔴 Bo'sh joylar | Kodda ko'p hardcoded inglizcha matnlar |
| **Logging/Telemetry** | 🟢 Kuchli | Dedup, truncation, Sentry breadcrumbs — professional |

---

## 2. 🐛 Topilgan Xatolar (Bugs)

### 2.1 — Ikki marta logout / ikki marta "Session expired" (O'RTA-YUQORI)
`modules/Auth/auth-store.ts:209` `fetchUser` va `api/api.ts:115` interceptor **bir xil 401 ni ikki marta** qayta ishlaydi:

- `getProfile()` 401 qaytaradi → **interceptor** avtomatik `runSingleFlightRefresh()` qiladi → muvaffaqiyatsiz bo'lsa `authLogoutSessionExpired()` chaqirib **logout qiladi** va promise'ni reject qiladi.
- Keyin `fetchUser`'ning `catch` bloki yana `get().refreshTokens()` urinadi (refreshToken endi `null`) → yana `logout()` + `sessionExpiredOnStart=true`.

**Natija:** `queryClient.clear()`, `signalRService.disconnect()`, keychain wipe ikki marta bajariladi. Funksional jihatdan halokatli emas, lekin ortiqcha ish va potentsial ikki marta Alert. Refresh mantig'i **bitta joyda** (interceptor) bo'lishi kerak.

### 2.2 — `messagesLoading` hech qachon `true` bo'lmaydi
`app/chat/[id].tsx:1079` loading guard `messagesLoading`ga tayanadi, lekin infinite-query oqimida `setMessagesLoading(chatRoomId, true)` **hech qayerda chaqirilmaydi**. Demak `messagesLoading` har doim `undefined`/`false`. Faqat `isLoadingApi` ishlayapti — guard'ning yarmi o'lik.

### 2.3 — Chat list bo'shaganda eski ma'lumot qaytadi
`app/(tabs)/chat.tsx:118`:
```ts
const displayChats = chatList.length > 0 ? chatList : (chatListResponse?.data?.data?.chats || [])
```
Foydalanuvchi oxirgi chatni o'chirsa, `chatList.length === 0` bo'ladi va **stale React Query cache**'ga qaytib, o'chirilgan chatlar qayta ko'rinishi mumkin. To'g'ri shart `chatList`ni yagona manba qilish yoki "loaded" flagi bilan ajratish.

### 2.4 — Image xabarlarni temp-match qilishda ziddiyat
`modules/Chat/chat-store.ts:799` o'z xabarini `content === message.content` bo'yicha solishtiradi. Rasm xabarida `content = ''`. Agar ketma-ket 2 ta rasm yuborilsa, ikkalasi ham **eng eski bo'sh-content temp**ga mos kelib, biri "pending"da qotib qolishi mumkin (matn uchun shu muammo allaqachon kommentda tan olingan, rasm uchun hal qilinmagan).

### 2.5 — Ikki xil reconnect mexanizmi
`api/services/signalr.service.ts:189` `.withAutomaticReconnect()` VA `signalr.service.ts:562` `handleConnectionError()` o'zining `setTimeout` reconnect siklini yuritadi. Ular turli fazalarni qoplaydi (initial connect vs drop), lekin `reconnectAttempts` faqat muvaffaqiyatda nolga tushadi — qisman holatlar va ikki manbali qayta ulanish chalkashlik tug'dirishi mumkin.

### 2.6 — `trustScore` soxta qiymat foydalanuvchiga ko'rsatiladi
`app/chat/[id].tsx:858` va :889 — `'0.0°C'` / `'37.7°C'` hardcoded fake qiymatlar UI'da real "Trust Score" sifatida chiqadi. Ma'lumot yaxlitligi muammosi.

### 2.7 — Hardcoded inglizcha matnlar (i18n teshiklari)
Ilovada 3 til (uz/ru/en) bor, lekin:
- `'Today'`, `'Yesterday'` → `app/chat/[id].tsx:83`
- `'📷 Image'`, `'📎 File'` → `chat-store.ts:843`
- `'Unknown'`, `'Product'`, `'Chat'` → chat header fallbacklar
- `'Open filter modal'`, `console.log('Open notifications')` → `app/(tabs)/chat.tsx:148` — tugmalar **funksiyasiz** (no-op).

---

## 3. 🔧 Fix Qilinadigan Qismlar

| # | Joy | Muammo | Tavsiya |
|---|-----|--------|---------|
| 1 | `auth-store.ts:225-244` | Dublikat refresh/logout | `fetchUser` catch'idan refresh mantig'ini olib tashlash — interceptor'ga ishonish |
| 2 | `chat.tsx:147-157` | No-op tugmalar (`handleFilterPress` va h.k.) | Yoki funksiyani ulash, yoki tugmalarni yashirish |
| 3 | `chat/[id].tsx:931` | `handleCall` bo'sh, `handleAttach` faqat TODO | Rasm yuborish (`sendImage` mavjud!) ulanmagan — yarim funksiya |
| 4 | `chat-store.ts:457,506` | `console.error`/`console.warn` to'g'ridan-to'g'ri | Hammasi `logger` orqali o'tishi kerak (prod'da shovqin) |
| 5 | Hardcoded matnlar (2.7) | i18n buzilgan | `t()` orqali tarjima kalitlariga ko'chirish |
| 6 | `api/hooks/useChat.ts:53` | `useChatMessagesQuery` (non-infinite) ishlatilmaydi | O'lik kod — o'chirish |
| 7 | `chat/[id].tsx:65-78` | `transformApiMessage` kommentlangan o'lik kod | Tozalash |
| 8 | `chat/[id].tsx:888` | `trustScore: '37.7°C'` | Real backend qiymati yoki butunlay olib tashlash |

---

## 4. ⚡ Optimizatsiya Qilinadigan Qismlar

### 4.1 — Ortiqcha network polling (Batareya/Traffik)
- `useUnreadCountQuery`: **har 30s** refetch (`useChat.ts:117`) — ChatBootstrap global mount bo'lgani uchun **butun ilova bo'ylab** ishlaydi.
- `useUserStatusQuery`: **har 10s** (`useChat.ts:187`).
- SignalR allaqachon `UserStatusChanged` va `ReceiveMessage` push qiladi → polling **dublikat**. SignalR ulangan paytda interval'larni o'chirish (yoki `refetchInterval`'ni connection state'ga bog'lash) sezilarli tejamkorlik beradi.

### 4.2 — Dublikat REST invalidation realtime ustiga
`chat-store.ts:877-884` — har bir kelgan xabarda store **allaqachon** lokal yangilanadi, lekin keyin yana `invalidateQueries(['MY_CHATS','UNREAD_COUNT'])` chaqirilib **qo'shimcha network refetch** qo'zg'atiladi. Store yagona manba bo'lgani uchun bu ortiqcha. Faqat throttle bilan yoki umuman SignalR'ga tayanish.

### 4.3 — Xabarlar merge'i har renderda O(n log n)
`chat/[id].tsx:789-826` — `mergedMessages` har safar **butun tarixni** Map'ga yig'ib, qayta **sort** qiladi. Uzun suhbatda (1000+ xabar) har yangi xabarda to'liq qayta hisoblash. Ikki manba (apiMessages + storeMessages) bir-biriga quyilgani uchun bu murakkablik kelib chiqadi → arxitektura soddalashtirilsa (bitta manba), bu yo'qoladi.

### 4.4 — Cheksiz xotira o'sishi (messages map)
`chat-store.ts:79` `messages: Record<number, ChatMessage[]>` — faqat logout/room-delete'da tozalanadi. Ko'p xonaga kirgan uzun sessiyada **xotira cheksiz o'sadi**. Faol bo'lmagan xonalar xabarlarini LRU/cap bilan evict qilish kerak.

### 4.5 — `MessageBubble` memo yaxshi, lekin `groupMessagesByDate` har renderda
`chat/[id].tsx:838` `messageGroups` `useMemo`'da, lekin `displayMessages` har `mergedMessages` o'zgarishida to'liq qayta map qilinadi. 4.3 bilan birga hal bo'ladi.

### 4.6 — `staleTime`/`gcTime` global, chat uchun moslashtirilmagan
`queryClient.ts:10` — `staleTime: 5min` global. Chat list realtime bo'lgani uchun bu konfliktni keltirib chiqaradi (store vs cache). Realtime querylar uchun alohida config.

---

## 5. 🔐 Chuqur Modul Tahlili

### 5.1 — Auth (🟢 Kuchli tomonlar)
- **Bridge pattern** (`api/auth-bridge.ts`) — `api.ts ↔ auth-store` circular dependency'ni toza yechgan. ✅
- **OTP-based** auth, tokenlar `X-*` headerlardan olinadi, case-insensitive `readHeader`. ✅
- **Legacy migration** (`auth-store.ts:354`) — eski AsyncStorage'dan keychain'ga ko'chirish o'ylangan. ✅
- **Startup validation** — locally-expired token'ni server'ga bormasdan refresh qilish. ✅

⚠️ **Diqqat:**
- Web platformada `X-Access-Token` va boshqa custom headerlar **CORS `Access-Control-Expose-Headers`** ro'yxatida bo'lishi shart, aks holda `extractAuthTokens` web'da `null` qaytaradi.
- `sessionExpiredHandled` flag + `setTimeout(2000)` reset (`auth-store.ts:446`) — race-prone, lekin amalda yetarli.

### 5.2 — Token (🟢 Professional)
- **Single-flight refresh** (`api.ts:67`) — bir vaqtda 401 bo'lsa, faqat **bitta** refresh, qolganlar shu promise'ni kutadi. ✅
- **Secure vault** (`utils/secureTokenStore.ts`) — iOS Keychain / Android Keystore, atomik JSON blob, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`. ✅
- Tokenlar AsyncStorage `partialize`'dan chiqarib tashlangan — plaintext'da yotmaydi. ✅
- Refresh token **rotatsiya** qo'llab-quvvatlanadi (`auth-store.ts:193`). ✅

⚠️ `logout()` sinxron, lekin `secureTokenStore.clear()` fire-and-forget async — logout'dan keyin juda qisqa oynada eski token qayta o'qilishi nazariy mumkin.

### 5.3 — Chat/SignalR (🟡 Murakkablik)
**Kuchli:** ensureJoined single-flight, reconnect'da silent re-join, optimistic send + temp-replace, typing timeout manager.

**Asosiy muammo — IKKI MANBALI HOLAT:**
```
React Query (apiMessages/infinite)  ─┐
                                     ├──→ mergedMessages (sort+dedupe har render)
Zustand store (storeMessages)       ─┘
```
Bu "source-flipping"ni oldini olish uchun qilingan, lekin natijada: murakkab merge, qo'sh invalidation, har renderdagi sort. **Tavsiya:** Zustand'ni yagona manba qilib, React Query'ni faqat dastlabki yuklash/pagination uchun ishlatish (store'ga yozgandan keyin querydan o'qimaslik).

### 5.4 — States (🟡)
- Zustand store'lar yaxshi tuzilgan, selektorlar stabil (`EMPTY_MESSAGES`, `OFFLINE_STATUS` referenslari). ✅
- `useUnreadCount` ikki manba: store `unreadCount` VA `useUnreadCountQuery` — ChatBootstrap orqali mirror qilinadi, lekin chat tab'da to'g'ridan-to'g'ri query'dan ham o'qiladi (`chat.tsx:238`). Bir nechta haqiqat manbai.

---

## 6. 🎯 Prioritetli Yo'l Xaritasi (Tavsiya)

**P0 (darhol):**
1. Auth dublikat logout'ni tuzatish (2.1) — interceptor'ga ishonish
2. No-op tugmalarni yashirish yoki ulash (2.3, 3.2)
3. `handleAttach` → `sendImage` ulash (rasm yuborish mavjud, lekin ulanmagan)

**P1 (yaqin):**
4. Hardcoded matnlarni i18n'ga ko'chirish (2.7)
5. Polling'ni SignalR connection state'ga bog'lash (4.1) — batareya
6. Dublikat REST invalidation'ni kamaytirish (4.2)

**P2 (refactor):**
7. Chat xabar holatini yagona manbaga keltirish (5.3) — eng katta ish, eng katta foyda
8. Messages map evict mexanizmi (4.4)
9. O'lik kodlarni tozalash (3.6, 3.7)

---

## 7. Xulosa

Loyiha **professional darajada** yozilgan: token xavfsizligi, single-flight refresh, bridge pattern, telemetry/logging, Sentry integratsiyasi — bularning hammasi yuqori sifatli. **Asosiy texnik qarz Chat qatlamida**: REST va Zustand o'rtasidagi ikki manbali holat boshqaruvi murakkablik, ortiqcha network va potentsial buglar manbai. Auth/Token deyarli production-ready, faqat bitta dublikat-logout nuancesi bor. Eng tez g'alaba — polling optimizatsiyasi va i18n teshiklarini yopish.
