# SKILL: Notification + Real-Time System (React Native + .NET 8 + SignalR + Push)

---

## 🎯 Purpose

Build a complete real-time notification system:

* Instant chat updates (SignalR)
* Push notifications (background)
* Badge count system
* Smart event-based alerts

---

## 📦 OUTPUT

* In-app real-time updates
* Push notifications (Firebase / Expo)
* Notification badge system
* Background message handling

---

# 🧱 SYSTEM ARCHITECTURE

Frontend:

UI (NotificationBadge / Screens)
↓
Hooks (useNotifications)
↓
State (Zustand)
↓
Services:

* SignalR Service
* Push Notification Service
  ↓
  Backend (.NET SignalR + Notification Service)

---

# ⚡ 1. REAL-TIME EVENTS (SignalR)

## Events to Handle

```ts id="qsn2qa"
ReceiveMessage
UserStatusChanged
MessagesRead
UserTyping
```

✔ Source: chat system 

---

## Rule

SignalR = foreground updates only

---

## Example

```ts id="9tqwef"
connection.on("ReceiveMessage", (message) => {
  addMessage(message)

  if (!isChatOpen) {
    incrementUnread()
  }
})
```

---

# 🔔 2. PUSH NOTIFICATIONS (BACKGROUND)

## Why Needed?

SignalR works only when app is open

Push works when:

* App closed
* App in background

---

## Tech Options

* Expo Notifications (easy)
* Firebase Cloud Messaging (advanced)

---

## Flow

1. Device registers
2. Get push token
3. Send token to backend
4. Backend sends push

---

## Frontend Setup (Expo)

```bash id="q1dr0x"
expo install expo-notifications
```

---

## Get Device Token

```ts id="p3q4dx"
const token = await Notifications.getExpoPushTokenAsync()
```

---

## Send to Backend

POST `/user/push-token`

---

# 📡 3. NOTIFICATION TYPES

## MUST SUPPORT

1. Chat message
2. New product nearby
3. Product liked
4. System alerts

---

## Example Payload

```json id="t7m3r8"
{
  "type": "chat",
  "chat_room_id": 1,
  "title": "New message",
  "body": "Hello!"
}
```

---

# 🧠 4. STATE MANAGEMENT (ZUSTAND)

```ts id="r29wme"
type NotificationStore = {
  unreadCount: number
  notifications: Notification[]

  increment()
  reset()
  addNotification()
}
```

---

# 🔢 5. BADGE SYSTEM

## Sources

* Chat unread count API
* Push notifications

✔ API:
GET `/chats/unread-count` 

---

## Rules

* Sync on app open
* Update on message receive

---

# 🔁 6. SYNC STRATEGY

## On App Start

```ts id="2r1rkm"
1. Fetch unread count
2. Sync notifications
3. Connect SignalR
```

---

## On Push Receive

```ts id="0ovc4b"
if (app in background) {
  show notification
}
```

---

# 📲 7. HANDLING USER ACTION

## When user clicks notification

```ts id="sz7rq2"
if (type === "chat") {
  navigate("ChatScreen", { chatRoomId })
}
```

---

# 🔄 8. REAL-TIME + PUSH TOGETHER

## Strategy

| State      | System Used |
| ---------- | ----------- |
| App open   | SignalR     |
| Background | Push        |
| Closed     | Push        |

---

# ⚠️ IMPORTANT RULE

NEVER rely only on SignalR

---

# 🧪 ERROR HANDLING

* Push token expired
* Notification not delivered
* Duplicate notifications

---

# 🔀 DECISION LOGIC

IF app open → use SignalR
IF app closed → use push
IF user inactive → send reminder

---

# 🛡️ SECURITY

* Validate notification payload
* Protect user data
* Avoid spam notifications

---

# 🧪 TESTING CHECKLIST

* Foreground message
* Background push
* Click navigation
* Badge updates
* Offline handling

---

# ✅ QUALITY CRITERIA

* Instant delivery (<1s)
* No duplicate notifications
* Correct navigation
* Accurate badge count

---

# ♻️ REUSABILITY

* Separate push service
* Separate SignalR service
* Central notification handler

---

# 🧩 HOOK DESIGN

## useNotifications()

* register device
* handle push
* manage state

---

## useBadge()

* sync unread count

---

# 🚀 EXAMPLE PROMPTS

* "Implement push notification system"
* "Create notification badge with Zustand"
* "Handle notification click navigation"

---

# 🔥 NEXT IMPROVEMENTS

* Scheduled notifications
* AI-based recommendations
* Notification preferences
* Silent notifications
