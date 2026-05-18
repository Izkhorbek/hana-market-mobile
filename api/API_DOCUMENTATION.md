# ?? HANAMARKET MOBILE API DOCUMENTATION

**Version:** 1.0.0  
**Last Updated:** January 15, 2024  
**Base URL:** `https://api.hanamarket.uz`

---

## ?? Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Contact API](#contact-api)
6. [Complaint API](#complaint-api)
7. [Content API](#content-api)
8. [Mobile Implementation Examples](#mobile-implementation-examples)
9. [Rate Limiting](#rate-limiting)
10. [Support](#support)

---

## ?? Overview

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.hanamarket.uz` |
| Development | `https://dev-api.hanamarket.uz` |
| Local | `http://localhost:5000` |

### Supported Languages

- **Uzbek (uz)** - Default
- **Russian (ru)**

### Content Type

All requests and responses use `application/json` content type unless specified otherwise.

---

## ?? Authentication

### Authentication Methods

Most API_ENDPOINTSs require Bearer token authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Getting Access Token

**Login Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "phone_number": "+998901234567",
  "password": "your_password"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-16T12:00:00Z",
    "user": {
      "id": 123,
      "username": "john_doe",
      "phone_number": "+998901234567"
    }
  }
}
```

### Token Storage

**Recommended practices:**
- Store token securely using platform-specific secure storage
- Include token in all authenticated requests
- Refresh token before expiration
- Clear token on logout

---

## ?? Response Format

### Standard Response Structure

All API responses follow this consistent structure:

```json
{
  "status": 200,
  "message": "Success message",
  "data": {
    // Response data here
  }
}
```

### Success Response

**Status Code:** `200 OK`

```json
{
  "status": 200,
  "message": "Operation successful",
  "data": {
    "id": 12345,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response

**Status Codes:** `400`, `401`, `403`, `404`, `500`

```json
{
  "status": 400,
  "message": "Validation error description",
  "data": null
}
```

### Paginated Response

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "items": [...],
    "current_page": 1,
    "page_size": 20,
    "total_records": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```

---

## ?? Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (e.g., already reported) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Server maintenance |

### Common Error Messages

```json
{
  "status": 400,
  "message": "Validation failed: Email is required",
  "data": null
}
```

```json
{
  "status": 401,
  "message": "Unauthorized user.",
  "data": null
}
```

```json
{
  "status": 404,
  "message": "Product not found",
  "data": null
}
```

---

## ?? CONTACT API

### 1. Send Contact Message

Submit a contact message without authentication (public endpoint).

**Endpoint:** `POST /api/contact/send`  
**Authentication:** Not required  
**Content-Type:** `application/json`

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+998901234567",
  "subject": "Technical Issue",
  "message": "I'm having trouble uploading images. When I try to upload more than 3 images, the app crashes."
}
```

#### Request Parameters

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | ? Yes | 2-100 characters |
| `email` | string | ? Yes | Valid email format |
| `phone_number` | string | ? No | Uzbek format: `+998XXXXXXXXX` |
| `subject` | string | ? Yes | 5-200 characters |
| `message` | string | ? Yes | 10-1000 characters |

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Message sent successfully. We'll get back to you soon!",
  "data": {
    "message_id": 12345
  }
}
```

#### Error Responses

**400 - Validation Error:**
```json
{
  "status": 400,
  "message": "Email is required",
  "data": null
}
```

**500 - Server Error:**
```json
{
  "status": 500,
  "message": "Failed to send message.",
  "data": null
}
```

#### cURL Example

```bash
curl -X POST https://api.hanamarket.uz/api/contact/send \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Technical Issue",
    "message": "I need help with the app"
  }'
```

---

### 2. Submit User Feedback

Submit feedback with rating (requires authentication).

**Endpoint:** `POST /api/contact/feedback`  
**Authentication:** Bearer Token (USER_ROLE)  
**Content-Type:** `application/json`

#### Request Body

```json
{
  "feedback_type": "bug_report",
  "message": "App crashes when I try to edit my profile photo. This happens every time I tap the edit button.",
  "rating": 4,
  "contact_email": "user@example.com"
}
```

#### Request Parameters

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `feedback_type` | string | ? Yes | See [Feedback Types](#feedback-types) |
| `message` | string | ? Yes | 10-2000 characters |
| `rating` | integer | ? No | 1-5 |
| `contact_email` | string | ? No | Valid email format |

#### Feedback Types

| Value | Description (UZ) | Description (RU) |
|-------|------------------|------------------|
| `bug_report` | Xatolik haqida xabar | �����Ҭ�֬߬ڬ� ��� ���ڬҬܬ� |
| `feature_request` | Yangi xususiyat taklifi | ����֬լݬ�ج֬߬ڬ� ���߬ܬ�ڬ� |
| `general_feedback` | Umumiy fikr | ���Ҭ�ڬ� ���٬��� |
| `complaint` | Shikoyat | ���Ѭݬ�Ҭ� |

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Thank you for your feedback!",
  "data": {
    "feedback_id": 67890
  }
}
```

#### Error Responses

**400 - Invalid Feedback Type:**
```json
{
  "status": 400,
  "message": "Invalid feedback type",
  "data": null
}
```

**401 - Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized user.",
  "data": null
}
```

#### cURL Example

```bash
curl -X POST https://api.hanamarket.uz/api/contact/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "feedback_type": "bug_report",
    "message": "App crashes on profile edit",
    "rating": 4
  }'
```

---

## ?? COMPLAINT API

### 1. Create Complaint

Report a product or user for policy violations.

**Endpoint:** `POST /api/complaint/create`  
**Authentication:** Bearer Token (USER_ROLE)  
**Content-Type:** `application/json`

#### Request Body

```json
{
  "reported_user_id": 456,
  "reported_product_id": 789,
  "complaint_type": 1020,
  "description": "This product is a scam. The seller is asking for payment outside the platform and the product images are stolen from another website."
}
```

#### Request Parameters

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `reported_user_id` | integer | ? Yes | Must exist, cannot be yourself |
| `reported_product_id` | integer | ? Yes | Must exist |
| `complaint_type` | integer | ? Yes | Valid enum value (see below) |
| `description` | string | ? Yes | 10-500 characters |

#### Complaint Types (Enum)

| Value | Name | Description (UZ) | Description (RU) |
|-------|------|------------------|------------------|
| 1000 | Spam | Spam yoki keraksiz reklama | ����Ѭ� �ڬݬ� �߬֬߬�ج߬Ѭ� ��֬ܬݬѬެ� |
| 1010 | Inappropriate | Nomaqbul kontent | ���֬��ڬ֬ެݬ֬ެ��� �ܬ�߬�֬߬� |
| 1020 | Scam | Firibgarlik | �����֬߬߬ڬ�֬��Ӭ� |
| 1030 | Offensive | Haqoratli | ����ܬ��Ҭڬ�֬ݬ�߬��� |
| 1040 | Fake | Soxta e'lon | ����լլ֬ݬ�߬�� ��Ҭ��Ӭݬ֬߬ڬ� |
| 1050 | Other | Boshqa sabab | �����ԬѬ� ���ڬ�ڬ߬� |

#### Business Rules

- ? Cannot report yourself
- ? Cannot report the same product twice
- ? Must provide detailed description
- ? Product and user must exist

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Complaint submitted successfully. Our team will review it.",
  "data": {
    "complaint_id": 11111
  }
}
```

#### Error Responses

**400 - Self Report:**
```json
{
  "status": 400,
  "message": "You cannot report yourself.",
  "data": null
}
```

**400 - Duplicate Report:**
```json
{
  "status": 400,
  "message": "You have already reported this product.",
  "data": null
}
```

**404 - Product Not Found:**
```json
{
  "status": 404,
  "message": "Product not found.",
  "data": null
}
```

**404 - User Not Found:**
```json
{
  "status": 404,
  "message": "Reported user not found.",
  "data": null
}
```

#### cURL Example

```bash
curl -X POST https://api.hanamarket.uz/api/complaint/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "reported_user_id": 456,
    "reported_product_id": 789,
    "complaint_type": 1020,
    "description": "This is a scam product"
  }'
```

---

### 2. Get My Complaints

Retrieve user's submitted complaints with pagination.

**Endpoint:** `GET /api/complaint/my-complaints`  
**Authentication:** Bearer Token (USER_ROLE)

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | ? No | 1 | Page number |
| `pageSize` | integer | ? No | 20 | Items per page (max: 100) |

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": 11111,
      "reporter_user_id": 123,
      "reported_user_id": 456,
      "reported_product_id": 789,
      "complaint_type": {
        "value": 1020,
        "name": "Scam",
        "description": "Firibgarlik"
      },
      "description": "This product is fake and the seller is asking for payment outside the platform.",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 11112,
      "reporter_user_id": 123,
      "reported_user_id": 457,
      "reported_product_id": 790,
      "complaint_type": {
        "value": 1010,
        "name": "Inappropriate",
        "description": "Nomaqbul kontent"
      },
      "description": "Inappropriate images in product listing",
      "status": "reviewed",
      "created_at": "2024-01-14T15:20:00Z"
    }
  ]
}
```

#### Complaint Status Values

| Status | Description (UZ) | Description (RU) |
|--------|------------------|------------------|
| `pending` | Ko'rib chiqilmoqda | ���� ��Ѭ��ެ���֬߬ڬ� |
| `reviewed` | Ko'rib chiqilgan | ���Ѭ��ެ���֬߬� |
| `resolved` | Hal qilingan | ���֬�֬߬� |
| `rejected` | Rad etilgan | ����ܬݬ�߬֬߬� |

#### Error Responses

**401 - Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized user.",
  "data": null
}
```

#### cURL Example

```bash
curl -X GET "https://api.hanamarket.uz/api/complaint/my-complaints?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 3. Get Complaint Types

Get list of all available complaint types with localized descriptions.

**Endpoint:** `GET /api/complaint/types`  
**Authentication:** Not required

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "value": 1000,
      "name": "spam",
      "display_name": "Spam yoki keraksiz reklama"
    },
    {
      "value": 1010,
      "name": "inappropriate",
      "display_name": "Nomaqbul kontent"
    },
    {
      "value": 1020,
      "name": "scam",
      "display_name": "Firibgarlik"
    },
    {
      "value": 1030,
      "name": "offensive",
      "display_name": "Haqoratli"
    },
    {
      "value": 1040,
      "name": "fake",
      "display_name": "Soxta e'lon"
    },
    {
      "value": 1050,
      "name": "other",
      "display_name": "Boshqa sabab"
    }
  ]
}
```

#### cURL Example

```bash
curl -X GET https://api.hanamarket.uz/api/complaint/types
```

---

## ?? CONTENT API

### 1. Get About Us

Get structured About Us page content with localization support.

**Endpoint:** `GET /api/content/about-us`  
**Authentication:** Not required

#### Query Parameters

| Parameter | Type | Required | Default | Allowed Values |
|-----------|------|----------|---------|----------------|
| `lang` | string | ? No | `uz` | `uz`, `ru` |

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "header": {
      "app_name": "Hana Market",
      "version": "1.0.0",
      "tagline": "Sizning ishonchli bozorigiz",
      "logo_url": "/logos/hana-market.png"
    },
    "mission": {
      "title": "Bizning Maqsadimiz",
      "description": "Xavfsiz va qulay savdo platformasini yaratish orqali O'zbekiston xalqiga xizmat qilish. Biz har bir foydalanuvchiga sifatli va ishonchli xizmat ko'rsatishga intilamiz.",
      "icon": "??"
    },
    "about_app": {
      "title": "Ilova Haqida",
      "paragraphs": [
        "Hana Market - bu mahalliy savdo platformasi bo'lib, O'zbekiston bo'ylab ishonchli va xavfsiz savdoni ta'minlaydi.",
        "Biz xavfsizlik va qulaylikni birinchi o'ringa qo'yamiz. Platformamizda siz har qanday mahsulotni osongina sotishingiz yoki sotib olishingiz mumkin.",
        "Bizning maqsadimiz - har bir foydalanuvchiga eng yaxshi tajribani taqdim etish va mahalliy iqtisodiyotni rivojlantirishga hissa qo'shish."
      ]
    },
    "values": [
      {
        "icon": "??",
        "title": "Xavfsizlik",
        "description": "Barcha tranzaksiyalar himoyalangan va ma'lumotlaringiz maxfiy saqlanadi"
      },
      {
        "icon": "?",
        "title": "Tezkor",
        "description": "Bir necha daqiqada e'lon joylashtiring va xaridorlar bilan bog'laning"
      },
      {
        "icon": "??",
        "title": "Ishonchli",
        "description": "Tasdiqlangan foydalanuvchilar va sifatli mahsulotlar"
      },
      {
        "icon": "??",
        "title": "Mahalliy",
        "description": "O'zbekiston bo'ylab yetkazib berish va xizmat ko'rsatish"
      }
    ],
    "footer": {
      "title": "Aloqada Bo'ling",
      "description": "Bizning jamoamiz doim yordam berishga tayyor. Savol yoki takliflaringiz bo'lsa, biz bilan bog'laning.",
      "copyright": "? 2024 Hana Market. Barcha huquqlar himoyalangan.",
      "tagline": "O'zbekistonda ishlab chiqilgan ??"
    }
  }
}
```

#### Error Responses

**400 - Invalid Language:**
```json
{
  "status": 400,
  "message": "Invalid language. Use 'uz' or 'ru'.",
  "data": null
}
```

**404 - Content Not Found:**
```json
{
  "status": 404,
  "message": "About Us content not found",
  "data": null
}
```

#### cURL Example

```bash
# Uzbek version
curl -X GET "https://api.hanamarket.uz/api/content/about-us?lang=uz"

# Russian version
curl -X GET "https://api.hanamarket.uz/api/content/about-us?lang=ru"
```

---

### 2. Get Terms of Service

Get structured Terms of Service with sections and subsections.

**Endpoint:** `GET /api/content/terms`  
**Authentication:** Not required

#### Query Parameters

| Parameter | Type | Required | Default | Allowed Values |
|-----------|------|----------|---------|----------------|
| `lang` | string | ? No | `uz` | `uz`, `ru` |

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "last_updated": "2024-01-01T00:00:00Z",
    "sections": [
      {
        "title": "1. Umumiy Qoidalar",
        "content": [
          "Ushbu shartlar barcha foydalanuvchilar uchun majburiydir va platformadan foydalanish orqali siz ushbu shartlarni to'liq qabul qilasiz.",
          "Platformamiz faqat 18 yoshdan oshgan shaxslar uchun mo'ljallangan.",
          "Har bir foydalanuvchi o'z hisobiga to'liq javobgardir va boshqa shaxslar bilan hisobini bo'lishishi mumkin emas."
        ]
      },
      {
        "title": "2. Foydalanuvchi Majburiyatlari",
        "content": [
          "Foydalanuvchilar to'g'ri va aniq ma'lumot taqdim etishi shart.",
          "Soxta, aldamchi yoki noqonuniy e'lonlar joylashtirish qat'iyan man etiladi.",
          "Boshqa foydalanuvchilar huquqlarini hurmat qilish majburiy.",
          "Platform qoidalariga rioya qilmaslik hisobni blokirovka qilishga olib kelishi mumkin."
        ]
      },
      {
        "title": "3. E'lon Joylashtirish Qoidalari",
        "content": [
          "Har bir e'lon aniq va to'liq ma'lumot o'z ichiga olishi kerak.",
          "Mahsulot rasmlari haqiqiy va sifatli bo'lishi shart.",
          "Narxlar aniq ko'rsatilishi va aldamchi bo'lmasligi kerak.",
          "Noqonuniy mahsulotlar va xizmatlar e'lon qilish qat'iyan taqiqlanadi."
        ]
      },
      {
        "title": "4. To'lov va Xavfsizlik",
        "content": [
          "Barcha to'lovlar platformamiz orqali amalga oshirilishi tavsiya etiladi.",
          "Tashqi to'lov usullaridan foydalanish sizning mas'uliyatingizda.",
          "Biz shaxsiy va moliyaviy ma'lumotlaringizni himoya qilish uchun zamonaviy texnologiyalardan foydalanamiz.",
          "Shubhali faoliyat aniqlangan taqdirda darhol xabar bering."
        ]
      },
      {
        "title": "5. Javobgarlik Chegarasi",
        "content": [
          "Platform faqat vositachi vazifasini bajaradi va mahsulot sifati uchun javobgar emas.",
          "Foydalanuvchilar o'rtasidagi nizolar ular tomonidan mustaqil hal qilinishi kerak.",
          "Platform texnik ishlar yoki boshqa sabablarga ko'ra vaqtinchalik mavjud bo'lmasligi mumkin.",
          "Biz platformadan foydalanish natijasida yuzaga kelgan zararlar uchun javobgar emasmiz."
        ]
      }
    ]
  }
}
```

#### Error Responses

**400 - Invalid Language:**
```json
{
  "status": 400,
  "message": "Invalid language. Use 'uz' or 'ru'.",
  "data": null
}
```

**404 - Content Not Found:**
```json
{
  "status": 404,
  "message": "Terms of Service not found",
  "data": null
}
```

#### cURL Example

```bash
curl -X GET "https://api.hanamarket.uz/api/content/terms?lang=uz"
```

---

### 3. Get Privacy Policy

Get structured Privacy Policy with data protection information.

**Endpoint:** `GET /api/content/privacy`  
**Authentication:** Not required

#### Query Parameters

| Parameter | Type | Required | Default | Allowed Values |
|-----------|------|----------|---------|----------------|
| `lang` | string | ? No | `uz` | `uz`, `ru` |

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "last_updated": "2024-01-01T00:00:00Z",
    "sections": [
      {
        "title": "1. Ma'lumotlar Yig'ish",
        "content": [
          "Biz faqat xizmat ko'rsatish uchun zarur bo'lgan ma'lumotlarni yig'amiz.",
          "Sizning shaxsiy ma'lumotlaringiz (ism, telefon raqam, email) platformada ro'yxatdan o'tish vaqtida olinadi.",
          "Geo-lokatsiya ma'lumotlari faqat mahsulotlarni yaqin joyda ko'rsatish uchun ishlatiladi.",
          "To'lov ma'lumotlari xavfsiz tarzda shifrlangan holda saqlanadi."
        ]
      },
      {
        "title": "2. Ma'lumotlardan Foydalanish",
        "content": [
          "Yig'ilgan ma'lumotlar faqat xizmat sifatini yaxshilash uchun ishlatiladi.",
          "Biz sizning ma'lumotlaringizni hech qachon uchinchi tomonlarga sotmaymiz.",
          "Marketing maqsadlarda foydalanish faqat sizning roziligingiz bilan amalga oshiriladi.",
          "Statistik tahlil uchun anonim ma'lumotlar ishlatilishi mumkin."
        ]
      },
      {
        "title": "3. Ma'lumotlar Xavfsizligi",
        "content": [
          "Biz ma'lumotlaringizni himoya qilish uchun zamonaviy shifrlash texnologiyalaridan foydalanamiz.",
          "Barcha serverlarimiz xavfsiz muhitda joylashgan va doimiy monitoring ostida.",
          "Ma'lumotlar bazasiga kirish faqat vakolatli xodimlarga ruxsat etilgan.",
          "Har qanday xavfsizlik hodisasi tez orada foydalanuvchilarga xabar qilinadi."
        ]
      },
      {
        "title": "4. Sizning Huquqlaringiz",
        "content": [
          "Siz o'z ma'lumotlaringizni istalgan vaqtda ko'rish va tahrirlash huquqiga egasiz.",
          "Ma'lumotlaringizni to'liq o'chirish uchun bizga murojaat qilishingiz mumkin.",
          "Marketing xabarlardan istalgan vaqtda voz kechishingiz mumkin.",
          "Ma'lumotlar qayta ishlanishi haqida to'liq ma'lumot olish huquqiga egasiz."
        ]
      },
      {
        "title": "5. Cookie va Tracking",
        "content": [
          "Biz platformamizni yaxshilash uchun cookie-lardan foydalanamiz.",
          "Siz cookie sozlamalarini o'zgartirib, ularni o'chirib qo'yishingiz mumkin.",
          "Tracking ma'lumotlari faqat foydalanuvchi tajribasini yaxshilash uchun ishlatiladi.",
          "Uchinchi tomon tracking servislari ishlatilmaydi."
        ]
      }
    ]
  }
}
```

#### cURL Example

```bash
curl -X GET "https://api.hanamarket.uz/api/content/privacy?lang=uz"
```

---

### 4. Get News List

Get paginated list of published news articles and announcements.

**Endpoint:** `GET /api/content/news`  
**Authentication:** Not required

#### Query Parameters

| Parameter | Type | Required | Default | Range |
|-----------|------|----------|---------|-------|
| `page` | integer | ? No | 1 | 1-�� |
| `pageSize` | integer | ? No | 10 | 1-50 |

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "title_uz": "Yangi Xususiyatlar - V2.0 Yangilanishi!",
      "title_ru": "����Ӭ��� ����߬ܬ�ڬ� - ���Ҭ߬�Ӭݬ֬߬ڬ� V2.0!",
      "content_uz": "Endi siz mahsulotlarni to'g'ridan-to'g'ri chatda sotib olishingiz mumkin. Yangi versiyamizda ko'plab yaxshilanishlar va yangi xususiyatlar qo'shildi:\n\n1. Ichki chat tizimi\n2. Xavfsiz to'lov tizimi\n3. Mahsulot takliflari\n4. Yaxshilangan qidiruv\n\nYangilanishni hoziroq o'rnating va yangi imkoniyatlardan foydalaning!",
      "content_ru": "���֬�֬�� �Ӭ� �ެ�ج֬�� �ܬ��ڬ�� ���ӬѬ�� ����ެ� �� ��Ѭ��. �� �߬�Ӭ�� �Ӭ֬��ڬ� �լ�ҬѬӬݬ֬߬� �ެ߬�ج֬��Ӭ� ��ݬ���֬߬ڬ� �� �߬�Ӭ��� ���߬ܬ�ڬ�:\n\n1. ���߬���֬߬߬�� ��ڬ��֬ެ� ��Ѭ��\n2. ���֬٬��Ѭ�߬Ѭ� ��ݬѬ�֬ج߬Ѭ� ��ڬ��֬ެ�\n3. ����֬լݬ�ج֬߬ڬ� ���ӬѬ���\n4. ���ݬ���֬߬߬��� ���ڬ��\n\n�����Ѭ߬�Ӭڬ�� ��Ҭ߬�Ӭݬ֬߬ڬ� ����ެ� ��֬۬�Ѭ� �� ���ݬ�٬�۬�֬�� �߬�Ӭ��ެ� �Ӭ�٬ެ�ج߬����ެ�!",
      "image_url": "/news/update-v2.jpg",
      "category": "updates",
      "is_published": true,
      "published_at": "2024-01-10T12:00:00Z",
      "created_at": "2024-01-09T10:00:00Z"
    },
    {
      "id": 2,
      "title_uz": "Texnik Ishlar - 15 Yanvar",
      "title_ru": "���֬�߬ڬ�֬�ܬ�� ���Ҭ�ݬ�جڬӬѬ߬ڬ� - 15 ���߬ӬѬ��",
      "content_uz": "Hurmatli foydalanuvchilar! 15-yanvar kuni soat 02:00 dan 04:00 gacha platformada texnik ishlar olib boriladi. Bu vaqt ichida xizmatlarimiz vaqtinchalik mavjud bo'lmaydi. Noqulaylik uchun uzr so'raymiz.",
      "content_ru": "���ӬѬجѬ֬ެ��� ���ݬ�٬�ӬѬ�֬ݬ�! 15 ��߬ӬѬ�� �� 02:00 �լ� 04:00 �߬� ��ݬѬ����ެ� �Ҭ�լ�� ����Ӭ�լڬ���� ��֬�߬ڬ�֬�ܬڬ� ��ѬҬ���. �� ���� �Ӭ�֬ެ� �߬Ѭ�� ���ݬ�Ԭ� �Ҭ�լ�� �Ӭ�֬ެ֬߬߬� �߬֬լ�����߬�. ����ڬ߬��ڬ� �ڬ٬Ӭڬ߬֬߬ڬ� �٬� �߬֬�լ�Ҭ��Ӭ�.",
      "image_url": "/news/maintenance.jpg",
      "category": "maintenance",
      "is_published": true,
      "published_at": "2024-01-08T15:00:00Z",
      "created_at": "2024-01-08T14:30:00Z"
    }
  ]
}
```

#### News Categories

| Category | Description (UZ) | Description (RU) |
|----------|------------------|------------------|
| `updates` | Yangilanishlar | ���Ҭ߬�Ӭݬ֬߬ڬ� |
| `announcement` | E'lonlar | ���Ҭ��Ӭݬ֬߬ڬ� |
| `tips` | Maslahatlar | ����Ӭ֬�� |
| `maintenance` | Texnik ishlar | ���֬�߬ڬ�֬�ܬ�� ��Ҭ�ݬ�جڬӬѬ߬ڬ� |

#### Error Responses

**500 - Server Error:**
```json
{
  "status": 500,
  "message": "Failed to retrieve news.",
  "data": null
}
```

#### cURL Example

```bash
curl -X GET "https://api.hanamarket.uz/api/content/news?page=1&pageSize=10"
```

---

### 5. Get Single News

Get detailed information about a specific news article by ID.

**Endpoint:** `GET /api/content/news/{id}`  
**Authentication:** Not required

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | ? Yes | News article ID |

#### Success Response (200)

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "title_uz": "Yangi Xususiyatlar - V2.0 Yangilanishi!",
    "title_ru": "����Ӭ��� ����߬ܬ�ڬ� - ���Ҭ߬�Ӭݬ֬߬ڬ� V2.0!",
    "content_uz": "Endi siz mahsulotlarni to'g'ridan-to'g'ri chatda sotib olishingiz mumkin...",
    "content_ru": "���֬�֬�� �Ӭ� �ެ�ج֬�� �ܬ��ڬ�� ���ӬѬ�� ����ެ� �� ��Ѭ��...",
    "image_url": "/news/update-v2.jpg",
    "category": "updates",
    "is_published": true,
    "published_at": "2024-01-10T12:00:00Z",
    "created_at": "2024-01-09T10:00:00Z"
  }
}
```

#### Error Responses

**404 - News Not Found:**
```json
{
  "status": 404,
  "message": "News not found",
  "data": null
}
```

#### cURL Example

```bash
curl -X GET https://api.hanamarket.uz/api/content/news/1
```

---

## ?? Mobile Implementation Examples

### Flutter / Dart

#### 1. Contact Message Service

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ContactService {
  static const String baseUrl = 'https://api.hanamarket.uz';
  
  Future<Map<String, dynamic>> sendContactMessage({
    required String name,
    required String email,
    required String subject,
    required String message,
    String? phoneNumber,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/contact/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'subject': subject,
          'message': message,
          'phone_number': phoneNumber,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'],
          'messageId': data['data']['message_id'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  Future<Map<String, dynamic>> sendFeedback({
    required String token,
    required String feedbackType,
    required String message,
    int? rating,
    String? contactEmail,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/contact/feedback'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'feedback_type': feedbackType,
          'message': message,
          'rating': rating,
          'contact_email': contactEmail,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'],
          'feedbackId': data['data']['feedback_id'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }
}
```

#### 2. Complaint Service

```dart
class ComplaintService {
  static const String baseUrl = 'https://api.hanamarket.uz';
  
  Future<Map<String, dynamic>> createComplaint({
    required String token,
    required int reportedUserId,
    required int reportedProductId,
    required int complaintType,
    required String description,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/complaint/create'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'reported_user_id': reportedUserId,
          'reported_product_id': reportedProductId,
          'complaint_type': complaintType,
          'description': description,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'],
          'complaintId': data['data']['complaint_id'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  Future<List<Complaint>> getMyComplaints({
    required String token,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/complaint/my-complaints?page=$page&pageSize=$pageSize'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> items = data['data'];
        return items.map((item) => Complaint.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load complaints');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<ComplaintType>> getComplaintTypes() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/complaint/types'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> items = data['data'];
        return items.map((item) => ComplaintType.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load complaint types');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}

// Models
class Complaint {
  final int id;
  final int reporterUserId;
  final int reportedUserId;
  final int reportedProductId;
  final ComplaintTypeEnum complaintType;
  final String description;
  final String status;
  final DateTime createdAt;

  Complaint({
    required this.id,
    required this.reporterUserId,
    required this.reportedUserId,
    required this.reportedProductId,
    required this.complaintType,
    required this.description,
    required this.status,
    required this.createdAt,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'],
      reporterUserId: json['reporter_user_id'],
      reportedUserId: json['reported_user_id'],
      reportedProductId: json['reported_product_id'],
      complaintType: ComplaintTypeEnum.fromJson(json['complaint_type']),
      description: json['description'],
      status: json['status'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class ComplaintType {
  final int value;
  final String name;
  final String displayName;

  ComplaintType({
    required this.value,
    required this.name,
    required this.displayName,
  });

  factory ComplaintType.fromJson(Map<String, dynamic> json) {
    return ComplaintType(
      value: json['value'],
      name: json['name'],
      displayName: json['display_name'],
    );
  }
}

class ComplaintTypeEnum {
  final int value;
  final String name;
  final String description;

  ComplaintTypeEnum({
    required this.value,
    required this.name,
    required this.description,
  });

  factory ComplaintTypeEnum.fromJson(Map<String, dynamic> json) {
    return ComplaintTypeEnum(
      value: json['value'],
      name: json['name'],
      description: json['description'],
    );
  }
}
```

#### 3. Content Service

```dart
class ContentService {
  static const String baseUrl = 'https://api.hanamarket.uz';
  
  Future<AboutUsData> getAboutUs(String lang) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/content/about-us?lang=$lang'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return AboutUsData.fromJson(data['data']);
      } else {
        throw Exception('Failed to load About Us content');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<TermsPrivacyData> getTerms(String lang) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/content/terms?lang=$lang'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return TermsPrivacyData.fromJson(data['data']);
      } else {
        throw Exception('Failed to load Terms of Service');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<TermsPrivacyData> getPrivacy(String lang) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/content/privacy?lang=$lang'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return TermsPrivacyData.fromJson(data['data']);
      } else {
        throw Exception('Failed to load Privacy Policy');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<News>> getNews({int page = 1, int pageSize = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/content/news?page=$page&pageSize=$pageSize'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> items = data['data'];
        return items.map((item) => News.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load news');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<News> getNewsById(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/content/news/$id'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return News.fromJson(data['data']);
      } else {
        throw Exception('Failed to load news');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}

// Models
class AboutUsData {
  final AboutHeader header;
  final AboutMission mission;
  final AboutApp aboutApp;
  final List<AboutValue> values;
  final AboutFooter footer;

  AboutUsData({
    required this.header,
    required this.mission,
    required this.aboutApp,
    required this.values,
    required this.footer,
  });

  factory AboutUsData.fromJson(Map<String, dynamic> json) {
    return AboutUsData(
      header: AboutHeader.fromJson(json['header']),
      mission: AboutMission.fromJson(json['mission']),
      aboutApp: AboutApp.fromJson(json['about_app']),
      values: (json['values'] as List)
          .map((v) => AboutValue.fromJson(v))
          .toList(),
      footer: AboutFooter.fromJson(json['footer']),
    );
  }
}

class AboutHeader {
  final String appName;
  final String version;
  final String tagline;
  final String logoUrl;

  AboutHeader({
    required this.appName,
    required this.version,
    required this.tagline,
    required this.logoUrl,
  });

  factory AboutHeader.fromJson(Map<String, dynamic> json) {
    return AboutHeader(
      appName: json['app_name'],
      version: json['version'],
      tagline: json['tagline'],
      logoUrl: json['logo_url'],
    );
  }
}

class AboutMission {
  final String title;
  final String description;
  final String icon;

  AboutMission({
    required this.title,
    required this.description,
    required this.icon,
  });

  factory AboutMission.fromJson(Map<String, dynamic> json) {
    return AboutMission(
      title: json['title'],
      description: json['description'],
      icon: json['icon'],
    );
  }
}

class AboutApp {
  final String title;
  final List<String> paragraphs;

  AboutApp({
    required this.title,
    required this.paragraphs,
  });

  factory AboutApp.fromJson(Map<String, dynamic> json) {
    return AboutApp(
      title: json['title'],
      paragraphs: List<String>.from(json['paragraphs']),
    );
  }
}

class AboutValue {
  final String icon;
  final String title;
  final String description;

  AboutValue({
    required this.icon,
    required this.title,
    required this.description,
  });

  factory AboutValue.fromJson(Map<String, dynamic> json) {
    return AboutValue(
      icon: json['icon'],
      title: json['title'],
      description: json['description'],
    );
  }
}

class AboutFooter {
  final String title;
  final String description;
  final String copyright;
  final String tagline;

  AboutFooter({
    required this.title,
    required this.description,
    required this.copyright,
    required this.tagline,
  });

  factory AboutFooter.fromJson(Map<String, dynamic> json) {
    return AboutFooter(
      title: json['title'],
      description: json['description'],
      copyright: json['copyright'],
      tagline: json['tagline'],
    );
  }
}

class TermsPrivacyData {
  final DateTime lastUpdated;
  final List<PolicySection> sections;

  TermsPrivacyData({
    required this.lastUpdated,
    required this.sections,
  });

  factory TermsPrivacyData.fromJson(Map<String, dynamic> json) {
    return TermsPrivacyData(
      lastUpdated: DateTime.parse(json['last_updated']),
      sections: (json['sections'] as List)
          .map((s) => PolicySection.fromJson(s))
          .toList(),
    );
  }
}

class PolicySection {
  final String title;
  final List<String> content;

  PolicySection({
    required this.title,
    required this.content,
  });

  factory PolicySection.fromJson(Map<String, dynamic> json) {
    return PolicySection(
      title: json['title'],
      content: List<String>.from(json['content']),
    );
  }
}

class News {
  final int id;
  final String titleUz;
  final String titleRu;
  final String contentUz;
  final String contentRu;
  final String? imageUrl;
  final String category;
  final bool isPublished;
  final DateTime? publishedAt;
  final DateTime createdAt;

  News({
    required this.id,
    required this.titleUz,
    required this.titleRu,
    required this.contentUz,
    required this.contentRu,
    this.imageUrl,
    required this.category,
    required this.isPublished,
    this.publishedAt,
    required this.createdAt,
  });

  factory News.fromJson(Map<String, dynamic> json) {
    return News(
      id: json['id'],
      titleUz: json['title_uz'],
      titleRu: json['title_ru'],
      contentUz: json['content_uz'],
      contentRu: json['content_ru'],
      imageUrl: json['image_url'],
      category: json['category'],
      isPublished: json['is_published'],
      publishedAt: json['published_at'] != null
          ? DateTime.parse(json['published_at'])
          : null,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  String getTitle(String lang) => lang == 'uz' ? titleUz : titleRu;
  String getContent(String lang) => lang == 'uz' ? contentUz : contentRu;
}
```

---

### React Native / TypeScript

#### 1. Contact Service

```typescript
// services/contactService.ts
import axios from 'axios';

const BASE_URL = 'https://api.hanamarket.uz';



export const contactService = {
  async sendContactMessage(request: ContactMessageRequest) {
    try {
      const response = await axios.post<ApiResponse<{ message_id: number }>>(
        `${BASE_URL}/api/contact/send`,
        request
      );
      return {
        success: true,
        message: response.data.message,
        messageId: response.data.data.message_id,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Network error',
      };
    }
  },

  async sendFeedback(token: string, request: FeedbackRequest) {
    try {
      const response = await axios.post<ApiResponse<{ feedback_id: number }>>(
        `${BASE_URL}/api/contact/feedback`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return {
        success: true,
        message: response.data.message,
        feedbackId: response.data.data.feedback_id,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Network error',
      };
    }
  },
};
```

#### 2. Complaint Service

```typescript
// services/complaintService.ts
import axios from 'axios';

const BASE_URL = 'https://api.hanamarket.uz';

interface CreateComplaintRequest {
  reported_user_id: number;
  reported_product_id: number;
  complaint_type: number;
  description: string;
}

interface Complaint {
  id: number;
  reporter_user_id: number;
  reported_user_id: number;
  reported_product_id: number;
  complaint_type: {
    value: number;
    name: string;
    description: string;
  };
  description: string;
  status: string;
  created_at: string;
}

interface ComplaintType {
  value: number;
  name: string;
  display_name: string;
}

export const complaintService = {
  async createComplaint(token: string, request: CreateComplaintRequest) {
    try {
      const response = await axios.post<ApiResponse<{ complaint_id: number }>>(
        `${BASE_URL}/api/complaint/create`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return {
        success: true,
        message: response.data.message,
        complaintId: response.data.data.complaint_id,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Network error',
      };
    }
  },

  async getMyComplaints(token: string, page = 1, pageSize = 20) {
    try {
      const response = await axios.get<ApiResponse<Complaint[]>>(
        `${BASE_URL}/api/complaint/my-complaints`,
        {
          params: { page, pageSize },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      throw new Error('Failed to fetch complaints');
    }
  },

  async getComplaintTypes() {
    try {
      const response = await axios.get<ApiResponse<ComplaintType[]>>(
        `${BASE_URL}/api/complaint/types`
      );
      return response.data.data;
    } catch (error) {
      throw new Error('Failed to fetch complaint types');
    }
  },
};
```

---

### Swift / iOS

```swift
// Services/ContactService.swift
import Foundation

struct ContactMessageRequest: Codable {
    let name: String
    let email: String
    let subject: String
    let message: String
    let phoneNumber: String?
    
    enum CodingKeys: String, CodingKey {
        case name, email, subject, message
        case phoneNumber = "phone_number"
    }
}

struct FeedbackRequest: Codable {
    let feedbackType: String
    let message: String
    let rating: Int?
    let contactEmail: String?
    
    enum CodingKeys: String, CodingKey {
        case message, rating
        case feedbackType = "feedback_type"
        case contactEmail = "contact_email"
    }
}

struct ApiResponse<T: Codable>: Codable {
    let status: Int
    let message: String
    let data: T?
}

class ContactService {
    static let shared = ContactService()
    private let baseURL = "https://api.hanamarket.uz"
    
    func sendContactMessage(_ request: ContactMessageRequest) async throws -> Int {
        let url = URL(string: "\(baseURL)/api/contact/send")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "ContactService", code: -1, userInfo: nil)
        }
        
        struct ResponseData: Codable {
            let messageId: Int
            enum CodingKeys: String, CodingKey {
                case messageId = "message_id"
            }
        }
        
        let apiResponse = try JSONDecoder().decode(ApiResponse<ResponseData>.self, from: data)
        return apiResponse.data?.messageId ?? 0
    }
    
    func sendFeedback(_ request: FeedbackRequest, token: String) async throws -> Int {
        let url = URL(string: "\(baseURL)/api/contact/feedback")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "ContactService", code: -1, userInfo: nil)
        }
        
        struct ResponseData: Codable {
            let feedbackId: Int
            enum CodingKeys: String, CodingKey {
                case feedbackId = "feedback_id"
            }
        }
        
        let apiResponse = try JSONDecoder().decode(ApiResponse<ResponseData>.self, from: data)
        return apiResponse.data?.feedbackId ?? 0
    }
}
```

---

### Kotlin / Android

```kotlin
// services/ContactService.kt
import retrofit2.Response
import retrofit2.http.*

data class ContactMessageRequest(
    val name: String,
    val email: String,
    val subject: String,
    val message: String,
    @SerializedName("phone_number") val phoneNumber: String? = null
)

data class FeedbackRequest(
    @SerializedName("feedback_type") val feedbackType: String,
    val message: String,
    val rating: Int? = null,
    @SerializedName("contact_email") val contactEmail: String? = null
)

data class ApiResponse<T>(
    val status: Int,
    val message: String,
    val data: T?
)

data class MessageIdResponse(
    @SerializedName("message_id") val messageId: Int
)

data class FeedbackIdResponse(
    @SerializedName("feedback_id") val feedbackId: Int
)

interface ContactApi {
    @POST("api/contact/send")
    suspend fun sendContactMessage(
        @Body request: ContactMessageRequest
    ): Response<ApiResponse<MessageIdResponse>>
    
    @POST("api/contact/feedback")
    suspend fun sendFeedback(
        @Header("Authorization") token: String,
        @Body request: FeedbackRequest
    ): Response<ApiResponse<FeedbackIdResponse>>
}

class ContactService(private val api: ContactApi) {
    suspend fun sendContactMessage(request: ContactMessageRequest): Result<Int> {
        return try {
            val response = api.sendContactMessage(request)
            if (response.isSuccessful && response.body() != null) {
                val messageId = response.body()!!.data?.messageId ?: 0
                Result.success(messageId)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun sendFeedback(token: String, request: FeedbackRequest): Result<Int> {
        return try {
            val response = api.sendFeedback("Bearer $token", request)
            if (response.isSuccessful && response.body() != null) {
                val feedbackId = response.body()!!.data?.feedbackId ?: 0
                Result.success(feedbackId)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

---

## ?? Rate Limiting

To ensure fair usage and prevent abuse, the following rate limits apply:

### Rate Limit Rules

| Endpoint Type | Limit | Time Window |
|---------------|-------|-------------|
| Public (no auth) | 100 requests | 1 hour |
| Authenticated | 1000 requests | 1 hour |
| Contact/Feedback | 10 requests | 1 hour |
| Complaint Creation | 5 requests | 1 day |

### Rate Limit Headers

Each response includes rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320000
```

### Rate Limit Exceeded Response

**Status Code:** `429 Too Many Requests`

```json
{
  "status": 429,
  "message": "Rate limit exceeded. Please try again later.",
  "data": {
    "retry_after": 3600
  }
}
```

### Best Practices

1. ? Cache responses when possible
2. ? Implement exponential backoff
3. ? Monitor rate limit headers
4. ? Use webhooks instead of polling
5. ? Don't make unnecessary requests

---

## ?? Security Best Practices

### 1. Token Security

```dart
// ? Good - Use secure storage
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();
await storage.write(key: 'auth_token', value: token);

// ? Bad - Don't use shared preferences for tokens
SharedPreferences.setString('auth_token', token); // Insecure!
```

### 2. HTTPS Only

```dart
// ? Always use HTTPS
const baseUrl = 'https://api.hanamarket.uz';

// ? Never use HTTP in production
// const baseUrl = 'http://api.hanamarket.uz';
```

### 3. Input Validation

```dart
// ? Validate inputs before sending
String? validateEmail(String email) {
  if (!email.contains('@')) {
    return 'Invalid email format';
  }
  return null;
}

// ? Sanitize user input
String sanitizeInput(String input) {
  return input.trim().replaceAll(RegExp(r'<[^>]*>'), '');
}
```

### 4. Error Handling

```dart
// ? Never expose sensitive info in errors
try {
  await api.sendRequest();
} catch (e) {
  // Good - Generic error message
  showError('An error occurred. Please try again.');
  
  // Bad - Exposing internal details
  // showError('Database error: $e');
}
```

---

## ?? Support & Contact

### Technical Support

- **Email:** support@hanamarket.uz
- **Phone:** +998 90 123 45 67
- **Telegram:** [@hanamarket_support](https://t.me/hanamarket_support)
- **Working Hours:** Monday - Friday, 9:00 AM - 6:00 PM (GMT+5)

### Developer Resources

- **API Status:** [status.hanamarket.uz](https://status.hanamarket.uz)
- **Documentation:** [docs.hanamarket.uz](https://docs.hanamarket.uz)
- **Changelog:** [changelog.hanamarket.uz](https://changelog.hanamarket.uz)
- **GitHub:** [github.com/hanamarket](https://github.com/hanamarket)

### Report Issues

Found a bug or security vulnerability?

- **Bug Reports:** bugs@hanamarket.uz
- **Security Issues:** security@hanamarket.uz
- **Feature Requests:** Use the feedback API

### Community

- **Telegram Channel:** [@hanamarket_news](https://t.me/hanamarket_news)
- **Developer Forum:** [forum.hanamarket.uz](https://forum.hanamarket.uz)
- **Stack Overflow:** Tag `hanamarket`

---

## ?? Changelog

### Version 1.0.0 (January 15, 2024)

#### Added
- ? Contact API with public message submission
- ? Authenticated feedback system with ratings
- ? Complaint system with 6 violation types
- ? Content API for About Us, Terms, Privacy
- ? News system with pagination
- ? Multi-language support (Uzbek, Russian)
- ? Comprehensive error handling
- ? Rate limiting protection

#### Security
- ?? Bearer token authentication
- ?? Input validation and sanitization
- ?? HTTPS-only communication
- ?? Secure data storage guidelines

---

## ?? License & Terms

### API Usage Terms

1. **Fair Use:** API is for legitimate app functionality only
2. **No Scraping:** Automated data extraction is prohibited
3. **Attribution:** Include "Powered by Hana Market" in your app
4. **Rate Limits:** Respect all rate limiting policies
5. **Security:** Report vulnerabilities responsibly

### Data Privacy

- User data is processed according to our [Privacy Policy](#3-get-privacy-policy)
- All requests are logged for security and debugging
- Personal data is never sold to third parties
- GDPR and local data protection laws compliance

---

## ?? Quick Start Checklist

- [ ] Register an account at [hanamarket.uz](https://hanamarket.uz)
- [ ] Get your API access token
- [ ] Test endpoints using cURL or Postman
- [ ] Implement authentication in your app
- [ ] Add secure token storage
- [ ] Implement error handling
- [ ] Test rate limiting behavior
- [ ] Add loading states and user feedback
- [ ] Submit app for review

---

**Last Updated:** January 15, 2024  
**API Version:** 1.0.0  
**Documentation Version:** 1.0.0

---

**? 2024 Hana Market. All Rights Reserved.**

Made with ?? in Uzbekistan ????
