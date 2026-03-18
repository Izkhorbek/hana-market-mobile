# SKILL: Hana Market Mobile System (React Native + .NET 8 + SignalR)

---

## 🎯 Purpose

Build a scalable, real-time marketplace mobile app (Carrot Market style) with:

* React Native (Expo)
* .NET 8 Web API
* SignalR (real-time chat & notifications)
* JWT Authentication + Phone Verification
* Location-based product system

---

## 📦 Output

Each feature MUST produce:

* Mobile UI screen (React Native)
* API integration (REST + SignalR if needed)
* Zustand + React Query integration
* Error + loading states
* Secure JWT-based communication

---

## 🧭 CORE SYSTEM MODULES

1. Authentication (JWT + Phone)
2. Product & Location Feed
3. Chat System (REST + SignalR)
4. Notifications (real-time)
5. Map Integration (Google Maps)
6. Profile & Settings

---

# 🔐 1. AUTHENTICATION FLOW (PHONE + JWT)

## Steps

1. User enters phone number
2. Backend validates / sends OTP
3. User logs in → receives JWT in headers
4. Store token securely

✔ API reference:

* POST `/auth/login` 

## Frontend Rules

* Store token in SecureStore
* Attach token to all requests
* Handle token expiration

## Decision Logic

IF token expired → logout + refresh
IF user blocked → show block screen

---

# 📍 2. LOCATION-BASED FEED

## Flow

1. Get device GPS
2. Send location to backend
3. Fetch products with filters

✔ API:

* GET `/product/all?user_lat&user_long` 

## UI

* Infinite scroll list
* Distance display (km)
* Filters (price, category)

## Rules

* Cache results (React Query)
* Refetch on location change

---

# 🗺️ 3. GOOGLE MAP PRODUCT VIEW

## Flow

1. Load products with coordinates
2. Render markers on map
3. Tap marker → open product

## Rules

* Cluster markers (performance)
* Lazy load data

---

# 💬 4. CHAT SYSTEM (CRITICAL MODULE)

## Architecture

Hybrid:

* REST → history
* SignalR → real-time

✔ Based on your system:

* create-or-get → start chat
* join room → SignalR
* send/receive → WebSocket 

---

## Chat Workflow (MANDATORY ORDER)

1. User clicks "Chat"
2. Call:
   POST `/chats/create-or-get`
3. Receive `chat_room_id`
4. Connect SignalR (JWT)
5. Join room:
   `JoinChatRoom(chatRoomId)`
6. Fetch messages:
   GET `/chats/{id}/messages`
7. Real-time messaging starts

---

## SignalR Setup (Frontend)

* Auto reconnect
* Handle events:

  * ReceiveMessage
  * UserTyping
  * MessagesRead

✔ Docs: 

---

## Chat State Management

Use Zustand:

* chatList
* messages
* typingUsers
* onlineUsers

---

## Critical Rules

* Always join room on screen open
* Leave room on screen exit
* Mark messages as read
* Handle offline mode

---

# 🔔 5. REAL-TIME NOTIFICATIONS

## Strategy

Use SignalR or Push Notifications

## Events

* New message
* Product liked
* New chat

## Rules

* Show badge count
* Sync unread count:
  GET `/chats/unread-count`

---

# 👤 6. PROFILE & SETTINGS

## Features

* Update user info
* Upload image
* Change location

✔ APIs:

* GET `/user/get`
* POST `/user/update`
* POST `/user/update/location` 

---

# 🧠 STATE MANAGEMENT STRATEGY

## Use

* Zustand → global state
* React Query → server state

## Pattern

* UI → hooks → service → API

---

# 🔀 DECISION ENGINE

IF feature needs real-time → SignalR
IF static data → REST
IF location-based → require GPS
IF heavy UI → lazy load

---

# 🛡️ SECURITY RULES

* Always send JWT
* Validate inputs
* Handle 401 / 403
* Do NOT store token in AsyncStorage (use secure storage)

---

# 🧪 TESTING CHECKLIST

* API success & error
* Network failure
* Real-time reconnect
* Edge cases (empty data)

---

# ✅ QUALITY CRITERIA

* No UI lag
* Real-time < 1 sec delay
* Clean architecture
* Reusable components

---

# ♻️ REUSABILITY RULES

* Separate:

  * UI
  * Logic
  * API
* Create hooks:

  * useChat
  * useAuth
  * useProducts

---

# 🚀 EXAMPLE PROMPTS

1. "Implement chat screen using SignalR and Zustand"
2. "Create location-based product feed"
3. "Add Google Map with product markers"
4. "Build authentication with phone + JWT"

---

<!-- # 🔥 NEXT SKILLS TO CREATE

* Payment system (Payme / Click)
* Recommendation algorithm
* Admin panel
* Moderation system -->
