# Hana Market — PTA Inkubatsiya arizasi (javoblar)

> Tayyor javoblar. Rasmiy forma savollari biroz boshqacha nomlanishi mumkin —
> mazmunini mos maydonlarga joylashtiring. `[...]` — o'z ma'lumotingiz.
> Barcha huquqiy faktlar tasdiqlangan (lex.uz/uz/docs/-3911903).

---

## Rasmiy loyiha tavsifi (yaxlit matn)

**Loyiha nomi:** Hana Market — mahalla uchun yagona raqamli platforma ("Mahalla OS").

**Loyiha maqsadi:** O'zbekiston mahallalarida savdo, mahalliy xizmatlar va jamoa ishlarini — jumladan gaz balon taqsimotini — yagona, shaffof va adolatli raqamli tizimga birlashtirish hamda fuqarolarning kundalik ehtiyojlarini hududiy (hyperlokal) darajada qondirish.

**Muammoning dolzarbligi:** Bugungi kunda mahalla darajasidagi savdo, xizmatlar va resurs taqsimoti (ayniqsa suyultirilgan gaz balonlari) asosan tartibsiz messenjer guruhlari orqali, yagona qoida va nazoratsiz amalga oshirilmoqda. Bu taqsimotda navbat va adolatning buzilishiga, jarayonning shaffof emasligiga, mahalliy xizmatlar va ma'lumotlarning tarqoqligiga olib keladi.

**Taklif etilayotgan yechim:** Hana Market mahalla hayotining asosiy yo'nalishlarini bitta ilovada jamlaydi:
1. **Bozor** — yaqin atrofdagi buyum, avtomobil, ish o'rni va xizmatlar oldi-sotdisi;
2. **Gaz navbati** — gaz balon taqsimotini xonadonlar tartibida, shaffof yuritish: berilgan/berilmagan xonadonlar qayd etiladi, taqsimot to'xtagan joyidan davom etadi, o'tkazib yuborilgan xonadonlar keyingi bosqichda birinchi navbatda ta'minlanadi; tartib buzilgan taqdirda barcha a'zolar xabardor qilinadi;
3. **Xizmat** — santexnik, elektrik, usta kabi mahalliy xizmat ko'rsatuvchilar bazasi;
4. **Shoshilinch xizmatlar** — davlat qisqa raqamlariga (101, 102, 103 va boshqalar) tezkor murojaat;
5. **Mahalla a'zoligi** — rais, tasdiqlash tizimi va taqsimlovchilar bilan boshqaruv.

**Innovatsion jihatlari:** resurs taqsimotida avtomatik adolat mexanizmi (navbatni saqlash va o'tkazib yuborilganlarni ustuvorlashtirish); real vaqt rejimidagi bildirishnomalar (taqsimot rejalashtirildi / boshlandi / navbat holati); ijtimoiy hisobdorlik — tartib buzilishi ochiq e'lon qilinadi.

**Ijtimoiy samara:** loyiha mahalla institutini raqamlashtirishga, davlat resurslarini adolatli va shaffof taqsimlashga, hamda fuqarolarning ishonchi va faolligini oshirishga xizmat qiladi.

**Texnologik asos:** Expo/React Native (mobil ilova), .NET backend, SignalR (real vaqt), uch tilli interfeys (o'zbek, rus, ingliz).

**Joriy holat:** ilova Google Play Store'da nashr etilgan va birinchi mahallada sinov (pilot) tariqasida ishga tushirilgan.

---

### 1. Loyiha nomi
Hana Market

### 2. Qisqa tavsif (bir jumla)
Hana Market — mahallaning raqamli markazi: yaqin-atrofdagi savdo, xizmat va mahalla ma'lumoti (jumladan gaz taqsimoti) bir ilovada.

### 3. Loyiha bosqichi
**Bozorga chiqish (Go-to-market) — pilot.** Ilova to'liq ishga tushirilgan va **Google Play Store'da nashr etilgan**; front-end va back-end uchdan-uchgacha ishlaydi (autentifikatsiya, real-time chat, lokatsiyaga asoslangan bozor, xizmat katalogi, gaz navbati, mahalla a'zoligi, shoshilinch xizmatlar). Hozirda **birinchi mahallada** real foydalanuvchilar bilan sinovda (pilot).

### 4. Muammo
O'zbekistonda mahalla hayoti tartibsiz raqamlashgan:
- Yaqin-atrofda ishonchli, lokal savdo platformasi yo'q — mavjudlari butun mamlakat bo'ylab ishlaydi (uzoq, spam, ishonchsiz).
- Ishonchli usta/xizmat topish faqat og'izdan-og'izga.
- **Gaz balloni taqsimoti tartibsiz:** qachon keladi, qaysi ko'chaga yetdi, kim oldi, kim o'tkazib yuborildi — xonadon darajasida hech kim bilmaydi. Ma'lumot og'zaki yoki tarqoq Telegram guruhlarida yo'qoladi.

Natija: behuda kutish, adolatsiz navbat, mahalla raisiga tartibsiz yuk.

### 5. Yechim
Hana Market — mahalla operatsion tizimi. Bir ilovada to'rt yo'nalish:
1. **Bozor** — yaqin-atrofdagi P2P savdo.
2. **Mahalla** — e'lonlar, hamjamiyat ma'lumoti.
3. **Xizmat** — mahalliy usta/provayder katalogi (telefon orqali bog'lanish).
4. **Gaz navbati** — jonli taqsimot trekeri: tarqatuvchining joriy joyi, "sizgacha N uy", adolatli navbat, real-time push. Rais bir tugma bilan e'lon beradi → butun mahalla xabardor bo'ladi.

Asosiy farq: raqobatchilar faqat past chastotali savdoni qamraydi; Hana Market yuqori chastotali mahalla ma'lumoti/xizmati ustiga savdoni qo'yadi — bu har kunlik foydalanish odati yaratadi.

### 6. Maqsadli auditoriya
O'zbekiston mahallalari aholisi: mahalliy savdo, xizmat va kommunal ma'lumotdan foydalanuvchilar; hamda mahalla raislari va mahalliy bizneslar.

### 7. Bozor
Milliy: O'zbekistondagi minglab mahallalar. Kirish strategiyasi — bitta mahalladan boshlab, kritik massa yig'ib, shablon bilan kengaytirish (lokal zichlik modeli). Ikkilamchi bozor (resale) va mahalliy xizmatlar talabi o'smoqda.

### 8. Raqobat va farqlanish
Bozorda ikki asosiy o'yinchi: **Bir Bir** (milliy klassifayd — lokal emas, hamjamiyatsiz) va **Mango Market** (Carrot kloni — faqat P2P savdo, hamjamiyat/gaz/xizmat yo'q). Hana Market yagona **mahallaga yo'naltirilgan** platforma: yaqin-atrof + hamjamiyat + gaz/kommunal + xizmat katalogi. Bu — himoyalanadigan nisha, chunki mahalla — O'zbekistonga xos institut.

### 9. Ijtimoiy ta'sir va davlat siyosatiga muvofiqlik
Gaz taqsimoti O'zbekiston Respublikasi Vazirlar Mahkamasining **2018-yil 10-avgustdagi 646-sonli qarori** bilan tartibga solingan (aholiga oyiga kamida bir balon; operator — Hududgaztaminot; Sirdaryo, Sayxunobod tumanida avtomatlashtirilgan hisob + elektron karta piloti). Biroq qaror **xonadon darajasidagi shaffoflikni** (qachon/kim oldi) tartibga solmaydi va mahallani tilga olmaydi. Hana Market aynan shu bo'shliqni to'ldiradi — davlatning raqamlashtirish yo'nalishini mahalla darajasida davom ettiradi. Manba: lex.uz/uz/docs/-3911903. Bundan tashqari, Hana Market **adolatni algoritm bilan kafolatlaydi:** taqsimot xonadonlar tartibida boradi, to'xtagan joyidan avtomatik davom etadi va o'tkazib yuborilgan (uyda yo'q) xonadonlar keyingi safar birinchi navbatda ta'minlanadi; navbat buzilsa butun mahallaga ogohlantirish yuboriladi. Bu shaffoflikni adolat kafolatiga aylantiradi.

### 10. Biznes-model
- Mahalliy biznes reklamasi ("around me" chegirmalari) — do'konlar to'laydi.
- Ko'tarilgan e'lonlar (promoted listings).
- Xizmat provayderlari uchun premium.
Mantiq: avval yuqori chastotali auditoriya (gaz, mahalla) to'planadi, keyin mahalliy bizneslar shu auditoriyaga chiqish uchun to'laydi.

### 11. Traksiya / holat
Ilova **Google Play Store'da nashr etilgan** va **birinchi mahallada pilot tariqasida ishga tushirilgan** (real foydalanuvchilar). Front-end va back-end to'liq ishlaydi. [Foydalanuvchi/xonadon/yuklab olish/faol sessiya raqamlarini qo'shing]. Keyingi maqsad — pilotdan takroriy foydalanishni isbotlab, boshqa mahallalarga kengaytirish.

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
