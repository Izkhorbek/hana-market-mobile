import { HubConnectionState } from '@microsoft/signalr';
import { create } from 'zustand';
import { MessageTypeString } from './../../constants/appLimits';
import { logger } from '@/utils/logger';

import {
  ReceiveMessagePayload,
  signalRService,
  UserStatusPayload,
  UserTypingPayload,
} from '@/api/services/signalr.service';
import { useAuthStore } from '@/modules/Auth/auth-store';
import type { ChatMessageDto, ChatRoomDto } from '@/types';
import { typingTimeoutManager } from './typing-timeout-manager';

// Convert API message type string to numeric type for storage
const messageTypeToNumber = (type: MessageTypeString): number => {
  switch (type) {
    case 'image':
      return 1010;
    case 'file':
      return 1020;
    default:
      return 1000; // 'text'
  }
};

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

  // Internal - Event handlers
  _handleReceiveMessage: (payload: ReceiveMessagePayload) => void;
  _handleUserStatusChanged: (payload: UserStatusPayload) => void;
  _handleUserTyping: (payload: UserTypingPayload) => void;
  _handleMessagesRead: (chatRoomId: number, readerId: number) => void;
  _setupEventListeners: () => void;
}

// Typing timeout in milliseconds (clear typing indicator after this time)
const TYPING_TIMEOUT = 3000;

// Track event listener cleanup function (outside store to persist across re-renders)
let eventListenersCleanup: (() => void) | null = null;

// Track in-flight connect & join promises so concurrent callers share them.
let connectPromise: Promise<void> | null = null;
const joinPromises = new Map<number, Promise<void>>();
const joinedRooms = new Set<number>();

// Monotonic counter ensures unique localIds even when multiple sends happen
// in the same millisecond.
let localIdCounter = 0;
const createLocalId = (): string => {
  localIdCounter = (localIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `temp_${Date.now()}_${localIdCounter}`;
};

// ── Store ──
export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  connectionState: HubConnectionState.Disconnected,
  isConnecting: false,
  chatList: [],
  chatListLoading: false,
  unreadCount: 0,
  activeChatRoomId: null,
  messages: {},
  messagesLoading: {},
  onlineUsers: {},
  typingUsers: {},

  // Connection Actions
  connect: async () => {
    const state = get();
    if (state.connectionState === HubConnectionState.Connected) {
      return;
    }

    // Reuse the in-flight connect promise so concurrent callers wait for the
    // SAME negotiation rather than racing it.
    if (connectPromise) {
      return connectPromise;
    }

    set({ isConnecting: true });

    connectPromise = (async () => {
      try {
        console.log('[ChatStore] Starting connection...');
        // Setup event listeners before connecting (only if not already set up)
        get()._setupEventListeners();
        await signalRService.connect();
        console.log('[ChatStore] Connection successful');
        set({
          connectionState: HubConnectionState.Connected,
          isConnecting: false,
        });
      } catch (error) {
        console.error('[ChatStore] Connection failed:', error);
        logger.error('CHAT_CONNECT_FAILED', error);
        set({ isConnecting: false });
        throw error;
      }
    })().finally(() => {
      connectPromise = null;
    });

    return connectPromise;
  },

  disconnect: async () => {
    // Clean up event listeners before disconnecting
    if (eventListenersCleanup) {
      console.log('[ChatStore] Cleaning up event listeners on disconnect');
      eventListenersCleanup();
      eventListenersCleanup = null;
    }

    joinedRooms.clear();
    joinPromises.clear();

    await signalRService.disconnect();
    set({ connectionState: HubConnectionState.Disconnected });
  },

  setConnectionState: (state) => set({ connectionState: state }),

  // Chat List Actions
  setChatList: (chats) => set({ chatList: chats }),

  updateChatListItem: (chatRoomId, updates) => {
    set((state) => ({
      chatList: state.chatList.map((chat) =>
        chat.id === chatRoomId ? { ...chat, ...updates } : chat,
      ),
    }));
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
        console.log(
          'Setting messages for chatRoomId:',
          chatRoomId,
          'with messages:',
          messages,
        ),
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

  markMessageAsRead: (chatRoomId, messageId) => {
    get().updateMessage(chatRoomId, messageId, { is_read: true });
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
    const localId = createLocalId();
    const currentUserId = useAuthStore.getState().user?.id ?? 0;

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
    };

    // Optimistically add message
    get().addMessage(chatRoomId, tempMessage);

    try {
      // Make sure we are joined to the room group BEFORE sending, otherwise
      // the server-side broadcast may fan out before we are a group member
      // and we never receive our own echo (message looks like it never sent).
      await get().ensureJoined(chatRoomId);
      await signalRService.sendMessage(chatRoomId, text, messageType);
      // Mark as sent (not pending) - the temp message will be replaced when
      // ReceiveMessage arrives. Don't remove the temp message here to avoid flicker.
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
            msg.localId === localId ? { ...msg, isPending: false } : msg,
          ),
        },
      }));
    } catch (error) {
      console.error('[ChatStore] Failed to send message:', error);
      logger.error('CHAT_SEND_MESSAGE_FAILED', error);
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
      }));
      throw error;
    }
  },

  sendImageMessage: async (chatRoomId, imageUrl) => {
    const localId = createLocalId();
    const currentUserId = useAuthStore.getState().user?.id ?? 0;
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
    };

    get().addMessage(chatRoomId, tempMessage);

    try {
      await get().ensureJoined(chatRoomId);
      await signalRService.sendMessage(chatRoomId, '', 'image', imageUrl);
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
            msg.localId === localId ? { ...msg, isPending: false } : msg,
          ),
        },
      }));
    } catch (error) {
      console.error('[ChatStore] Failed to send image:', error);
      logger.error('CHAT_SEND_IMAGE_FAILED', error);
      set((state) => ({
        messages: {
          ...state.messages,
          [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) =>
            msg.localId === localId
              ? { ...msg, isPending: false, isFailed: true }
              : msg,
          ),
        },
      }));
      throw error;
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
      const roomTyping = state.typingUsers[chatRoomId] || [];

      if (isTyping) {
        // Add or update typing user
        const existingIndex = roomTyping.findIndex((t) => t.userId === userId);
        const typingUser: TypingUser = {
          chatRoomId,
          userId,
          isTyping: true,
          timestamp: Date.now(),
        };

        const newRoomTyping =
          existingIndex >= 0
            ? roomTyping.map((t, i) => (i === existingIndex ? typingUser : t))
            : [...roomTyping, typingUser];

        // Use manager to set timeout with proper cleanup
        typingTimeoutManager.setTypingTimeout(
          chatRoomId,
          userId,
          () => {
            get().clearTypingTimeout(chatRoomId, userId);
          },
          TYPING_TIMEOUT,
        );

        return {
          typingUsers: { ...state.typingUsers, [chatRoomId]: newRoomTyping },
        };
      } else {
        // Clear the timeout when user stops typing
        typingTimeoutManager.clearTypingTimeout(chatRoomId, userId);

        // Remove typing user
        return {
          typingUsers: {
            ...state.typingUsers,
            [chatRoomId]: roomTyping.filter((t) => t.userId !== userId),
          },
        };
      }
    });
  },

  startTyping: async (chatRoomId) => {
    try {
      await signalRService.startTyping(chatRoomId);
    } catch (error) {
      console.error('[ChatStore] Failed to start typing:', error);
    }
  },

  stopTyping: async (chatRoomId) => {
    try {
      await signalRService.stopTyping(chatRoomId);
    } catch (error) {
      console.error('[ChatStore] Failed to stop typing:', error);
    }
  },

  clearTypingTimeout: (chatRoomId, userId) => {
    // Clear from the timeout manager
    typingTimeoutManager.clearTypingTimeout(chatRoomId, userId);

    // Remove from state
    set((state) => {
      const roomTyping = state.typingUsers[chatRoomId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatRoomId]: roomTyping.filter((t) => t.userId !== userId),
        },
      };
    });
  },

  // Chat Room Actions
  joinChatRoom: async (chatRoomId) => {
    return get().ensureJoined(chatRoomId);
  },

  ensureJoined: async (chatRoomId) => {
    if (joinedRooms.has(chatRoomId)) return;

    const existing = joinPromises.get(chatRoomId);
    if (existing) return existing;

    const promise = (async () => {
      try {
        // Make sure socket is up first; ensureJoined may be called from
        // sendMessage before useChatRoom's join effect has run.
        await get().connect();
        console.log('[ChatStore] Joining chat room:', chatRoomId);
        await signalRService.joinChatRoom(chatRoomId);
        joinedRooms.add(chatRoomId);
        console.log('[ChatStore] Successfully joined chat room:', chatRoomId);
      } catch (error) {
        console.error('[ChatStore] Failed to join chat room:', error);
        logger.warn(error, { code: 'CHAT_JOIN_FAILED' });
        throw error;
      } finally {
        joinPromises.delete(chatRoomId);
      }
    })();

    joinPromises.set(chatRoomId, promise);
    return promise;
  },

  leaveChatRoom: async (chatRoomId) => {
    try {
      console.log('[ChatStore] Leaving chat room:', chatRoomId);
      joinedRooms.delete(chatRoomId);
      joinPromises.delete(chatRoomId);
      if (signalRService.isConnected()) {
        await signalRService.leaveChatRoom(chatRoomId);
      }
      if (get().activeChatRoomId === chatRoomId) {
        set({ activeChatRoomId: null });
      }
      console.log('[ChatStore] Successfully left chat room:', chatRoomId);
    } catch (error) {
      console.error('[ChatStore] Failed to leave chat room:', error);
      logger.warn(error, { code: 'CHAT_LEAVE_FAILED' });
    }
  },

  markAsRead: async (chatRoomId) => {
    if (!chatRoomId || chatRoomId <= 0) return;

    // Only call the hub when there is actually something to mark. This avoids
    // hitting the server for brand-new rooms or rooms where every incoming
    // message is already read — the backend currently throws "Failed to mark
    // messages as read" in those cases.
    const chat = get().chatList.find((c) => c.id === chatRoomId);
    const messagesInRoom = get().messages[chatRoomId] || [];
    const hasUnreadIncoming = messagesInRoom.some(
      (msg) => !msg.is_mine && !msg.is_read && msg.id > 0,
    );
    const hasChatListUnread = !!chat && chat.unread_count > 0;

    if (!hasUnreadIncoming && !hasChatListUnread) {
      return;
    }

    try {
      // Backend marks ALL unread messages addressed to the caller in this room.
      // We no longer send message_ids.
      await signalRService.markMessagesAsRead(chatRoomId);
    } catch (error) {
      // Server-side rejection is non-fatal for the UX — we still flip locally.
      console.warn(
        '[ChatStore] markMessagesAsRead hub call failed (ignored):',
        error,
      );
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
    }));

    // Update unread count in chat list
    if (chat && chat.unread_count > 0) {
      get().decrementUnreadCount(chat.unread_count);
      get().updateChatListItem(chatRoomId, { unread_count: 0 });
    }
  },

  // Reset store (for logout)
  reset: () => {
    console.log('[ChatStore] Resetting store state');

    // Clean up event listeners
    if (eventListenersCleanup) {
      eventListenersCleanup();
      eventListenersCleanup = null;
    }

    // Clear all typing timeouts to prevent memory leaks
    typingTimeoutManager.clearAll();

    joinedRooms.clear();
    joinPromises.clear();
    connectPromise = null;

    // Disconnect SignalR
    signalRService.disconnect();

    // Reset state to initial values
    set({
      connectionState: HubConnectionState.Disconnected,
      isConnecting: false,
      chatList: [],
      chatListLoading: false,
      unreadCount: 0,
      activeChatRoomId: null,
      messages: {},
      messagesLoading: {},
      onlineUsers: {},
      typingUsers: {},
    });

    console.log('[ChatStore] Store reset complete');
  },

  // Event Handlers (using API snake_case format)
  _handleReceiveMessage: (payload) => {
    // Extract message and chat_room from wrapped payload (backend format)
    const messageData = payload.message;
    const chatRoomData = payload.chat_room;

    if (!messageData) {
      logger.warn('Invalid SignalR message payload', {
        code: 'CHAT_INVALID_PAYLOAD',
        extra: { payloadKeys: Object.keys(payload ?? {}) },
      });
      return;
    }

    // Get current user ID to determine is_mine locally (don't trust backend's is_mine in broadcast)
    const currentUserId = useAuthStore.getState().user?.id;
    const isMine = currentUserId
      ? messageData.sender_id === currentUserId
      : messageData.is_mine;

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
    };

    const chatRoomId = messageData.chat_room_id;

    // Check if this is our own sent message (replace temp message instead of
    // adding a duplicate). Match the OLDEST pending temp message of the same
    // type with matching content. We avoid relying solely on content equality
    // for non-pending messages — once a temp is consumed it must not be
    // re-matched by a later echo (which previously caused stuck "pending"
    // bubbles when the same text was sent twice).
    const existingMessages = get().messages[chatRoomId] || [];
    let tempMessageIndex = -1;
    if (isMine) {
      tempMessageIndex = existingMessages.findIndex(
        (msg) =>
          !!msg.localId &&
          msg.id < 0 &&
          msg.is_mine &&
          msg.message_type === message.message_type &&
          msg.content === message.content,
      );
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
      }));
    } else {
      // Add new message from other user (or own message without a matching temp)
      get().addMessage(chatRoomId, message);
    }

    // Update chat list with chat_room data if available
    const chatList = get().chatList;
    const existingChat = chatList.find((c) => c.id === chatRoomId);

    if (existingChat) {
      // Calculate new unread count
      let newUnreadCount = existingChat.unread_count;

      // Only increment unread if:
      // 1. Not in the active chat room
      // 2. Message is from another user (not our own)
      if (get().activeChatRoomId !== chatRoomId && !isMine) {
        newUnreadCount = existingChat.unread_count + 1;
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
      });
    } else if (chatRoomData) {
      // New chat room - add it to the list
      get().setChatList([chatRoomData, ...chatList]);
    }

    // Update global unread count if not in active chat
    if (get().activeChatRoomId !== chatRoomId && !isMine) {
      get().incrementUnreadCount();
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
      get().markAsRead(chatRoomId);
    }
  },

  _handleUserStatusChanged: (payload) => {
    get().setUserOnlineStatus(payload.user_id, {
      userId: payload.user_id,
      isOnline: payload.is_online,
      lastSeenAt: payload.last_seen_at,
    });
  },

  _handleUserTyping: (payload) => {
    get().setUserTyping(
      payload.chat_room_id,
      payload.user_id,
      payload.is_typing,
    );
  },

  _handleMessagesRead: (chatRoomId, readerId) => {
    // Mark all sent messages as read
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomId]: (state.messages[chatRoomId] || []).map((msg) => {
          // Only mark messages sent by current user as read
          if (msg.sender_id !== readerId) {
            return { ...msg, is_read: true };
          }
          return msg;
        }),
      },
    }));
  },

  _setupEventListeners: () => {
    // Clean up existing listeners first to prevent duplicates
    if (eventListenersCleanup) {
      console.log(
        '[ChatStore] Cleaning up existing event listeners before re-setup',
      );
      eventListenersCleanup();
      eventListenersCleanup = null;
    }

    // Also clear SignalR service listeners to ensure clean state
    signalRService.clearAllListeners();

    console.log('[ChatStore] Setting up event listeners');
    const unsubscribes: (() => void)[] = [];

    // Connection state changes
    unsubscribes.push(
      signalRService.onConnectionStateChange((state) => {
        get().setConnectionState(state);
      }),
    );

    // Receive message
    unsubscribes.push(
      signalRService.onReceiveMessage((payload) => {
        get()._handleReceiveMessage(payload);
      }),
    );

    // User status changed
    unsubscribes.push(
      signalRService.onUserStatusChanged((payload) => {
        get()._handleUserStatusChanged(payload);
      }),
    );

    // User typing
    unsubscribes.push(
      signalRService.onUserTyping((payload) => {
        get()._handleUserTyping(payload);
      }),
    );

    // Messages read
    unsubscribes.push(
      signalRService.onMessagesRead((payload) => {
        get()._handleMessagesRead(
          payload.chat_room_id,
          payload.read_by_user_id,
        );
      }),
    );

    // Error events
    unsubscribes.push(
      signalRService.onError((error) => {
        // Server-side errors are not fatal client-side. Use warn so React Native's
        // LogBox doesn't surface them as a blocking "Console Error" overlay.
        console.warn('[ChatStore] SignalR Error:', error?.code, error?.message);
      }),
    );

    // Store cleanup function for later use
    eventListenersCleanup = () => {
      console.log('[ChatStore] Cleaning up event listeners');
      unsubscribes.forEach((unsub) => unsub());
    };

    console.log('[ChatStore] Event listeners set up successfully');
  },
}));
