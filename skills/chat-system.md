# SKILL: Real-Time Chat System (React Native + .NET 8 + SignalR)

---

## 🎯 Purpose

Build a **production-grade real-time chat system** with:

* REST API (history, chat list)
* SignalR WebSocket (real-time)
* Zustand (client state)
* React Query (server sync)

---

## 🧱 ARCHITECTURE

Frontend:

UI (ChatScreen)
↓
Hooks (useChatRoom, useSendMessage)
↓
State (Zustand)
↓
Services:

* REST API
* SignalR Service
  ↓
  Backend (.NET SignalR Hub + Controllers)

---

## 📦 OUTPUT

* Chat list screen
* Chat detail screen
* Real-time messaging
* Typing indicator
* Read receipts
* Online status

---

# 🔁 CORE CHAT FLOW (STRICT ORDER)

## 1. Create or Get Chat

POST `/chats/create-or-get`

✔ Returns:

* chat_room_id

---

## 2. Connect SignalR

```ts
connection = new HubConnectionBuilder()
  .withUrl("/hubs/chat", {
    accessTokenFactory: () => token
  })
  .withAutomaticReconnect()
  .build()
```

---

## 3. Join Chat Room

```ts
connection.invoke("JoinChatRoom", chatRoomId)
```

---

## 4. Load Message History

GET `/chats/{chatRoomId}/messages`

---

## 5. Start Real-time Flow

* SendMessage
* ReceiveMessage
* Typing
* Read receipts

---

# 🧠 STATE DESIGN (ZUSTAND)

## Store Structure

```ts
type ChatStore = {
  chatList: ChatRoom[]
  messages: Record<number, ChatMessage[]>
  typingUsers: Record<number, boolean>
  onlineUsers: Record<number, boolean>

  setMessages(chatRoomId, messages)
  addMessage(chatRoomId, message)
  markAsRead(chatRoomId, messageIds)
}
```

---

## Rules

* Messages grouped by chatRoomId
* Avoid global array
* Always normalize data

---

# ⚡ SIGNALR SERVICE LAYER

## Responsibilities

* Connect / reconnect
* Join / leave rooms
* Send events
* Listen events

---

## Events (MUST HANDLE)

```ts
ReceiveMessage
UserTyping
MessagesRead
UserStatusChanged
Error
```

---

## Critical Logic

### On ReceiveMessage

```ts
if (!message.is_mine) {
  addMessage(chatRoomId, message)

  connection.invoke("MarkMessagesAsRead", {
    chat_room_id: chatRoomId,
    message_ids: [message.id]
  })
}
```

---

### Typing Indicator

* StartTyping on input
* StopTyping after 3s idle

---

# 📲 UI LOGIC (CHAT SCREEN)

## On Screen Open

1. Connect SignalR
2. Join room
3. Fetch messages
4. Set active chat

---

## On Screen Close

* LeaveChatRoom
* Clear typing state

---

## Message Sending Flow

```ts
1. Add optimistic message
2. Send via SignalR
3. Replace with real message
4. Handle failure
```

---

# 🚀 OPTIMISTIC UI (IMPORTANT)

## Add message immediately

```ts
addMessage({
  localId,
  content,
  isPending: true
})
```

## On success

* replace localId with server message

## On failure

* mark as failed
* allow retry

---

# 📡 ONLINE STATUS SYSTEM

## API

GET `/chats/user-status/{userId}`

## SignalR Event

UserStatusChanged

---

## Store

```ts
onlineUsers[userId] = true/false
```

---

# 👁️ READ RECEIPTS

## Flow

1. Message visible
2. Send:

```ts
MarkMessagesAsRead
```

3. Update UI

---

# ⚠️ ERROR HANDLING

## Cases

* Message too long
* Connection lost
* Unauthorized
* Chat not found

## Strategy

* Retry send
* Queue messages offline
* Show UI error

---

# 🔄 RECONNECTION STRATEGY

## MUST IMPLEMENT

```ts
withAutomaticReconnect([0, 2000, 5000, 10000])
```

## On reconnect

* rejoin rooms
* sync messages

---

# 🧪 PERFORMANCE RULES

* Load last 50 messages
* Paginate older messages
* Use FlatList
* Memoize message items

---

# 🔐 SECURITY

* Always pass JWT
* Validate message length
* Prevent self-chat

---

# 🧩 HOOK DESIGN

## Required Hooks

* useSignalRConnection
* useChatRoom(chatRoomId)
* useSendMessage(chatRoomId)
* useTypingIndicator(chatRoomId)
* useUserOnlineStatus(userId)

---

# 🔀 DECISION LOGIC

IF user opens chat → join room
IF user types → send typing event
IF message received → update store
IF offline → queue messages

---

# ✅ QUALITY CHECK

* No duplicate messages
* No memory leak
* Fast UI
* Stable reconnect

---

# 🚀 EXAMPLE PROMPTS

* "Implement full chat screen using this skill"
* "Create Zustand store for chat system"
* "Build SignalR service layer"

---

# 🔥 NEXT IMPROVEMENTS

* Message reactions
* Voice messages
* Image compression
* Push notifications
