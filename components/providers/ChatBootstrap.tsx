import { useMyChatQuery, useUnreadCountQuery } from '@/api/hooks/useChat'
import { useSignalRConnection } from '@/api/hooks/useSignalR'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { useChatStore } from '@/modules/Chat/chat-store'
import React, { useEffect } from 'react'

/**
 * Mounts inside QueryClientProvider, lives for the lifetime of the app.
 *
 * Responsibilities:
 *   1. Keep a single SignalR connection open for the authenticated user so
 *      ReceiveMessage / UserStatusChanged / MessagesRead events are processed
 *      globally — even when the user is not on the chat tab.
 *   2. Fetch the chat list once after login so the store has chat metadata
 *      (incl. is_other_user_online seed) ready for any screen that opens.
 *   3. Mirror the REST unread count into the Zustand store so the bottom-tab
 *      badge can read it without making its own network request.
 */
export function ChatBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // 1) Global socket lifecycle (connect on auth, disconnect on logout).
  useSignalRConnection()

  // 2) Pre-fetch chat list so onlineUsers map is seeded app-wide.
  //    Hook internally gates on isAuthenticated.
  const { data: chatListResponse } = useMyChatQuery()
  const setChatList = useChatStore((s) => s.setChatList)

  useEffect(() => {
    const chats = chatListResponse?.data?.data?.chats
    if (Array.isArray(chats)) {
      setChatList(chats)
    }
  }, [chatListResponse, setChatList])

  // 3) Server-side unread count -> store mirror (poll every 30s, cf. hook).
  const { data: unreadResponse } = useUnreadCountQuery()
  const setUnreadCount = useChatStore((s) => s.setUnreadCount)

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    const total = unreadResponse?.data?.data?.total_unread
    if (typeof total === 'number') {
      setUnreadCount(total)
    }
  }, [isAuthenticated, unreadResponse, setUnreadCount])

  return null
}
