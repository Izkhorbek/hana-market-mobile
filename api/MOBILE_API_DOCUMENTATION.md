# HanaMarket Mobile API Documentation

## Base URL
```
http://localhost:5000/api
```

## Table of Contents
1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Products](#products)
4. [Categories](#categories)
5. [Chat](#chat)
6. [Complaints](#complaints)
7. [SignalR (Real-time Chat)](#signalr)

---

## Common Response Structure

All API responses follow this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors: string[];
  status_code: number;
}
```

---

## 1. AUTHENTICATION

### Register
**POST** `/auth/register`

**Request:**
```json
{
  "phone_number": "+998901234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully registered user",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

### Login
**POST** `/auth/login`

**Request:**
```json
{
  "phone_number": "+998901234567"
}
```

**Response Headers:**
```
X-Access-Token: eyJhbGciOiJIUzI1NiIs...
X-Expires-At: 2024-12-31T23:59:59Z
```

**Response:**
```json
{
  "success": true,
  "message": "Login successfully",
  "data": {
    "id": 123,
    "username": "john_doe",
    "phone_number": "+998901234567",
    "first_name": "John",
    "last_name": "Doe",
    "profile_image_url": "https://...",
    "status": "active",
    "is_blocked": false,
    "blocked_info": null
  },
  "errors": [],
  "status_code": 200
}
```

**If Blocked (403):**
```json
{
  "success": false,
  "message": "User is blocked",
  "data": {
    "id": 123,
    "username": "john_doe",
    "phone_number": "+998901234567",
    "first_name": "John",
    "last_name": "Doe",
    "profile_image_url": "https://...",
    "status": "blocked",
    "is_blocked": true,
    "blocked_info": {
      "blocked_until": "2024-12-31T23:59:59Z",
      "blocked_reason": "Spam",
      "is_permanent": false
    }
  },
  "errors": [],
  "status_code": 403
}
```

---

### Logout
**POST** `/auth/logout`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "message": "Logout successfully",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

## 2. USER MANAGEMENT

### Get Current User Info
**GET** `/user/get`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_image_url": "https://...",
    "bio": "Hello world",
    "latitude": 41.2995,
    "longitude": 69.2401,
    "search_radius_km": 10,
    "address_name": "Tashkent",
    "is_verified": true,
    "products": [...],
    "liked": [...]
  },
  "errors": [],
  "status_code": 200
}
```

---

### Update User Profile
**POST** `/user/update`
**Requires:** Authorization header

**Request:**
```json
{
  "username": "new_username",
  "email": "new@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "bio": "My bio"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated user",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

### Upload Profile Image
**POST** `/user/upload/profile-image`
**Requires:** Authorization header
**Content-Type:** `multipart/form-data`

**Request:**
```
FormData:
- image: File (max 5MB, jpg/jpeg/png)
```

**Response:**
```json
{
  "success": true,
  "message": "Profile image uploaded",
  "data": "https://your-domain.com/uploads/profile/image.jpg",
  "errors": [],
  "status_code": 200
}
```

---

### Update User Location
**POST** `/user/update/location`
**Requires:** Authorization header

**Request:**
```json
{
  "latitude": 41.2995,
  "longitude": 69.2401,
  "search_radius_km": 10,
  "address_name": "Tashkent, Uzbekistan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": "Location updated",
  "errors": [],
  "status_code": 200
}
```

---

### Delete Account (Soft Delete)
**POST** `/user/delete`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted user",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

## 3. PRODUCTS

### Get All Products (with filters)
**GET** `/product/all?user_lat=41.2995&user_long=69.2401&current_page=1&page_size=20`
**Requires:** Authorization header

**Query Parameters:**
- `user_lat` (required): User's latitude
- `user_long` (required): User's longitude
- `current_page`: Page number (default: 1)
- `page_size`: Items per page (default: 20)
- `category_id`: Filter by category
- `product_type`: 0=Thing, 1=Car, 2=Work
- `search_query`: Search text
- `min_price_uzs`: Minimum price in UZS
- `max_price_uzs`: Maximum price in UZS
- `is_free`: true/false
- `sort_by`: distance, price_asc, price_desc, newest

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "iPhone 13",
        "description": "Good condition",
        "moljal": "Near Amir Temur Square",
        "is_free": false,
        "is_negotiable": true,
        "status": "active",
        "likes_count": 10,
        "views_count": 100,
        "main_image_url": "https://...",
        "car_brand": null,
        "car_model": null,
        "work_type": null,
        "work_condition": null,
        "distance": "2.5 km",
        "created_ago": "2 hours ago",
        "price": "500 $"
      }
    ],
    "current_page": 1,
    "page_size": 20,
    "total_records": 50
  },
  "errors": [],
  "status_code": 200
}
```

---

### Get Product by ID
**GET** `/product/{id}`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "category_id": 5,
    "category_name_uz": "Elektronika",
    "category_name_ru": "���ݬ֬ܬ���߬ڬܬ�",
    "title": "iPhone 13",
    "description": "Good condition",
    "moljal": "Near Amir Temur Square",
    "is_free": false,
    "is_negotiable": true,
    "status": "active",
    "views_count": 100,
    "likes_count": 10,
    "main_image_url": "https://...",
    "latitude": 41.2995,
    "longitude": 69.2401,
    "car_brand": null,
    "car_model": null,
    "work_type": null,
    "work_condition": null,
    "product_type": 0,
    "product_type_name": "Thing",
    "distance": "2.5 km",
    "created_ago": "2 hours ago",
    "price": "500 $",
    "car_data": null,
    "work_data": null
  },
  "errors": [],
  "status_code": 200
}
```

---

### Create Product
**POST** `/product/create`
**Requires:** Authorization header
**Content-Type:** `multipart/form-data`

**Request (Form Data):**
```typescript
{
  title: string;
  description: string;
  category_id: number;
  product_type: 1000 | 1010 | 1020; // 1000=Thing, 1010=Car, 1020=Work
  is_free: boolean;
  is_negotiable: boolean;
  latitude: number;
  longitude: number;
  moljal?: string;
  
  // If not free:
  currency_type?: 1000 | 1010; // 1000=UZS, 1010=USD
  price_uzs?: number;
  price_usd?: number;
  
  // Car specific:
  car_brand?: string;
  car_model?: string;
  car_data?: JSON.stringify({
    year: number;
    mileage: number;
    fuel_type: number;
    car_transmission: number;
    car_condition: number;
  });
  
  // Work specific:
  work_type?: string;
  work_condition?: string;
  work_data?: JSON.stringify({
    worker_type: number;
    salary_type: number;
    payment_type: number;
    working_days_hours?: string;
    employer_information?: string;
    workplace_information?: string;
    salary_amount?: number;
    phone_number?: string;
    work_ethics?: string;
  });
  
  // Images (must upload draft images first):
  images_json: JSON.stringify([
    {
      draft_uuid: string;
      draft_image_url: string;
    }
  ]);
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully created",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

### Upload Draft Images (Before Creating Product)
**POST** `/product/images/upload-draft`
**Requires:** Authorization header
**Content-Type:** `multipart/form-data`

**Request:**
```
FormData:
- images: File[] (max 5 images, each max 5MB)
```

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": [
    {
      "draft_uuid": "123e4567-e89b-12d3-a456-426614174000",
      "draft_image_url": "https://your-domain.com/temp/image1.jpg"
    },
    {
      "draft_uuid": "123e4567-e89b-12d3-a456-426614174001",
      "draft_image_url": "https://your-domain.com/temp/image2.jpg"
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

### Update Product
**PUT** `/product/{id}`
**Requires:** Authorization header

**Request:**
```json
{
  "category_id": 5,
  "title": "Updated title",
  "description": "Updated description",
  "price_uzs": 1000000,
  "is_free": false,
  "is_negotiable": true,
  "latitude": 41.2995,
  "longitude": 69.2401,
  "moljal": "Updated location"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Updated",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

### Delete Product
**DELETE** `/product/{id}`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "message": "Deleted successfully",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

### Get Product Images
**GET** `/product/{id}/images`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "image_url": "https://...",
      "sort_order": 0,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

### Like/Unlike Product
**POST** `/product/{id}/likes`
**Requires:** Authorization header

**Request:**
```json
{
  "is_liked": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Added to likes",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

### Get Liked Products
**GET** `/product/likes`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "product_id": 10,
      "title": "iPhone 13",
      "description": "Good condition",
      "main_image_url": "https://...",
      "status": "active",
      "created_ago": "2 days ago",
      "price": "500 $"
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

### Get My Products
**GET** `/product/my`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "category_id": 100,
      "category_name_uz": "Elektronika",
      "category_name_ru": "���ݬ֬ܬ���߬ڬܬ�",
      "product_type": 0,
      "product_type_name": "Thing",
      "title": "iPhone 13",
      "description": "Good condition",
      "moljal": "Near square",
      "is_free": false,
      "is_negotiable": true,
      "status": "active",
      "views_count": 100,
      "likes_count": 10,
      "main_image_url": "https://...",
      "latitude": 41.2995,
      "longitude": 69.2401,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "price": "500 $"
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

## 4. CATEGORIES

### Get All Categories
**GET** `/product/categories`
**No auth required**

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name_uz": "Elektronika",
      "name_ru": "���ݬ֬ܬ���߬ڬܬ�",
      "parent_id": null,
      "sort_order": 1,
      "product_count": 150
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

### Get Categories Tree
**GET** `/product/categories/tree`
**No auth required**

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name_uz": "Elektronika",
      "name_ru": "���ݬ֬ܬ���߬ڬܬ�",
      "sort_order": 1,
      "product_count": 150,
      "subcategories": [
        {
          "id": 10,
          "name_uz": "Telefonlar",
          "name_ru": "���֬ݬ֬��߬�",
          "sort_order": 1,
          "product_count": 50,
          "subcategories": []
        }
      ]
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

### Get Category by ID
**GET** `/product/categories/{categoryId}`
**No auth required**

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name_uz": "Elektronika",
    "name_ru": "���ݬ֬ܬ���߬ڬܬ�",
    "parent_id": null,
    "sort_order": 1,
    "product_count": 150
  },
  "errors": [],
  "status_code": 200
}
```

---

### Get Products by Category
**GET** `/product/categories/{categoryId}/products?user_lat=41.2995&user_long=69.2401&current_page=1&page_size=20`
**No auth required**

Same response as "Get All Products"

---

### Get Subcategories
**GET** `/product/categories/{parentId}/subcategories`
**No auth required**

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 10,
      "name_uz": "Telefonlar",
      "name_ru": "���֬ݬ֬��߬�",
      "parent_id": 1,
      "sort_order": 1,
      "product_count": 50
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

## 5. CHAT

### Get My Chats
**GET** `/chats/my-chats?page=1&pageSize=20`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "chat_room_id": 1,
        "product_id": 10,
        "product_title": "iPhone 13",
        "product_image_url": "https://...",
        "other_user_id": 456,
        "other_user_name": "Jane Doe",
        "other_user_image": "https://...",
        "last_message": "Hello!",
        "last_message_time": "2024-01-01T12:00:00Z",
        "unread_count": 3,
        "is_seller": false
      }
    ],
    "total_count": 10,
    "current_page": 1,
    "page_size": 20
  },
  "errors": [],
  "status_code": 200
}
```

---

### Create or Get Chat Room
**POST** `/chats/create-or-get`
**Requires:** Authorization header

**Request:**
```json
{
  "seller_id": 456,
  "product_id": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chat_room_id": 1,
    "buyer_id": 123,
    "seller_id": 456,
    "product_id": 10,
    "product": {
      "id": 10,
      "title": "iPhone 13",
      "main_image_url": "https://...",
      "price": "500 $"
    },
    "buyer_info": {
      "id": 123,
      "username": "john_doe",
      "profile_image_url": "https://..."
    },
    "seller_info": {
      "id": 456,
      "username": "jane_doe",
      "profile_image_url": "https://..."
    },
    "created_at": "2024-01-01T12:00:00Z"
  },
  "errors": [],
  "status_code": 200
}
```

---

### Get Chat Messages
**GET** `/chats/{chatRoomId}/messages?page=1&pageSize=50`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "chat_room_id": 1,
        "sender_id": 123,
        "message_type": 1,
        "text_content": "Hello!",
        "image_url": null,
        "file_url": null,
        "is_read": true,
        "sent_at": "2024-01-01T12:00:00Z"
      }
    ],
    "total_count": 100,
    "current_page": 1,
    "page_size": 50
  },
  "errors": [],
  "status_code": 200
}
```

---

### Get Unread Count
**GET** `/chats/unread-count`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "data": {
    "unread_count": 5
  },
  "errors": [],
  "status_code": 200
}
```

---

### Mark Messages as Read
**POST** `/chats/mark-as-read`
**Requires:** Authorization header

**Request:**
```json
{
  "chat_room_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {},
  "errors": [],
  "status_code": 200
}
```

---

### Get User Online Status
**GET** `/chats/user-status/{userId}`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "lastSeenAt": "2024-01-01T12:00:00Z"
  },
  "errors": [],
  "status_code": 200
}
```

---

## 6. COMPLAINTS

### Create Complaint
**POST** `/complaint/create`
**Requires:** Authorization header

**Request:**
```json
{
  "reported_user_id": 456,
  "reported_product_id": 10,
  "complaint_type": 1000,
  "description": "This is spam"
}
```

**Complaint Types:**
- 1000: Spam
- 1010: Inappropriate
- 1020: Fraud
- 1030: Other

**Response:**
```json
{
  "success": true,
  "message": "Complaint submitted successfully. Our team will review it.",
  "data": {
    "complaint_id": 1
  },
  "errors": [],
  "status_code": 200
}
```

---

### Get My Complaints
**GET** `/complaint/my-complaints?page=1&pageSize=20`
**Requires:** Authorization header

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "reporter_user_id": 123,
      "reported_user_id": 456,
      "reported_product_id": 10,
      "complaint_type": {
        "value": 1000,
        "name": "spam",
        "description": "Spam"
      },
      "description": "This is spam",
      "status": "pending",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

### Get Complaint Types
**GET** `/complaint/types`
**No auth required**

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "value": 1000,
      "name": "spam",
      "display_name": "Spam"
    },
    {
      "value": 1010,
      "name": "inappropriate",
      "display_name": "Inappropriate"
    },
    {
      "value": 1020,
      "name": "fraud",
      "display_name": "Fraud"
    },
    {
      "value": 1030,
      "name": "other",
      "display_name": "Other"
    }
  ],
  "errors": [],
  "status_code": 200
}
```

---

## 7. SignalR (Real-time Chat)

### Connection
**Hub URL:** `/chathub`

**Connection with JWT:**
```typescript
const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5000/chathub", {
    accessTokenFactory: () => getToken()
  })
  .build();

await connection.start();
```

---

### Send Message
**Method:** `SendMessage`

**Parameters:**
```typescript
{
  chatRoomId: number;
  textContent: string;
  messageType: 1; // 1=Text, 2=Image, 3=File
}
```

**Server Response (to all participants):**
```typescript
connection.on("ReceiveMessage", (message) => {
  // message structure:
  {
    id: number;
    chat_room_id: number;
    sender_id: number;
    message_type: number;
    text_content: string;
    image_url: string | null;
    file_url: string | null;
    is_read: boolean;
    sent_at: string;
  }
});
```

---

### Typing Indicator
**Method:** `SendTypingIndicator`

**Parameters:**
```typescript
{
  chatRoomId: number;
  isTyping: boolean;
}
```

**Server Response (to other user):**
```typescript
connection.on("UserTyping", (data) => {
  // data structure:
  {
    user_id: number;
    chat_room_id: number;
    is_typing: boolean;
  }
});
```

---

### Mark as Read
**Method:** `MarkAsRead`

**Parameters:**
```typescript
{
  chatRoomId: number;
}
```

**Server Response (to sender):**
```typescript
connection.on("MessagesRead", (data) => {
  // data structure:
  {
    chat_room_id: number;
    reader_user_id: number;
    read_at: string;
  }
});
```

---

### User Status Changed
**Server Event:**
```typescript
connection.on("UserStatusChanged", (data) => {
  // data structure:
  {
    user_id: number;
    is_online: boolean;
    last_seen_at: string;
  }
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": null,
  "data": null,
  "errors": ["Validation error message"],
  "status_code": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": null,
  "data": null,
  "errors": ["Unauthorized user."],
  "status_code": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": null,
  "data": null,
  "errors": ["You do not have permission."],
  "status_code": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": null,
  "data": null,
  "errors": ["Resource not found"],
  "status_code": 404
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": null,
  "data": null,
  "errors": ["An error occurred. Please try again later."],
  "status_code": 500
}
```

---

## Notes

- All endpoints requiring authentication must include the JWT token in the Authorization header: `Bearer <token>`
- Tokens are returned in response headers (`X-Access-Token`, `X-Expires-At`) after successful login
- File uploads use `multipart/form-data` content type
- Geo-location (latitude, longitude) is required for product-related endpoints
- Draft images must be uploaded before creating a product
- SignalR connection automatically handles reconnection
