import { HubConnectionState } from '@microsoft/signalr'
import { create } from 'zustand'
import { MessageTypeString } from './../../constants/appLimits'
import { logger } from '@/utils/logger'

import { queryClient } from '@/api/queryClient'
import {
  ChatRoomCreatedPayload,
  ChatRoomDeletedPayload,
  MessageDeletedPayload,
  ReceiveMessagePayload,
  signalRService,
  UserStatusPayload,
  UserTypingPayload,
} from '@/api/services/signalr.service'
import { useAuthStore } from '@/modules/Auth/auth-store'
import type { ChatMessageDto, ChatRoomDto } from '@/types'
import { typingTimeoutManager } from './typing-timeout-manager'

// Rooms whose unread state we have locally cleared (via markAsRead). The
// server may not flush this immediately, so when the next REST refetch of
// MY_CHATS lands we must NOT let stale unread_count > 0 overwrite the local
// 0. We hold the room-id here for a short window and clear when we see the
// server agree (unread_count === 0) on a refresh.
const locallyReadRooms = new Set<number>()

// Convert API message type string to numeric type for storage
const messageTypeToNumber = (type: MessageTypeString): number => {
  switch (type) {
    case 'image':
      return 1010
    case 'file':
      return 1020
    default:
      return 1000 // 'text'
  }
}

// ── Types ──
export interface ChatMessage extends ChatMessageDto {
  // Additional client-side properties
  isPending?: boolean;
  isFailed?: boolean;
  localId?: string;
}

export interface OnlineUser {
  userId: number;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface TypingUser {
  chatRoomId: number;
  userId: number;
  isTyping: boolean;
  timestamp: number;
}

interface ChatState {
  // Connection state
  connectionState: HubConnectionState;
  isConnecting: boolean;

  // Chat list
  chatList: ChatRoomDto[];
  chatListLoading: boolean;
  unreadCount: number;

  // Last room that was removed via a SignalR ChatRoomDeleted event. The
  // active chat screen watches this to decide whether to navigate away
  // when the room it is showing has just been deleted by the other party.
  // Consumers should clear it (via setLastRemovedChatRoomId(null)) once
  // handled to avoid re-triggering.
  lastRemovedChatRoomId: number | null;

  // Active chat room
  activeChatRoomId: number | null;
  messages: Record<number, ChatMessage[]>; // chatRoomId -> messages
  messagesLoading: Record<number, boolean>;

  // Online status
  onlineUsers: Record<number, OnlineUser>; // userId -> status

  // Typing indicators
  typingUsers: Record<number, TypingUser[]>; // chatRoomId -> typing users

  // Actions - Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setConnectionState: (state: HubConnectionState) => void;

  // Actions - Chat List
  setChatList: (chats: ChatRoomDto[]) => void;
  updateChatListItem: (
    chatRoomId: number,
    updates: Partial<ChatRoomDto>,
  ) => void;
  removeChatRoom: (chatRoomId: number) => void;
  setChatListLoading: (loading: boolean) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;

  // Actions - Messages
  setActiveChatRoom: (chatRoomId: number | null) => void;
  setMessages: (chatRoomId: number, messages: ChatMessage[]) => void;
  addMessage: (chatRoomId: number, message: ChatMessage) => void;
  updateMessage: (
    chatRoomId: number,
    messageId: number,
    updates: Partial<ChatMessage>,
  ) => void;
  removeMessage: (chatRoomId: number, messageId: number) => void;
  markMessageAsRead: (chatRoomId: number, messageId: number) => void;
  markAllMessagesAsRead: (chatRoomId: number) => void;
  setMessagesLoading: (chatRoomId: number, loading: boolean) => void;

  // Actions - Send Message
  sendMessage: (
    chatRoomId: number,
    text: string,
    messageType?: MessageTypeString,
  ) => Promise<void>;
  sendImageMessage: (chatRoomId: number, imageUrl: string) => Promise<void>;

  // Actions - Online Status
  setUserOnlineStatus: (userId: number, status: OnlineUser) => void;

  // Actions - Typing
  setUserTyping: (
    chatRoomId: number,
    userId: number,
    isTyping: boolean,
  ) => void;
  startTyping: (chatRoomId: number) => Promise<void>;
  stopTyping: (chatRoomId: number) => Promise<void>;
  clearTypingTimeout: (chatRoomId: number, userId: number) => void;

  // Actions - Chat Room
  joinChatRoom: (chatRoomId: number) => Promise<void>;
  leaveChatRoom: (chatRoomId: number) => Promise<void>;
  ensureJoined: (chatRoomId: number) => Promise<void>;
  markAsRead: (chatRoomId: number) => Promise<void>;

  // Actions - Reset (for logout)
  reset: () => void;

  // Actions - signal consumed
  setLastRemovedChatRoomId: (chatRoomId: number | null) => void;

  // Internal - Event handlers
  _handleReceiveMessage: (payload: ReceiveMessagePayload) => void;
  _handleUserStatusChanged: (payload: UserStatusPayload) => void;
  _handleUserTyping: (payload: UserTypingPayload) => void;
  _handleMessagesRead: (chatRoomId: number, readerId: number) => void;
  _handleChatRoomCreated: (payload: ChatRoomCreatedPayload) => void;
  _handleMessageDeleted: (payload: MessageDeletedPayload) => void;
  _handleChatRoomDeleted: (payload: ChatRoomDeletedPayload) => void;
  _setupEventListeners: () => void;
}

// Typing timeout in milliseconds (clear typing indicator after this time)
const TYPING_TIMEOUT = 3000

// Track event listener cleanup function (outside store to persist across re-renders)
let eventListenersCleanup: (() => void) | null = null

// Track in-flight connect & join promises so concurrent callers share them.
let connectPromise: Promise<void> | null = null
const joinPromises = new Map<number, Promise<void>>()
const joinedRooms = new Set<number>()

// Monotonic counter ensures unique localIds even when multiple sends happen
// in the same millisecond.
let localIdCounter = 0
const createLocalId = (): string => {
  localIdCounter = (localIdCounter + 1) % Number.MAX_SAFE_INTEGER
  return `temp_${Date.now()}_${localIdCounter}`
}

// ── Store ──
export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  connectionState: HubConnectionState.Disconnected,
  isConnecting: false,
  chatList: [],
  chatListLoading: false,
  unreadCount: 0,
  lastRemovedChatRoomId: null,
  activeChatRoomId: null,
  messages: {},
  messagesLoading: {},
  onlineUsers: {},
  typingUsers: {},

  // Connection Actions
  connect: async () => {
    const state = get()
    if (state.connectionState === HubConnectionState.Connected) {
      return
    }

    // Reuse the in-flight connect promise so concurrent callers wait for the
    // SAME negotiation rather than racing it.
    if (connectPromise) {
      return connectPromise
    }

    set({ isConnecting: true })

    connectPromise = (async () => {
      try {
        // Setup event listeners before connecting (only if not already set up)
        get()._setupEventListeners()
        await signalRService.connect()
        set({
          connectionState: HubConnectionState.Connected,
          isConnecting: false,
        })
      } catch (error) {
        logger.error('CHAT_CONNECT_FAILED', error)
        set({ isConnecting: false })
      }
    })().finally(() => {
      connectPromise = null
    })

    return connectPromise
  },

  disconnect: async () => {
    // Clean up event listeners before disconnecting
    if (eventListenersCleanup) {
      console.log('[ChatStore] Cleaning up event listeners on disconnect')
      eventListenersCleanup()
      eventListenersCleanup = null
    }

    joinedRooms.clear()
    joinPromises.clear()

    await signalRService.disconnect()
    set({ connectionState: HubConnectionState.Disconnected })
  },

  setConnectionState: (state) => set({ connectionState: state }),

  // Chat List Actions
  setChatList: (chats) => {
    // Seed onlineUsers from chat list metadata so presence is available even
    // before the first SignalR UserStatusChanged event fires.
    const myId = useAuthStore.getState().user?.id
    set((state) => {
      const onlineUsers = { ...state.onlineUsers }
      const merged: ChatRoomDto[] = chats.map((incoming) => {
        const otherUser =
          myId && incoming.buyer.id === myId
            ? incoming.seller
            : incoming.buyer
        if (otherUser?.id) {
          const existing = onlineUsers[otherUser.id]
          // Only seed if we don't already have a fresher status from SignalR
          if (!existing) {
            const rawLastSeen = incoming.other_user_last_seen
            const lastSeenStr =
              rawLastSeen instanceof Date
                ? rawLastSeen.toISOString()
                : (rawLastSeen ?? null)
            onlineUsers[otherUser.id] = {
              userId: otherUser.id,
              isOnline:
                incoming.is_other_user_online ?? otherUser.is_online ?? false,
              lastSeenAt: lastSeenStr,
            }
          }
        }

        // Preserve locally-cleared unread_count so a stale REST refetch can't
        // resurrect a 'read' room as unread.
        if (locallyReadRooms.has(incoming.id)) {
          if ((incoming.unread_count ?? 0) === 0) {
            // Server agrees — release the lock
            locallyReadRooms.delete(incoming.id)
            return incoming
          }
          return { ...incoming, unread_count: 0 }
        }
        return incoming
      })

      // Recompute global unread from the merged list (source of truth).
      const totalUnread = merged.reduce(
        (sum, c) => sum + (c.unread_count || 0),
        0,
      )

      return {
        chatList: merged,
        onlineUsers,
        unreadCount: totalUnread,
      }
    })
  },

  updateChatListItem: (chatRoomId, updates) => {
    set((state) => ({
      chatList: state.chatList.map((chat) =>
        chat.id === chatRoomId ? { ...chat, ...updates } : chat,
      ),
    }))
  },

  // Remove a chat room from local state in one shot: drop it from the list,
  // recompute the global unread total, and clear cached messages/typing for
  // it. Used by both the REST delete mutation flow and the realtime
  // ChatRoomDeleted event handler.
  removeChatRoom: (chatRoomId) => {
    set((state) => {
      const removed = state.chatList.find((c) => c.id === chatRoomId)
      const nextChatList = state.chatList.filter((c) => c.id !== chatRoomId)
      const removedUnread = removed?.unread_count ?? 0
      const { [chatRoomId]: _removedMessages, ...restMessages } = state.messages
      const { [chatRoomId]: _removedLoading, ...restLoading } =
        state.messagesLoading
      const { [chatRoomId]: _removedTyping, ...restTyping } = state.typingUsers
      return {
        chatList: nextChatList,
        unreadCount: Math.max(0, state.unreadCount - removedUnread),
        messages: restMessages,
        messagesLoading: restLoading,
        typingUsers: restTyping,
        activeChatRoomId:
          state.activeChatRoomId === chatRoomId
            ? null
            : state.activeChatRoomId,
      }
    })
    locallyReadRooms.delete(chatRoomId)
    joinedRooms.delete(chatRoomId)
    joinPromises.delete(chatRoomId)
  },

  setChatListLoading: (loading) => set({ chatListLoading: loading }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: (amount = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),

  // Message Actions
  setActiveChatRoom: (chatRoomId) => set({ activeChatRoomId: chatRoomId }),

  setMessages: (chatRoomId, messages) =>
    set(
      (state) => (
        {
          messages: { ...state.messages, [chatRoomId]: messages },
        }
      ),
    ),

  addMessage: (chatRoomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomId]: [...(state.messages[chatRoomId] || []), message],
      },
    })),

  updateMessage: (chatRoomId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg,
        ),
      },
    })),

  removeMessage: (chatRoomId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomId]: (state.messages[chatRoomId] || []).filter(
          (msg) => msg.id !== messageId,
        ),
      },
    })),

  markMessageAsRead: (chatRoomId, messageId) => {
    get().updateMessage(chatRoomId, messageId, { is_read: true })
  },

  markAllMessagesAsRead: (chatRoomId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) => ({
          ...msg,
          is_read: true,
        })),
      },
    })),

  setMessagesLoading: (chatRoomId, loading) =>
    set((state) => ({
      messagesLoading: { ...state.messagesLoading, [chatRoomId]: loading },
    })),

  // Send Message
  sendMessage: async (
    chatRoomId,
    text,
    messageType: MessageTypeString = 'text',
  ) => {
    const localId = createLocalId()
    const currentUserId = useAuthStore.getState().user?.id ?? 0

    const tempMessage: ChatMessage = {
      id: -1,
      chat_room_id: chatRoomId,
      sender_id: currentUserId,
      content: text,
      message_type: messageTypeToNumber(messageType),
      sender_name: null,
      sender_image_url: null,
      sent_at: new Date().toISOString(),
      isPending: true,
      localId,
      is_read: false,
      is_mine: true,
    }

    // Optimistically add message
    get().addMessage(chatRoomId, tempMessage)

    try {
      // Make sure we are joined to the room group BEFORE sending, otherwise
      // the server-side broadcast may fan out before we are a group member
      // and we never receive our own echo (message looks like it never sent).
      await get().ensureJoined(chatRoomId)
      await signalRService.sendMessage(chatRoomId, text, messageType)
      // Mark as sent (not pending) - the temp message will be replaced when
      // ReceiveMessage arrives. Don't remove the temp message here to avoid flicker.
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
            msg.localId === localId ? { ...msg, isPending: false } : msg,
          ),
        },
      }))
    } catch (error) {
      console.error('[ChatStore] Failed to send message:', error)
      logger.error('CHAT_SEND_MESSAGE_FAILED', error)
      // Mark message as failed
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
            msg.localId === localId
              ? { ...msg, isPending: false, isFailed: true }
              : msg,
          ),
        },
      }))
      throw error
    }
  },

  sendImageMessage: async (chatRoomId, imageUrl) => {
    const localId = createLocalId()
    const currentUserId = useAuthStore.getState().user?.id ?? 0
    const tempMessage: ChatMessage = {
      id: -1,
      chat_room_id: chatRoomId,
      sender_id: currentUserId,
      sender_name: null,
      sender_image_url: null,
      message_type: messageTypeToNumber('image'),
      is_read: false,
      sent_at: new Date().toISOString(),
      isPending: true,
      localId,
      content: '', // Text content is empty for image messages
      is_mine: true,
    }

    get().addMessage(chatRoomId, tempMessage)

    try {
      await get().ensureJoined(chatRoomId)
      await signalRService.sendMessage(chatRoomId, '', 'image', imageUrl)
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
            msg.localId === localId ? { ...msg, isPending: false } : msg,
          ),
        },
      }))
    } catch (error) {
      console.error('[ChatStore] Failed to send image:', error)
      logger.error('CHAT_SEND_IMAGE_FAILED', error)
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
            msg.localId === localId
              ? { ...msg, isPending: false, isFailed: true }
              : msg,
          ),
        },
      }))
      throw error
    }
  },

  // Online Status
  setUserOnlineStatus: (userId, status) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: status },
    })),

  // Typing Actions
  setUserTyping: (chatRoomId, userId, isTyping) => {
    set((state) => {
      const roomTyping = state.typingUsers[chatRoomId] || []

      if (isTyping) {
        // Add or update typing user
        const existingIndex = roomTyping.findIndex((t) => t.userId === userId)
        const typingUser: TypingUser = {
          chatRoomId,
          userId,
          isTyping: true,
          timestamp: Date.now(),
        }

        const newRoomTyping =
          existingIndex >= 0
            ? roomTyping.map((t, i) => (i === existingIndex ? typingUser : t))
            : [...roomTyping, typingUser]

        // Use manager to set timeout with proper cleanup
        typingTimeoutManager.setTypingTimeout(
          chatRoomId,
          userId,
          () => {
            get().clearTypingTimeout(chatRoomId, userId)
          },
          TYPING_TIMEOUT,
        )

        return {
          typingUsers: { ...state.typingUsers, [chatRoomId]: newRoomTyping },
        }
      } else {
        // Clear the timeout when user stops typing
        typingTimeoutManager.clearTypingTimeout(chatRoomId, userId)

        // Remove typing user
        return {
          typingUsers: {
            ...state.typingUsers,
            [chatRoomId]: roomTyping.filter((t) => t.userId !== userId),
          },
        }
      }
    })
  },

  startTyping: async (chatRoomId) => {
    try {
      await signalRService.startTyping(chatRoomId)
    } catch (error) {
      console.error('[ChatStore] Failed to start typing:', error)
    }
  },

  stopTyping: async (chatRoomId) => {
    try {
      await signalRService.stopTyping(chatRoomId)
    } catch (error) {
      console.error('[ChatStore] Failed to stop typing:', error)
    }
  },

  clearTypingTimeout: (chatRoomId, userId) => {
    // Clear from the timeout manager
    typingTimeoutManager.clearTypingTimeout(chatRoomId, userId)

    // Remove from state
    set((state) => {
      const roomTyping = state.typingUsers[chatRoomId] || []
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatRoomId]: roomTyping.filter((t) => t.userId !== userId),
        },
      }
    })
  },

  // Chat Room Actions
  joinChatRoom: async (chatRoomId) => {
    return get().ensureJoined(chatRoomId)
  },

  ensureJoined: async (chatRoomId) => {
    if (joinedRooms.has(chatRoomId)) return

    const existing = joinPromises.get(chatRoomId)
    if (existing) return existing

    const promise = (async () => {
      try {
        // Make sure socket is up first; ensureJoined may be called from
        // sendMessage before useChatRoom's join effect has run.
        await get().connect()
        console.log('[ChatStore] Joining chat room:', chatRoomId)
        await signalRService.joinChatRoom(chatRoomId)
        joinedRooms.add(chatRoomId)
        console.log('[ChatStore] Successfully joined chat room:', chatRoomId)
      } catch (error) {
        console.error('[ChatStore] Failed to join chat room:', error)
        logger.warn(error, { code: 'CHAT_JOIN_FAILED' })
        throw error
      } finally {
        joinPromises.delete(chatRoomId)
      }
    })()

    joinPromises.set(chatRoomId, promise)
    return promise
  },

  leaveChatRoom: async (chatRoomId) => {
    try {
      console.log('[ChatStore] Leaving chat room:', chatRoomId)
      joinedRooms.delete(chatRoomId)
      joinPromises.delete(chatRoomId)
      if (signalRService.isConnected()) {
        await signalRService.leaveChatRoom(chatRoomId)
      }
      if (get().activeChatRoomId === chatRoomId) {
        set({ activeChatRoomId: null })
      }
      console.log('[ChatStore] Successfully left chat room:', chatRoomId)
    } catch (error) {
      console.error('[ChatStore] Failed to leave chat room:', error)
      logger.warn(error, { code: 'CHAT_LEAVE_FAILED' })
    }
  },

  markAsRead: async (chatRoomId) => {
    if (!chatRoomId || chatRoomId <= 0) return

    // Only call the hub when there is actually something to mark. This avoids
    // hitting the server for brand-new rooms or rooms where every incoming
    // message is already read — the backend currently throws "Failed to mark
    // messages as read" in those cases.
    const chat = get().chatList.find((c) => c.id === chatRoomId)
    const messagesInRoom = get().messages[chatRoomId] || []
    const hasUnreadIncoming = messagesInRoom.some(
      (msg) => !msg.is_mine && !msg.is_read && msg.id > 0,
    )
    const hasChatListUnread = !!chat && chat.unread_count > 0

    // Always remember locally so concurrent REST refetches can't resurrect
    // unread state, even if there is nothing to mark right now.
    locallyReadRooms.add(chatRoomId)

    if (!hasUnreadIncoming && !hasChatListUnread) {
      return
    }

    try {
      // Backend marks ALL unread messages addressed to the caller in this room.
      // We no longer send message_ids.
      await signalRService.markMessagesAsRead(chatRoomId)
    } catch (error) {
      // Server-side rejection is non-fatal for the UX — we still flip locally.
      console.warn(
        '[ChatStore] markMessagesAsRead hub call failed (ignored):',
        error,
      )
    }

    // Locally flip ONLY incoming messages to is_read=true. Never touch our
    // own messages here — those should only become "read" when the OTHER
    // user reads them, which is delivered via the MessagesRead event.
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
          msg.is_mine ? msg : { ...msg, is_read: true },
        ),
      },
    }))

    // Update unread count in chat list
    if (chat && chat.unread_count > 0) {
      get().decrementUnreadCount(chat.unread_count)
      get().updateChatListItem(chatRoomId, { unread_count: 0 })
    }

    // Invalidate REST caches so the next refetch returns fresh data and any
    // observer (chat list page, header badge) re-syncs from the server.
    try {
      queryClient.invalidateQueries({ queryKey: ['UNREAD_COUNT'] })
      queryClient.invalidateQueries({ queryKey: ['MY_CHATS'] })
    } catch (e) {
      // queryClient is a singleton; failures here are non-fatal.
      console.warn('[ChatStore] invalidateQueries failed:', e)
    }
  },

  // Reset store (for logout)
  reset: () => {
    console.log('[ChatStore] Resetting store state')

    // Clean up event listeners
    if (eventListenersCleanup) {
      eventListenersCleanup()
      eventListenersCleanup = null
    }

    // Clear all typing timeouts to prevent memory leaks
    typingTimeoutManager.clearAll()

    joinedRooms.clear()
    joinPromises.clear()
    connectPromise = null

    // Disconnect SignalR
    signalRService.disconnect()

    locallyReadRooms.clear()

    // Reset state to initial values
    set({
      connectionState: HubConnectionState.Disconnected,
      isConnecting: false,
      chatList: [],
      chatListLoading: false,
      unreadCount: 0,
      lastRemovedChatRoomId: null,
      activeChatRoomId: null,
      messages: {},
      messagesLoading: {},
      onlineUsers: {},
      typingUsers: {},
    })

    console.log('[ChatStore] Store reset complete')
  },

  setLastRemovedChatRoomId: (chatRoomId) =>
    set({ lastRemovedChatRoomId: chatRoomId }),

  // Event Handlers (using API snake_case format)
  _handleReceiveMessage: (payload) => {
    // Extract message and chat_room from wrapped payload (backend format)
    const messageData = payload.message
    const chatRoomData = payload.chat_room

    if (!messageData) {
      logger.warn('Invalid SignalR message payload', {
        code: 'CHAT_INVALID_PAYLOAD',
        extra: { payloadKeys: Object.keys(payload ?? {}) },
      })
      return
    }

    // Get current user ID to determine is_mine locally (don't trust backend's is_mine in broadcast)
    const currentUserId = useAuthStore.getState().user?.id
    const isMine = currentUserId
      ? messageData.sender_id === currentUserId
      : messageData.is_mine

    // Transform API payload to local message format
    const message: ChatMessage = {
      id: messageData.id,
      chat_room_id: messageData.chat_room_id,
      sender_id: messageData.sender_id,
      sender_name: messageData.sender_name,
      content: messageData.content,
      sender_image_url: messageData.sender_image_url || null,
      message_type: messageTypeToNumber(messageData.type || 'text'),
      is_read: messageData.is_read,
      sent_at: messageData.sent_at,
      is_mine: isMine, // Use locally computed is_mine
    }

    const chatRoomId = messageData.chat_room_id

    // Check if this is our own sent message (replace temp message instead of
    // adding a duplicate). Match the OLDEST pending temp message of the same
    // type with matching content. We avoid relying solely on content equality
    // for non-pending messages — once a temp is consumed it must not be
    // re-matched by a later echo (which previously caused stuck "pending"
    // bubbles when the same text was sent twice).
    const existingMessages = get().messages[chatRoomId] || []
    let tempMessageIndex = -1
    if (isMine) {
      tempMessageIndex = existingMessages.findIndex(
        (msg) =>
          !!msg.localId &&
          msg.id < 0 &&
          msg.is_mine &&
          msg.message_type === message.message_type &&
          msg.content === message.content,
      )
    }

    if (tempMessageIndex !== -1) {
      // Replace temp message with real message from server
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: state.messages[chatRoomId].map((msg, idx) =>
            idx === tempMessageIndex ? message : msg,
          ),
        },
      }))
    } else {
      // Add new message from other user (or own message without a matching temp)
      get().addMessage(chatRoomId, message)
    }

    // Update chat list with chat_room data if available
    const chatList = get().chatList
    const existingChat = chatList.find((c) => c.id === chatRoomId)

    if (existingChat) {
      // Calculate new unread count
      let newUnreadCount = existingChat.unread_count

      // Only increment unread if:
      // 1. Not in the active chat room
      // 2. Message is from another user (not our own)
      if (get().activeChatRoomId !== chatRoomId && !isMine) {
        newUnreadCount = existingChat.unread_count + 1
      }

      get().updateChatListItem(chatRoomId, {
        last_message:
          messageData.content ||
          (messageData.type === 'image' ? '📷 Image' : '📎 File'),
        last_message_at: messageData.sent_at,
        unread_count: newUnreadCount,
        // Update other user online status from chat_room data if available
        ...(chatRoomData && {
          is_other_user_online: chatRoomData.is_other_user_online,
          other_user_last_seen: chatRoomData.other_user_last_seen,
        }),
      })
    } else if (chatRoomData) {
      // New chat room - add it to the list
      get().setChatList([chatRoomData, ...chatList])
    }

    // Update global unread count if not in active chat
    if (get().activeChatRoomId !== chatRoomId && !isMine) {
      get().incrementUnreadCount()
    }

    // Auto-mark as read if this is an incoming, unread message and chat room
    // is currently open. Route through the defensive store.markAsRead so we
    // don't hammer the server when there's nothing to mark.
    if (
      get().activeChatRoomId === chatRoomId &&
      !isMine &&
      messageData.id > 0 &&
      messageData.is_read !== true
    ) {
      get().markAsRead(chatRoomId)
    }

    // Keep REST caches in sync with realtime stream so any screen reading
    // MY_CHATS / UNREAD_COUNT (e.g. tab badge, chat list page) sees the
    // updated counts even if its own component isn't subscribed to SignalR.
    if (!isMine && get().activeChatRoomId !== chatRoomId) {
      try {
        queryClient.invalidateQueries({ queryKey: ['UNREAD_COUNT'] })
        queryClient.invalidateQueries({ queryKey: ['MY_CHATS'] })
      } catch (e) {
        console.warn('[ChatStore] invalidateQueries on receive failed:', e)
      }
    }
  },

  _handleUserStatusChanged: (payload) => {
    get().setUserOnlineStatus(payload.user_id, {
      userId: payload.user_id,
      isOnline: payload.is_online,
      lastSeenAt: payload.last_seen_at,
    })
  },

  _handleUserTyping: (payload) => {
    get().setUserTyping(
      payload.chat_room_id,
      payload.user_id,
      payload.is_typing,
    )
  },

  _handleMessagesRead: (chatRoomId, readerId) => {
    // Mark all sent messages as read
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) => {
          // Only mark messages sent by current user as read
          if (msg.sender_id !== readerId) {
            return { ...msg, is_read: true }
          }
          return msg
        }),
      },
    }))
  },

  // Backend broadcasts ChatRoomCreated when a chat room becomes visible to
  // us (typically the other user just started the conversation). Payload
  // may be either a bare ChatRoomDto or { chat_room: ... }.
  _handleChatRoomCreated: (payload) => {
    const room: ChatRoomDto | undefined =
      payload && typeof payload === 'object' && 'chat_room' in payload
        ? (payload as { chat_room: ChatRoomDto }).chat_room
        : (payload as ChatRoomDto | undefined)

    if (!room || typeof room.id !== 'number') {
      logger.warn('Invalid ChatRoomCreated payload', {
        code: 'CHAT_INVALID_CHATROOM_CREATED',
        extra: { payloadKeys: Object.keys((payload as object) ?? {}) },
      })
      return
    }

    const existing = get().chatList.find((c) => c.id === room.id)
    if (existing) {
      // Already known — merge metadata only.
      get().updateChatListItem(room.id, room)
    } else {
      // Prepend so newest conversation appears at the top.
      get().setChatList([room, ...get().chatList])
    }

    // Reconcile any cached lists/badges.
    try {
      queryClient.invalidateQueries({ queryKey: ['MY_CHATS'] })
      queryClient.invalidateQueries({ queryKey: ['UNREAD_COUNT'] })
    } catch (e) {
      console.warn('[ChatStore] invalidate on ChatRoomCreated failed:', e)
    }
  },

  // Backend broadcasts MessageDeleted when either party soft- or hard-
  // deletes a single message. Remove it from local state and invalidate
  // the message page cache so an open chat re-syncs cleanly.
  _handleMessageDeleted: (payload) => {
    if (
      !payload ||
      typeof payload.chat_room_id !== 'number' ||
      typeof payload.message_id !== 'number'
    ) {
      logger.warn('Invalid MessageDeleted payload', {
        code: 'CHAT_INVALID_MESSAGE_DELETED',
        extra: { payload },
      })
      return
    }

    const { chat_room_id, message_id } = payload
    get().removeMessage(chat_room_id, message_id)

    // Refresh chat list preview if the removed message was the last one.
    const room = get().chatList.find((c) => c.id === chat_room_id)
    const remaining = get().messages[chat_room_id] || []
    const lastVisible = remaining[remaining.length - 1]
    if (room) {
      get().updateChatListItem(chat_room_id, {
        last_message: lastVisible?.content ?? room.last_message ?? '',
        last_message_at:
          lastVisible?.sent_at ?? room.last_message_at ?? room.created_at,
      })
    }

    try {
      queryClient.invalidateQueries({
        queryKey: ['CHAT_MESSAGES_INFINITE', chat_room_id],
      })
      queryClient.invalidateQueries({ queryKey: ['MY_CHATS'] })
    } catch (e) {
      console.warn('[ChatStore] invalidate on MessageDeleted failed:', e)
    }
  },

  // Backend broadcasts ChatRoomDeleted when the room is removed (soft- or
  // hard-). Drop local state and signal the active screen so it can
  // navigate away if it was showing this room.
  _handleChatRoomDeleted: (payload) => {
    if (!payload || typeof payload.chat_room_id !== 'number') {
      logger.warn('Invalid ChatRoomDeleted payload', {
        code: 'CHAT_INVALID_CHATROOM_DELETED',
        extra: { payload },
      })
      return
    }

    const { chat_room_id } = payload
    const wasActive = get().activeChatRoomId === chat_room_id

    // Best-effort: leave the SignalR group server-side, ignore failures.
    if (joinedRooms.has(chat_room_id) && signalRService.isConnected()) {
      signalRService.leaveChatRoom(chat_room_id).catch(() => {})
    }

    get().removeChatRoom(chat_room_id)

    if (wasActive) {
      // Screen will see this, navigate back, then clear the signal.
      set({ lastRemovedChatRoomId: chat_room_id })
    }

    try {
      queryClient.invalidateQueries({ queryKey: ['MY_CHATS'] })
      queryClient.invalidateQueries({ queryKey: ['UNREAD_COUNT'] })
      queryClient.removeQueries({
        queryKey: ['CHAT_MESSAGES_INFINITE', chat_room_id],
      })
      queryClient.removeQueries({ queryKey: ['MY_CHAT', chat_room_id] })
    } catch (e) {
      console.warn('[ChatStore] invalidate on ChatRoomDeleted failed:', e)
    }
  },

  _setupEventListeners: () => {
    // Clean up existing listeners first to prevent duplicates
    if (eventListenersCleanup) {
      console.log(
        '[ChatStore] Cleaning up existing event listeners before re-setup',
      )
      eventListenersCleanup()
      eventListenersCleanup = null
    }

    // Also clear SignalR service listeners to ensure clean state
    signalRService.clearAllListeners()

    console.log('[ChatStore] Setting up event listeners')
    const unsubscribes: (() => void)[] = []

    // Connection state changes
    unsubscribes.push(
      signalRService.onConnectionStateChange((state) => {
        get().setConnectionState(state)
      }),
    )

    // Receive message
    unsubscribes.push(
      signalRService.onReceiveMessage((payload) => {
        get()._handleReceiveMessage(payload)
      }),
    )

    // User status changed
    unsubscribes.push(
      signalRService.onUserStatusChanged((payload) => {
        get()._handleUserStatusChanged(payload)
      }),
    )

    // User typing
    unsubscribes.push(
      signalRService.onUserTyping((payload) => {
        get()._handleUserTyping(payload)
      }),
    )

    // Messages read
    unsubscribes.push(
      signalRService.onMessagesRead((payload) => {
        get()._handleMessagesRead(
          payload.chat_room_id,
          payload.read_by_user_id,
        )
      }),
    )

    // Error events
    unsubscribes.push(
      signalRService.onError((error) => {
        // Server-side errors are not fatal client-side. Use warn so React Native's
        // LogBox doesn't surface them as a blocking "Console Error" overlay.
        console.warn('[ChatStore] SignalR Error:', error?.code, error?.message)
      }),
    )

    // ChatRoomCreated
    unsubscribes.push(
      signalRService.onChatRoomCreated((payload) => {
        get()._handleChatRoomCreated(payload)
      }),
    )

    // MessageDeleted
    unsubscribes.push(
      signalRService.onMessageDeleted((payload) => {
        get()._handleMessageDeleted(payload)
      }),
    )

    // ChatRoomDeleted
    unsubscribes.push(
      signalRService.onChatRoomDeleted((payload) => {
        get()._handleChatRoomDeleted(payload)
      }),
    )

    // Store cleanup function for later use
    eventListenersCleanup = () => {
      console.log('[ChatStore] Cleaning up event listeners')
      unsubscribes.forEach((unsub) => unsub())
    }

    console.log('[ChatStore] Event listeners set up successfully')
  },
}))
