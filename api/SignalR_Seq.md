

## 📋 Chat jarayoni to'liq tahlili

### 1️⃣ **Ikkita user chat qilishi uchun bajarilayotgan ishlar (Ketma-ketlik)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAT JARAYONI DIAGRAMMASI                     │
└─────────────────────────────────────────────────────────────────┘

[Sotuvchi]                                          [Xaridor]
    │                                                    │
    │  1. Mahsulot yaratadi                              │
    │        ↓                                           │
    │  ┌──────────────┐                                  │
    │  │ Product Page │ ←────── 2. Mahsulotni ko'radi ───┤
    │  └──────────────┘                                  │
    │                                                    │
    │                    3. "Chat" tugmasini bosadi ─────┤
    │                              ↓                     │
    │                    ┌─────────────────────┐         │
    │                    │ createOrGetChat API │         │
    │                    │   POST /chats/      │         │
    │                    │   create-or-get     │         │
    │                    └─────────────────────┘         │
    │                              ↓                     │
    │                    ┌─────────────────────┐         │
    │                    │  ChatRoomDto qaytadi │        │
    │                    │  (chat_room_id)      │        │
    │                    └─────────────────────┘         │
    │                              ↓                     │
    │  4. ────── SignalR Connection ─────────────────────┤
    │         (JWT token bilan autentifikatsiya)         │
    │                              ↓                     │
    │  5. ────── JoinChatRoom(chatRoomId) ───────────────┤
    │                              ↓                     │
    │  ┌───────────────────────────────────────────────┐ │
    │  │         Real-time xabar almashish             │ │
    │  │  ┌─────────────────────────────────────────┐  │ │
    │  │  │ SendMessage → ReceiveMessage event      │  │ │
    │  │  │ StartTyping → UserTyping event          │  │ │
    │  │  │ MarkAsRead  → MessagesRead event        │  │ │
    │  │  └─────────────────────────────────────────┘  │ │
    │  └───────────────────────────────────────────────┘ │
    │                                                    │
    ▼                                                    ▼
```

**Batafsil ketma-ketlik:**

| # | Qadam | Tavsif |
|---|-------|--------|
| 1 | **Autentifikatsiya** | Ikkala user ham tizimga kirgan bo'lishi kerak (JWT token) |
| 2 | **Chat yaratish** | Xaridor mahsulot sahifasidan "Chat" tugmasini bosadi |
| 3 | **API chaqiriq** | `POST /api/chats/create-or-get` - yangi chat yaratadi yoki mavjudini qaytaradi |
| 4 | **SignalR ulanish** | WebSocket orqali real-time aloqa o'rnatiladi |
| 5 | **Xonaga qo'shilish** | `JoinChatRoom(chatRoomId)` - chat xonasiga ulanadi |
| 6 | **Xabar yuborish** | `SendMessage` - SignalR orqali xabar jo'natiladi |
| 7 | **Xabar qabul qilish** | `ReceiveMessage` eventi orqali real-time xabar keladi |
| 8 | **Typing indicator** | `StartTyping/StopTyping` - yozayotgan ko'rsatkich |
| 9 | **O'qildi belgisi** | `MarkMessagesAsRead` - xabar o'qilganini bildiradi |

---

### 2️⃣ **Ishlatilayotgan Endpointlar**

#### **REST API Endpoints:**

| Endpoint | Method | Tavsif |
|----------|--------|--------|
| `/api/chats/my-chats` | GET | Mening barcha chatlarim ro'yxati |
| `/api/chats/create-or-get` | POST | Chat yaratish yoki mavjudini olish |
| `/api/chats/{chatRoomId}/messages` | GET | Chat xabarlarini olish (pagination bilan) |
| `/api/chats/unread-count` | GET | O'qilmagan xabarlar soni |
| `/api/chats/mark-as-read` | POST | Xabarlarni o'qilgan deb belgilash |
| `/api/chats/user-status/{userId}` | GET | User online statusi |

#### **SignalR Hub Methods (Server ga chaqiriqlar):**

| Method | Tavsif |
|--------|--------|
| `JoinChatRoom(chatRoomId)` | Chat xonasiga qo'shilish |
| `LeaveChatRoom(chatRoomId)` | Chat xonasini tark etish |
| `SendMessage(request)` | Xabar yuborish |
| `MarkMessagesAsRead(request)` | Xabarlarni o'qilgan deb belgilash |
| `StartTyping(chatRoomId)` | Yozayotganini bildirish |
| `StopTyping(chatRoomId)` | Yozishni to'xtatganini bildirish |

#### **SignalR Events (Server dan keladigan eventlar):**

| Event | Tavsif |
|-------|--------|
| `ReceiveMessage` | Yangi xabar kelganda |
| `UserStatusChanged` | User online/offline bo'lganda |
| `UserTyping` | User yozayotganda |
| `MessagesRead` | Xabarlar o'qilganda |
| `Error` | Xatolik yuz berganda |

---

### 3️⃣ **`chat/[id].tsx` ga kirganda bajarilayotgan ishlar**

```typescript
// Ketma-ketlik:

1. useLocalSearchParams() → chatRoomId ni URL dan oladi
                  ↓
2. useSignalRConnection() → SignalR ulanishini ta'minlaydi
                  ↓
3. useChatRoom(chatRoomId) → Xonaga qo'shiladi, xabarlarni oladi
    ├── joinChatRoom(chatRoomId)
    ├── setActiveChatRoom(chatRoomId)
    └── markAsRead(chatRoomId)
                  ↓
4. useChatMessagesQuery() → API dan xabarlar tarixini oladi
    └── GET /api/chats/{chatRoomId}/messages
                  ↓
5. setMessages() → API xabarlarini Zustand store ga saqlaydi
                  ↓
6. useSendMessage() → Xabar yuborish funksiyasini tayyorlaydi
    ├── send(text) → Matn xabari
    ├── sendImage(url) → Rasm xabari
    └── handleTyping() → Typing indicator
                  ↓
7. useTypingIndicator() → Boshqa user yozayotganini kuzatadi
                  ↓
8. useUserOnlineStatus() → Boshqa user online ekanligini tekshiradi
                  ↓
9. UI Rendering → chatData, displayMessages, messageGroups
```

**Kod bo'yicha ketma-ketlik:**

```typescript
// 1. URL dan chat ID olish
const { id } = useLocalSearchParams<{ id?: string }>()
const chatRoomId = id ? parseInt(id, 10) : null

// 2. SignalR connection
const { isConnected: signalRConnected } = useSignalRConnection()

// 3. Store dan chat ma'lumotlari
const currentChat = useChatStore((s) => 
  chatRoomId ? s.chatList.find((c) => c.chat_room_id === chatRoomId) : null
)

// 4. Chat xonasiga qo'shilish va real-time xabarlar
const { messages: storeMessages, messagesLoading, isConnected } = useChatRoom(chatRoomId)

// 5. Xabar yuborish
const { send, handleTyping } = useSendMessage(chatRoomId)

// 6. Typing indicator
const { isTyping } = useTypingIndicator(chatRoomId)

// 7. Online status
const { isOnline } = useUserOnlineStatus(currentChat?.other_user_id ?? null)

// 8. API dan xabarlar (initial load)
const { data: messagesResponse } = useChatMessagesQuery({ chatRoomId: chatRoomId || 0 })

// 9. Display messages (store + API fallback)
const displayMessages = useMemo(() => {
  const sourceMessages = storeMessages.length > 0 ? storeMessages : apiMessages || []
  // ... transform to DisplayMessage
}, [storeMessages, apiMessages, currentUserId])
```

---

### 4️⃣ **Ishlatilayotgan Modellar va DTOlar**

#### **Request DTOs:**

| DTO | Maydonlar | Ishlatiladi |
|-----|-----------|-------------|
| `CreateChatRoomRequest` | `seller_id`, `product_id`, `initial_message?` | Chat yaratishda |
| `MarkAsReadRequest` | `chat_room_id`, `message_ids[]` | Xabarni o'qilgan qilishda |
| `SendMessageRequest` | `chat_room_id`, `content`, `type`, `attachmentUrl?` | Xabar yuborishda |
| `ChatListParams` | `page?`, `pageSize?` | Chat ro'yxati paginatsiya |
| `ChatMessagesParams` | `page?`, `pageSize?` | Xabarlar paginatsiya |

#### **Response DTOs:**

| DTO | Maydonlar | Tavsif |
|-----|-----------|--------|
| `ChatRoomDto` | `chat_room_id`, `buyer_id`, `seller_id`, `product_id`, `product`, `buyer_info`, `seller_info`, `created_at` | Chat xonasi ma'lumotlari |
| `ChatListItemDto` | `chat_room_id`, `product_id`, `product_title`, `other_user_id`, `other_user_name`, `last_message`, `unread_count`, `is_seller` | Chat ro'yxatidagi element |
| `ChatMessageDto` | `id`, `chat_room_id`, `sender_id`, `content`, `message_type`, `sent_at`, `is_read` | Xabar ma'lumotlari |
| `ChatUserInfoDto` | `id`, `username`, `profile_image_url`, `is_online`, `last_seen_at` | User chat ma'lumotlari |
| `ChatMessagesResponse` | `chat_room`, `messages[]`, `total_pages`, `current_page`, `has_more` | Xabarlar API javobi |
| `ChatListResponse` | `chats[]`, `total_count`, `current_page`, `has_more` | Chat ro'yxati API javobi |

#### **SignalR Event Payloads:**

| Payload | Maydonlar | Event |
|---------|-----------|-------|
| `ReceiveMessagePayload` | `id`, `chat_room_id`, `sender_id`, `content`, `type`, `sent_at`, `is_read` | `ReceiveMessage` |
| `UserStatusPayload` | `user_id`, `is_online`, `last_seen_at` | `UserStatusChanged` |
| `UserTypingPayload` | `chat_room_id`, `user_id`, `is_typing` | `UserTyping` |
| `MessagesReadPayload` | `chat_room_id`, `message_ids[]`, `read_by_user_id`, `read_at` | `MessagesRead` |

#### **Client-side Types:**

| Type | Ishlatiladi | Tavsif |
|------|-------------|--------|
| `ChatMessage` | Zustand store | `ChatMessageDto` + `isPending`, `isFailed`, `localId` |
| `DisplayMessage` | UI rendering | Transformatsiya qilingan xabar (`id`, `text`, `timestamp`, `isMe`, `status`) |
| `ChatData` | Header/ProductCard | UI uchun chat ma'lumotlari (`name`, `avatar`, `trustScore`, `isOnline`, `product`) |
| `OnlineUser` | Store | User online statusi |
| `TypingUser` | Store | Typing indicator ma'lumotlari |

---

### 📊 **Arxitektura diagrammasi:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  chat/[id]  │ →  │   Hooks      │ →  │  Zustand Store   │   │
│  │    .tsx     │    │  useSignalR  │    │  useChatStore    │   │
│  └─────────────┘    │  useChatRoom │    └──────────────────┘   │
│                     │  useSendMsg  │              ↑             │
│                     └──────────────┘              │             │
├─────────────────────────────────────────────────────────────────┤
│                     API Layer                                    │
│  ┌─────────────────────────┐   ┌──────────────────────────┐    │
│  │   REST API (Axios)      │   │  SignalR WebSocket       │    │
│  │   - chatService         │   │  - signalRService        │    │
│  │   - getChatMessages     │   │  - sendMessage           │    │
│  │   - createOrGetChat     │   │  - joinChatRoom          │    │
│  └─────────────────────────┘   └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (.NET)                              │
│  ┌───────────────────┐      ┌────────────────────────────┐     │
│  │  REST Controllers │      │  SignalR Hub (/hubs/chat)  │     │
│  │  /api/chats/*     │      │  - ReceiveMessage          │     │
│  └───────────────────┘      │  - UserStatusChanged       │     │
│                             │  - UserTyping              │     │
│                             └────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```