# Nebor — PTA Inkubatsiya arizasi (javoblar)

> Tayyor javoblar. Rasmiy forma savollari biroz boshqacha nomlanishi mumkin —
> mazmunini mos maydonlarga joylashtiring. `[...]` — o'z ma'lumotingiz.
> Barcha huquqiy faktlar tasdiqlangan (lex.uz/uz/docs/-3911903).

---

### 1. Loyiha nomi
Nebor (ilova nomi: Hana Market)

### 2. Qisqa tavsif (bir jumla)
Nebor — mahallaning raqamli markazi: yaqin-atrofdagi savdo, xizmat va mahalla ma'lumoti (jumladan gaz taqsimoti) bir ilovada.

### 3. Loyiha bosqichi
**Ishlaydigan prototip.** iOS va Android'da ishlaydigan tayyor ilova mavjud: autentifikatsiya, real-time chat, lokatsiyaga asoslangan bozor, xizmat katalogi, gaz navbati trekeri va mahalla a'zoligi.

### 4. Muammo
O'zbekistonda mahalla hayoti tartibsiz raqamlashgan:
- Yaqin-atrofda ishonchli, lokal savdo platformasi yo'q — mavjudlari butun mamlakat bo'ylab ishlaydi (uzoq, spam, ishonchsiz).
- Ishonchli usta/xizmat topish faqat og'izdan-og'izga.
- **Gaz balloni taqsimoti tartibsiz:** qachon keladi, qaysi ko'chaga yetdi, kim oldi, kim o'tkazib yuborildi — xonadon darajasida hech kim bilmaydi. Ma'lumot og'zaki yoki tarqoq Telegram guruhlarida yo'qoladi.

Natija: behuda kutish, adolatsiz navbat, mahalla raisiga tartibsiz yuk.

### 5. Yechim
Nebor — mahalla operatsion tizimi. Bir ilovada to'rt yo'nalish:
1. **Bozor** — yaqin-atrofdagi P2P savdo.
2. **Mahalla** — e'lonlar, hamjamiyat ma'lumoti.
3. **Xizmat** — mahalliy usta/provayder katalogi (telefon orqali bog'lanish).
4. **Gaz navbati** — jonli taqsimot trekeri: tarqatuvchining joriy joyi, "sizgacha N uy", adolatli navbat, real-time push. Rais bir tugma bilan e'lon beradi → butun mahalla xabardor bo'ladi.

Asosiy farq: raqobatchilar faqat past chastotali savdoni qamraydi; Nebor yuqori chastotali mahalla ma'lumoti/xizmati ustiga savdoni qo'yadi — bu har kunlik foydalanish odati yaratadi.

### 6. Maqsadli auditoriya
O'zbekiston mahallalari aholisi: mahalliy savdo, xizmat va kommunal ma'lumotdan foydalanuvchilar; hamda mahalla raislari va mahalliy bizneslar.

### 7. Bozor
Milliy: O'zbekistondagi minglab mahallalar. Kirish strategiyasi — bitta mahalladan boshlab, kritik massa yig'ib, shablon bilan kengaytirish (lokal zichlik modeli). Ikkilamchi bozor (resale) va mahalliy xizmatlar talabi o'smoqda.

### 8. Raqobat va farqlanish
Bozorda ikki asosiy o'yinchi: **Bir Bir** (milliy klassifayd — lokal emas, hamjamiyatsiz) va **Mango Market** (Carrot kloni — faqat P2P savdo, hamjamiyat/gaz/xizmat yo'q). Nebor yagona **mahallaga yo'naltirilgan** platforma: yaqin-atrof + hamjamiyat + gaz/kommunal + xizmat katalogi. Bu — himoyalanadigan nisha, chunki mahalla — O'zbekistonga xos institut.

### 9. Ijtimoiy ta'sir va davlat siyosatiga muvofiqlik
Gaz taqsimoti O'zbekiston Respublikasi Vazirlar Mahkamasining **2018-yil 10-avgustdagi 646-sonli qarori** bilan tartibga solingan (aholiga oyiga kamida bir balon; operator — Hududgaztaminot; Sirdaryo, Sayxunobod tumanida avtomatlashtirilgan hisob + elektron karta piloti). Biroq qaror **xonadon darajasidagi shaffoflikni** (qachon/kim oldi) tartibga solmaydi va mahallani tilga olmaydi. Nebor aynan shu bo'shliqni to'ldiradi — davlatning raqamlashtirish yo'nalishini mahalla darajasida davom ettiradi. Manba: lex.uz/uz/docs/-3911903.

### 10. Biznes-model
- Mahalliy biznes reklamasi ("around me" chegirmalari) — do'konlar to'laydi.
- Ko'tarilgan e'lonlar (promoted listings).
- Xizmat provayderlari uchun premium.
Mantiq: avval yuqori chastotali auditoriya (gaz, mahalla) to'planadi, keyin mahalliy bizneslar shu auditoriyaga chiqish uchun to'laydi.

### 11. Traksiya / holat
Ishlaydigan ilova tayyor (iOS/Android), toza arxitektura. [Foydalanuvchi/e'lon/yuklab olish raqamlari yoki "pilot mahallaga tayyor"ni qo'shing]. Backend kontraktlari yozilgan; inkubatsiya davomida to'liq ishga tushiriladi.

### 12. Jamoa (2–5 kishi)
- [Ism] — [rol: texnik / CTO]
- [Ism] — [rol: biznes / GTM]
- [Ism] — [rol: dizayn / operatsiya]
Barchasi 18 yoshdan katta. [Tegishli tajriba/yutuqlar].

### 13. Nima uchun aynan siz
Ko'p jamoa g'oya bilan keladi; bizda esa allaqachon ishlaydigan mahsulot bor — texnik risklarni hal qilib bo'ldik. Bizga kerak bo'lgani — bozorga chiqish, monetizatsiya va scaling bo'yicha yo'naltirish, aynan shuni dastur beradi.

### 14. Dasturdan kutganlarimiz
Bozorga chiqish (GTM) va monetizatsiya bo'yicha mentorlik; IT Park PR orqali birinchi mahallalarni jalb qilish; Hududgaztaminot bilan koordinatsiya (rasmiy ma'lumot manbai); grant orqali pilotni kengaytirish.

### 15. 3 oylik yo'l xaritasi
1-oy: bitta mahallani to'liq egallash (concierge). 2-oy: 5–10 mahalla. 3-oy: monetizatsiya piloti + Demo Day.

### 16. Grant mablag'idan foydalanish
[Miqdor]: pilot mahallalarni jalb qilish (marketing/PR), gaz taqsimoti integratsiyasi, jamoa qiymati, [boshqa]. Grant sharti — yuridik shaxsni ro'yxatdan o'tkazish (g'olib bo'lgach bajariladi).

### 17. Texnologiya
Expo + React Native (mobil), .NET 8 backend (REST + SignalR realtime), uch til (uz/ru/en). Toza qatlamli arxitektura (enforced layering).

---

## To'ldirilishi kerak
- [ ] Jamoa a'zolari (2–5), rollar, yosh (18+)
- [ ] Traksiya raqamlari yoki "pilotga tayyor"
- [ ] Grant miqdori va taqsimoti
- [ ] Aloqa ma'lumotlari
