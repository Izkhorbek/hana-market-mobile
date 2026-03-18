import { HubConnectionState } from '@microsoft/signalr'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useAuthStore } from '@/modules/Auth/auth-store'
import { ChatMessage, TypingUser, useChatStore } from '@/modules/Chat/chat-store'

// Stable empty array references to prevent infinite re-renders
const EMPTY_MESSAGES: ChatMessage[] = []
const EMPTY_TYPING_USERS: TypingUser[] = []

/**
 * Hook to manage SignalR connection lifecycle
 * Automatically connects when user is authenticated and disconnects on logout
 */
export function useSignalRConnection() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)
  const connectionState = useChatStore((s) => s.connectionState)
  const isConnecting = useChatStore((s) => s.isConnecting)

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      // Don't disconnect on unmount if still authenticated
    }
  }, [isAuthenticated, connect, disconnect])

  return {
    connectionState,
    isConnecting,
    isConnected: connectionState === HubConnectionState.Connected,
    isReconnecting: connectionState === HubConnectionState.Reconnecting,
    isDisconnected: connectionState === HubConnectionState.Disconnected,
  }
}

/**
 * Hook for managing a specific chat room
 * Handles joining/leaving room and real-time updates
 */
export function useChatRoom(chatRoomId: number | null) {
  const joinChatRoom = useChatStore((s) => s.joinChatRoom)
  const leaveChatRoom = useChatStore((s) => s.leaveChatRoom)
  const setActiveChatRoom = useChatStore((s) => s.setActiveChatRoom)
  const messages = useChatStore((s) => (chatRoomId ? s.messages[chatRoomId] ?? EMPTY_MESSAGES : EMPTY_MESSAGES))
  const messagesLoading = useChatStore((s) => (chatRoomId ? s.messagesLoading[chatRoomId] : false))
  const typingUsers = useChatStore((s) => (chatRoomId ? s.typingUsers[chatRoomId] ?? EMPTY_TYPING_USERS : EMPTY_TYPING_USERS))
  const connectionState = useChatStore((s) => s.connectionState)
  const markAsRead = useChatStore((s) => s.markAsRead)

  // Track joined room to prevent re-joining
  const joinedRoomRef = useRef<number | null>(null)
  const markedAsReadRef = useRef<number | null>(null)

  useEffect(() => {
    if (chatRoomId && connectionState === HubConnectionState.Connected && joinedRoomRef.current !== chatRoomId) {
      joinedRoomRef.current = chatRoomId
      joinChatRoom(chatRoomId)
      setActiveChatRoom(chatRoomId)

      return () => {
        joinedRoomRef.current = null
        leaveChatRoom(chatRoomId)
        setActiveChatRoom(null)
      }
    }
  }, [chatRoomId, connectionState, joinChatRoom, leaveChatRoom, setActiveChatRoom])

  // Mark as read when entering the chat room (only once)
  useEffect(() => {
    if (chatRoomId && connectionState === HubConnectionState.Connected && markedAsReadRef.current !== chatRoomId) {
      markedAsReadRef.current = chatRoomId
      markAsRead(chatRoomId)
    }
  }, [chatRoomId, connectionState, markAsRead])

  return {
    messages,
    messagesLoading,
    typingUsers,
    isConnected: connectionState === HubConnectionState.Connected,
  }
}

/**
 * Hook for sending messages with typing indicator support
 */
export function useSendMessage(chatRoomId: number | null) {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const sendImageMessage = useChatStore((s) => s.sendImageMessage)
  const startTyping = useChatStore((s) => s.startTyping)
  const stopTyping = useChatStore((s) => s.stopTyping)
  const connectionState = useChatStore((s) => s.connectionState)

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!chatRoomId || connectionState !== HubConnectionState.Connected) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      startTyping(chatRoomId)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (chatRoomId && isTypingRef.current) {
        isTypingRef.current = false
        stopTyping(chatRoomId)
      }
    }, 2000)
  }, [chatRoomId, connectionState, startTyping, stopTyping])

  // Send text message
  const send = useCallback(
    async (text: string) => {
      if (!chatRoomId || !text.trim()) return

      // Stop typing indicator
      if (isTypingRef.current) {
        isTypingRef.current = false
        stopTyping(chatRoomId)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      await sendMessage(chatRoomId, text.trim(), 'text')
    },
    [chatRoomId, sendMessage, stopTyping]
  )

  // Send image message
  const sendImage = useCallback(
    async (imageUrl: string) => {
      if (!chatRoomId || !imageUrl) return
      await sendImageMessage(chatRoomId, imageUrl)
    },
    [chatRoomId, sendImageMessage]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (chatRoomId && isTypingRef.current) {
        stopTyping(chatRoomId)
      }
    }
  }, [chatRoomId, stopTyping])

  return {
    send,
    sendImage,
    handleTyping,
    isConnected: connectionState === HubConnectionState.Connected,
  }
}

/**
 * Hook to get online status of a specific user
 */
// Stable offline status reference
const OFFLINE_STATUS = { isOnline: false, lastSeenAt: null } as const

export function useUserOnlineStatus(userId: number | null) {
  const status = useChatStore((s) => (userId ? s.onlineUsers[userId] : null))
  
  // Return stable reference when offline
  if (!userId || !status) {
    return OFFLINE_STATUS
  }

  // Return stable reference for online status (memoized by Zustand selector)
  return {
    isOnline: status.isOnline,
    lastSeenAt: status.lastSeenAt,
  } as const
}

/**
 * Hook to get typing users in a chat room (excluding current user)
 */
const NO_TYPING = { isTyping: false, typingUserIds: [] as number[], typingCount: 0 } as const

export function useTypingIndicator(chatRoomId: number | null) {
  const typingUsers = useChatStore((s) => (chatRoomId ? s.typingUsers[chatRoomId] ?? EMPTY_TYPING_USERS : EMPTY_TYPING_USERS))
  const currentUserId = useAuthStore((s) => s.user?.id)

  // Use useMemo to prevent creating new objects on every render
  return useMemo(() => {
    // If no typing users, return stable reference
    if (typingUsers.length === 0) {
      return NO_TYPING
    }

    // Filter out current user
    const otherTypingUsers = typingUsers.filter((t) => t.userId !== currentUserId)

    if (otherTypingUsers.length === 0) {
      return NO_TYPING
    }

    return {
      isTyping: true,
      typingUserIds: otherTypingUsers.map((t) => t.userId),
      typingCount: otherTypingUsers.length,
    }
  }, [typingUsers, currentUserId])
}

/**
 * Hook to get unread message count
 */
export function useUnreadCount() {
  const unreadCount = useChatStore((s) => s.unreadCount)
  const setUnreadCount = useChatStore((s) => s.setUnreadCount)

  return {
    unreadCount,
    setUnreadCount,
  }
}

/**
 * Hook to get chat list with real-time updates
 */
export function useChatList() {
  const chatList = useChatStore((s) => s.chatList)
  const setChatList = useChatStore((s) => s.setChatList)
  const chatListLoading = useChatStore((s) => s.chatListLoading)
  const setChatListLoading = useChatStore((s) => s.setChatListLoading)

  return {
    chatList,
    setChatList,
    chatListLoading,
    setChatListLoading,
  }
}
