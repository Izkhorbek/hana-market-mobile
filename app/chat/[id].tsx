import {
  useChatMessagesInfiniteQuery,
  useChatRoom,
  useDeleteChatMessageMutation,
  useDeleteChatRoomMutation,
  useMarkAsReadMutation,
  useMyChatQuery,
  useSendMessage,
  useTypingIndicator,
  useUserOnlineStatus,
} from '@/api/hooks'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import RemoteImage from '@/components/shared/RemoteImage'
import { AppLimits } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { ChatMessage, useChatStore } from '@/modules/Chat/chat-store'
import {
  ApiResponse,
  ChatData,
  ChatMessageDto,
  ChatMessagesResponse,
  DisplayMessage,
} from '@/types'
import { parseBackendDateTime } from '@/utils/dateTime'
import { logger } from '@/utils/logger'
import { useQueryClient } from '@tanstack/react-query'
import { format, isToday, isYesterday } from 'date-fns'
import { router, useLocalSearchParams } from 'expo-router'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
} from 'lucide-react-native'
import { default as React, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

// Transform ChatMessage (from store) to DisplayMessage
const transformStoreMessage = (
  message: ChatMessage,
  currentUserId: number,
  index: number,
): DisplayMessage => ({
  id: String(message.id),
  localId: message.localId || `store_${index}_${message.id}`,
  text: message.content || '',
  timestamp: format(parseBackendDateTime(message.sent_at), 'h:mm a'),
  isMe: message.is_mine ? true : false,
  status: message.isPending ? 'pending' : message.is_read ? 'read' : 'sent',
  failed: message.isFailed,
  imageUrl: message.sender_image_url || undefined,
})

// Transform API ChatMessageDto to DisplayMessage
// const transformApiMessage = (
//   message: ChatMessageDto,
//   currentUserId: number,
//   index: number,
// ): DisplayMessage => ({
//   id: String(message.id),
//   localId: `api_${index}_${message.id}`,
//   text: message.content || '',
//   timestamp: format(parseBackendDateTime(message.sent_at), 'h:mm a'),
//   isMe: message.is_mine ? true : false,
//   status: message.is_read ? 'read' : 'sent',
//   imageUrl: message.sender_image_url || undefined,
// })

// Format date for date separator
const formatMessageDate = (dateString: string): string => {
  const date = parseBackendDateTime(dateString)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}

// Group messages by date
interface MessageGroup {
  date: string;
  messages: DisplayMessage[];
}

const groupMessagesByDate = (
  messages: DisplayMessage[],
  rawMessages: (ChatMessage | ChatMessageDto)[],
): MessageGroup[] => {
  const groups: { [key: string]: DisplayMessage[] } = {}

  messages.forEach((msg, index) => {
    const rawMsg = rawMessages[index]
    const dateKey = rawMsg ? formatMessageDate(rawMsg.sent_at) : 'Unknown'
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(msg)
  })

  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages,
  }))
}

// Components
const ChatHeader: React.FC<{
  chatData: ChatData;
  onBack: () => void;
  onCall: () => void;
  onMore: () => void;
  isTyping?: boolean;
}> = ({ chatData, onBack, onCall, onMore, isTyping }) => {
  const colors = useThemeColors()
  const { t } = useTranslations()

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.borderColor,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={styles.headerBackButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <View style={styles.headerNameRow}>
          <Text style={[styles.headerName, { color: colors.text }]}>
            {chatData.name}
          </Text>
          {chatData.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        {isTyping ? (
          <Text
            style={[styles.headerTrustScore, { color: colors.primaryColor }]}
          >
            {t('chat_room.typing')}
          </Text>
        ) : (
          <Text style={[styles.headerTrustScore, { color: colors.textMuted }]}>
            Trust Score: {chatData.trustScore}
          </Text>
        )}
      </View>

      <View style={styles.headerActions}>
        {/* <TouchableOpacity onPress={onCall} style={styles.headerActionButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<Phone size={22} color={colors.text} />
				</TouchableOpacity> */}
        <TouchableOpacity
          onPress={onMore}
          style={styles.headerActionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreVertical size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const ProductCard: React.FC<{ product: ChatData['product'] }> = ({
  product,
}) => {
  const colors = useThemeColors()
  const { t } = useTranslations()

  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.borderColor,
        },
      ]}
    >
      <RemoteImage
        src={product.image}
        style={styles.productImage}
        resizeMode="cover"
        cachePolicy="disk"
        requestedWidth={100}
        requestedHeight={100}
        requestedQuality={60}
      />
      <View style={styles.productInfo}>
        {product.isSold && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>{t('chat_room.sold')}</Text>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        )}
        {product.isReserved && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>{t('chat_room.reserved')}</Text>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        )}
        <Text
          style={[styles.productTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {product.title}
        </Text>
        <Text style={[styles.productPrice, { color: colors.text }]}>
          {product.price}
        </Text>
      </View>
    </View>
  )
}

const SafetyBanner: React.FC = () => {
  const { t } = useTranslations()

  return (
    <View style={[styles.safetyBanner, { backgroundColor: '#FEF9C3' }]}>
      <Text style={styles.safetyIcon}>🛡</Text>
      <Text style={styles.safetyText}>{t('chat_room.safety_message')}</Text>
    </View>
  )
}

const DateSeparator: React.FC<{ date: string }> = ({ date }) => {
  const colors = useThemeColors()

  return (
    <View style={styles.dateSeparator}>
      <View
        style={[styles.dateLine, { backgroundColor: colors.borderColor }]}
      />
      <Text style={[styles.dateText, { color: colors.textMuted }]}>{date}</Text>
      <View
        style={[styles.dateLine, { backgroundColor: colors.borderColor }]}
      />
    </View>
  )
}

const MessageBubbleComponent: React.FC<{
  message: DisplayMessage;
  onLongPress?: () => void;
}> = ({ message, onLongPress }) => {
  const colors = useThemeColors()

  const renderContent = () => {
    // Text message (default)
    return (
      <Text
        style={[styles.messageText, { color: message.isMe ? '#fff' : '#000' }]}
      >
        {message.text}
      </Text>
    )
  }

  const renderStatus = () => {
    if (!message.isMe) return null

    if (message.failed) {
      return <Text style={styles.failedText}>!</Text>
    }

    if (message.status === 'pending') {
      return <ActivityIndicator size={12} color={colors.textMuted} />
    }

    if (message.status === 'read') {
      return <CheckCheck size={14} color={colors.primaryColor} />
    }

    return <Check size={14} color={colors.textMuted} />
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={onLongPress}
      disabled={!onLongPress}
      style={[
        styles.messageContainer,
        message.isMe ? styles.messageContainerMe : styles.messageContainerOther,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isMe
            ? [
                styles.messageBubbleMe,
                {
                  backgroundColor: message.failed
                    ? '#EF4444'
                    : colors.primaryColor,
                },
              ]
            : [
                styles.messageBubbleOther,
                { backgroundColor: colors.secondaryColor },
              ],
        ]}
      >
        {renderContent()}
      </View>
      <View
        style={[
          styles.messageFooter,
          message.isMe ? styles.messageFooterMe : styles.messageFooterOther,
        ]}
      >
        <Text style={[styles.messageTime, { color: colors.textMuted }]}>
          {message.timestamp}
        </Text>
        <View style={styles.messageStatus}>{renderStatus()}</View>
      </View>
    </TouchableOpacity>
  )
}

const MessageBubble = React.memo(
  MessageBubbleComponent,
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.localId === next.message.localId &&
    prev.message.status === next.message.status &&
    prev.message.failed === next.message.failed &&
    prev.message.text === next.message.text &&
    prev.message.timestamp === next.message.timestamp &&
    prev.message.isMe === next.message.isMe,
)

const ReservedNotice: React.FC<{ status: string }> = ({ status }) => {
  const colors = useThemeColors()
  const { t } = useTranslations()

  if (status !== 'reserved') return null

  return (
    <View style={styles.reservedNotice}>
      <Text style={[styles.reservedText, { color: colors.textMuted }]}>
        {t('chat_room.reserved_notice')}
      </Text>
    </View>
  )
}

const QuickReplies: React.FC<{
  replies: string[];
  onSelect: (reply: string) => void;
}> = ({ replies, onSelect }) => {
  const colors = useThemeColors()

  return (
    <View
      style={[
        styles.quickRepliesContainer,
        { borderTopColor: colors.borderColor },
      ]}
    >
      {replies.map((reply, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.quickReplyButton, { borderColor: colors.borderColor }]}
          onPress={() => onSelect(reply)}
          activeOpacity={0.7}
        >
          <Text style={[styles.quickReplyText, { color: colors.text }]}>
            {index === 0 ? '‹ ' : ''}
            {reply}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const MessageInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onTyping?: () => void;
  isSending?: boolean;
}> = ({
  value,
  onChangeText,
  onSend,
  onAttach,
  onTyping,
  isSending,
}) => {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const handleChangeText = (text: string) => {
    onChangeText(text)
    onTyping?.()
  }

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.borderColor,
          paddingBottom: styles.inputContainer.paddingBottom,
        },
      ]}
    >
      <TouchableOpacity onPress={onAttach} style={styles.attachButton}>
        <Text style={[styles.attachIcon, { color: colors.textMuted }]}>+</Text>
      </TouchableOpacity>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.textMuted,
            borderWidth: 1,
          },
        ]}
        placeholder={t('chat_room.type_message')}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={handleChangeText}
        multiline
        maxLength={1000}
        editable={!isSending}
      />
      <TouchableOpacity
        onPress={onSend}
        style={[
          styles.sendButton,
          {
            backgroundColor: value.trim()
              ? colors.primaryColor
              : colors.borderColor,
          },
        ]}
        disabled={!value.trim() || isSending}
      >
        {isSending ? (
          <ActivityIndicator size={16} color="#fff" />
        ) : (
          <Text style={styles.sendIcon}>➤</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

// Main Component
const ChatRoomPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const chatRoomId = id ? parseInt(id, 10) : null
  const colors = useThemeColors()
  const { t } = useTranslations()
  const flatListRef = useRef<FlatList>(null)
  
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(
    null,
  )
  const [isDeletingRoom, setIsDeletingRoom] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    isError?: boolean;
  }>({
    visible: false,
    message: '',
    isError: false,
  })
  const queryClient = useQueryClient()
  const sendInFlightRef = useRef(false)
  const loadMoreInFlightRef = useRef(false)

  // Get current user
  const currentUserId = useAuthStore((s) => s.user?.id)
  // const user = useAuthStore((s) => s.user);

  // Establish SignalR connection (handled globally by ChatBootstrap in
  // app/_layout.tsx — do NOT re-subscribe here, otherwise we'd dedupe-skip
  // and produce duplicate listeners on remount).

  // Get chat room info from store (selector includes find to prevent unnecessary re-renders)
  const currentChat = useChatStore((s) =>
    chatRoomId ? (s.chatList.find((c) => c.id === chatRoomId) ?? null) : null,
  )

  // Fallback: fetch chat list if current chat not found in store
  const { data: chatListData } = useMyChatQuery({
    params: { page: 1, pageSize: AppLimits.Chat.MAX_CHAT_ROOMS_PER_USER },
    querySettings: {
      enabled: !currentChat && !!chatRoomId && !!currentUserId,
      staleTime: 1000 * 60, // 1 minute
    },
  })

  // Extract chat from list if currentChat is null (newly created chat)
  const fallbackChat = useMemo(() => {
    if (currentChat || !chatListData?.data?.data?.chats) return null
    return (
      chatListData.data.data.chats.find((c) => c.id === chatRoomId) ?? null
    )
  }, [currentChat, chatListData, chatRoomId])

  // Use either store chat or fallback from list
  const chatData_source = currentChat || fallbackChat

  // Determine the other user's ID for online status tracking
  const otherUserId = useMemo(() => {
    if (!chatData_source || !currentUserId) return null
    const isBuyer = chatData_source.buyer.id === currentUserId
    return isBuyer ? chatData_source.seller.id : chatData_source.buyer.id
  }, [chatData_source, currentUserId])

  // Join chat room and get real-time messages
  const {
    messages: storeMessages,
    messagesLoading,
  } = useChatRoom(chatRoomId)

  // REST mark-as-read on enter. We also flip read state via SignalR (inside
  // useChatRoom -> store.markAsRead), but firing the REST endpoint as well
  // guarantees the server-side unread counters are reconciled even if the
  // hub call was rejected (e.g. transient hub error). Idempotent on the
  // backend — calling twice is safe.
  const markAsReadOnceRef = useRef<number | null>(null)
  const { mutate: markAsReadRest } = useMarkAsReadMutation({
    onSuccess: () => {
      // Reconcile any cached unread totals shown elsewhere in the app.
      queryClient.invalidateQueries({ queryKey: ['UNREAD_COUNT'] })
      queryClient.invalidateQueries({ queryKey: ['MY_CHATS'] })
    },
    onError: (error) => {
      // Non-fatal — the SignalR path will retry on next message arrival.
      logger.warn('[ChatRoom] markAsRead REST failed', {
        extra: { error, chatRoomId },
      })
    },
  })

  useEffect(() => {
    if (!chatRoomId) return
    if (markAsReadOnceRef.current === chatRoomId) return
    markAsReadOnceRef.current = chatRoomId
    markAsReadRest({ chat_room_id: chatRoomId })
  }, [chatRoomId, markAsReadRest])

  // React to the other party deleting this chat room over SignalR. The
  // store sets `lastRemovedChatRoomId` from its `_handleChatRoomDeleted`
  // handler; if it matches the room we're currently viewing, surface a
  // brief notice and pop back to the chat list.
  const lastRemovedChatRoomId = useChatStore((s) => s.lastRemovedChatRoomId)
  const setLastRemovedChatRoomId = useChatStore(
    (s) => s.setLastRemovedChatRoomId,
  )
  useEffect(() => {
    if (!chatRoomId) return
    if (lastRemovedChatRoomId !== chatRoomId) return
    setSnackbar({
      visible: true,
      message: t('chat.delete_chat_success'),
      isError: false,
    })
    setLastRemovedChatRoomId(null)
    const timer = setTimeout(() => {
      if (router.canGoBack()) router.back()
      else router.replace('/(tabs)/chat')
    }, 800)
    return () => clearTimeout(timer)
  }, [
    lastRemovedChatRoomId,
    chatRoomId,
    setLastRemovedChatRoomId,
    t,
  ])

  // Send message functionality
  const { send, handleTyping } = useSendMessage(chatRoomId)

  // Typing indicator
  const { isTyping } = useTypingIndicator(chatRoomId)

  // Online status of other user. Seed the store from the chat metadata if
  // SignalR hasn't yet delivered a UserStatusChanged event for this user, so
  // the header doesn't briefly flash "offline" when entering the room.
  const setUserOnlineStatus = useChatStore((s) => s.setUserOnlineStatus)
  useEffect(() => {
    if (!otherUserId || !chatData_source) return
    const existing = useChatStore.getState().onlineUsers[otherUserId]
    if (existing) return
    const seedOnline =
      chatData_source.is_other_user_online ??
      (chatData_source.buyer.id === otherUserId
        ? chatData_source.buyer.is_online
        : chatData_source.seller.id === otherUserId
          ? chatData_source.seller.is_online
          : false) ??
      false
    const rawLastSeen = chatData_source.other_user_last_seen
    const lastSeenStr =
      rawLastSeen instanceof Date
        ? rawLastSeen.toISOString()
        : (rawLastSeen ?? null)
    setUserOnlineStatus(otherUserId, {
      userId: otherUserId,
      isOnline: seedOnline,
      lastSeenAt: lastSeenStr,
    })
  }, [otherUserId, chatData_source, setUserOnlineStatus])

  const { isOnline } = useUserOnlineStatus(otherUserId)

  // Fetch messages from API with infinite pagination (load older messages)
  const {
    data: messagesData,
    isLoading: isLoadingApi,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useChatMessagesInfiniteQuery({
    chatRoomId: chatRoomId || 0,
  })

  // Set messages from API to store on initial load
  const setMessages = useChatStore((s) => s.setMessages)
  const setChatList = useChatStore((s) => s.setChatList)
  const messagesInitializedRef = useRef<number | null>(null)

  // Sync fallback chat to store when fetched
  useEffect(() => {
    if (fallbackChat && chatRoomId && !currentChat) {
      // Update store with fetched chat to prevent refetching
      const existingList = useChatStore.getState().chatList
      const updated = existingList.find((c) => c.id === chatRoomId)
        ? existingList
        : [fallbackChat, ...existingList]
      setChatList(updated)
    }
  }, [fallbackChat, chatRoomId, currentChat, setChatList])

  const { mutate: deleteChatRoom } = useDeleteChatRoomMutation({
    onSuccess: (response) => {
      // Only update store AFTER server confirms deletion
      if (chatRoomId) {
        setChatList(
          useChatStore
            .getState()
            .chatList.filter((chat) => chat.id !== chatRoomId),
        )
        // Clear messages for this chat
        setMessages(chatRoomId, [])
      }

      // Force refetch from server to confirm deletion
      queryClient.refetchQueries({ queryKey: ['MY_CHATS'] })
      queryClient.refetchQueries({ queryKey: ['UNREAD_COUNT'] })

      setSnackbar({
        visible: true,
        message: t('chat.delete_chat_success'),
        isError: false,
      })

      // Navigate back after 1.5 seconds to show success message
      setTimeout(() => {
        setIsDeletingRoom(false)
        router.back()
      }, 1500)
    },
    onError: (error: any) => {
      logger.error('Delete chat failed:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        error: error,
      })
      setIsDeletingRoom(false)
      setSnackbar({
        visible: true,
        message: error?.response?.data?.message || t('chat.delete_chat_error'),
        isError: true,
      })
    },
    onSettled: () => {
      // Don't do anything here - let onSuccess/onError handle state
    },
  })

  const { mutate: deleteChatMessage } = useDeleteChatMessageMutation({
    onSuccess: (_res, variables) => {
      const currentMessages =
        useChatStore.getState().messages[variables.chatRoomId] || []
      setMessages(
        variables.chatRoomId,
        currentMessages.filter((m) => m.id !== variables.messageId),
      )
      queryClient.invalidateQueries({
        queryKey: ['CHAT_MESSAGES_INFINITE', variables.chatRoomId],
      })
      setSnackbar({
        visible: true,
        message: t('chat_room.delete_message_success'),
        isError: false,
      })
    },
    onError: () => {
      setSnackbar({
        visible: true,
        message: t('chat_room.delete_message_error'),
        isError: true,
      })
    },
    onSettled: () => {
      setDeletingMessageId(null)
    },
  })

  // API response from infinite query - flatten all pages
  const apiMessages: ChatMessageDto[] = useMemo(() => {
    if (!messagesData?.pages) return []
    // Each page: { data: { messages, chat_room }, message, code }
    // Flatten all messages from all pages (they come oldest first)
    return messagesData.pages.flatMap(
      (page: ApiResponse<ChatMessagesResponse>) => page?.data?.messages || [],
    )
  }, [messagesData?.pages])

  const apiChatRoom = messagesData?.pages?.[0]?.data?.chat_room

  useEffect(() => {
    if (!snackbar.visible) return
    const timer = setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, visible: false }))
    }, 2200)
    return () => clearTimeout(timer)
  }, [snackbar.visible])

  useEffect(() => {
    // Only initialize messages once per chatRoomId when store is empty
    if (
      chatRoomId &&
      apiMessages.length > 0 &&
      messagesInitializedRef.current !== chatRoomId
    ) {
      // Check store directly to get fresh value (avoid stale closure)
      const currentStoreMessages =
        useChatStore.getState().messages[chatRoomId] || []
      if (currentStoreMessages.length === 0) {
        messagesInitializedRef.current = chatRoomId
        const initializedMessages = apiMessages.map((m) => ({
          ...m,
          isPending: false,
          isFailed: false,
        }))

        setMessages(chatRoomId, initializedMessages)
        // Note: server marks all as read when we join the room (handled
        // inside useChatRoom -> markAsRead via SignalR). No REST call needed.
      }
    }
  }, [chatRoomId, apiMessages, setMessages])

  // Merge API history and store realtime updates to avoid source-flipping.
  const mergedMessages = useMemo<ChatMessage[]>(() => {
    const byKey = new Map<string, ChatMessage>()

    const toStoreShape = (msg: ChatMessage | ChatMessageDto): ChatMessage => {
      if ('localId' in msg || 'isPending' in msg || 'isFailed' in msg) {
        return msg as ChatMessage
      }

      return {
        ...(msg as ChatMessageDto),
        isPending: false,
        isFailed: false,
      }
    }

    const getMessageKey = (msg: ChatMessage): string => {
      if (msg.localId) return `local:${msg.localId}`
      if (msg.id > 0) return `id:${msg.id}`

      return `fallback:${msg.chat_room_id}:${msg.sender_id}:${msg.sent_at}:${msg.content}`
    }

    apiMessages.forEach((msg) => {
      const normalized = toStoreShape(msg)
      byKey.set(getMessageKey(normalized), normalized)
    })

    storeMessages.forEach((msg) => {
      const normalized = toStoreShape(msg)
      byKey.set(getMessageKey(normalized), normalized)
    })

    return Array.from(byKey.values()).sort(
      (a, b) =>
        parseBackendDateTime(a.sent_at).getTime() -
        parseBackendDateTime(b.sent_at).getTime(),
    )
  }, [apiMessages, storeMessages])

  // Get display messages from merged timeline
  const displayMessages = useMemo(() => {
    if (!currentUserId) return []

    return mergedMessages.map((msg, index) =>
      transformStoreMessage(msg as ChatMessage, currentUserId, index),
    )
  }, [mergedMessages, currentUserId])

  // Group messages by date
  const messageGroups = useMemo(() => {
    return groupMessagesByDate(displayMessages, mergedMessages)
  }, [displayMessages, mergedMessages])

  // Build chat data for header/product card
  // Supports both ChatListItemDto (from store) and ChatRoomDto (from API response)
  const chatData: ChatData | null = useMemo(() => {
    // Try from store or fetched list first

    if (chatData_source && currentUserId) {
      // Determine the other user (buyer if I'm seller, seller if I'm buyer)
      const isBuyer = chatData_source.buyer.id === currentUserId
      const otherUser = isBuyer
        ? chatData_source.seller
        : chatData_source.buyer

      return {
        id: chatData_source.id,
        name: otherUser.username || 'Unknown',
        avatar: otherUser.profile_image_url || undefined,
        trustScore: '0.0°C',
        isOnline,
        otherUserId: otherUser.id,
        product: {
          id: chatData_source.product.id,
          title: chatData_source.product.title || 'Product',
          is_free: chatData_source.product.is_free || false,
          price: chatData_source.product.price
            ? `${chatData_source.product.price}`
            : '',
          image: chatData_source.product.image_url || '',
          isSold: chatData_source.product.status === 'sold',
          isReserved: chatData_source.product.status === 'reserved',
          status: chatData_source.product.status,
        },
      }
    }

    // Fallback: Use ChatRoomDto from messages API response (for newly created chats)
    if (apiChatRoom && currentUserId) {
      const chatRoom = apiChatRoom
      const isBuyer = chatRoom.buyer.id === currentUserId
      const otherUser = isBuyer ? chatRoom.seller : chatRoom.buyer
      const productPrice = chatRoom.product?.price
        ? `${chatRoom.product.price}`
        : ''

      return {
        id: chatRoom.id,
        name: otherUser?.username || 'Unknown',
        avatar: otherUser?.profile_image_url || undefined,
        trustScore: '37.7°C',
        isOnline: otherUser?.is_online ?? false,
        otherUserId: otherUser?.id ?? 0,
        product: {
          id: chatRoom.product.id,
          title: chatRoom.product?.title || 'Product',
          is_free: chatRoom.product?.is_free || false,
          price: productPrice,
          image: chatRoom.product?.image_url || '',
          isSold: chatRoom.product?.status === 'sold',
          isReserved: chatRoom.product?.status === 'reserved',
          status: chatRoom.product?.status,
        },
      }
    }

    return null
  }, [chatData_source, isOnline, apiChatRoom, currentUserId])

  const effectiveChatData: ChatData = useMemo(
    () =>
      chatData ?? {
        id: chatRoomId ?? 0,
        name: 'Chat',
        trustScore: '0.0°C',
        isOnline: false,
        otherUserId: 0,
        product: {
          id: 0,
          title: '',
          price: '',
          image: '',
          status: '',
        },
      },
    [chatData, chatRoomId],
  )

  const handleBack = () => {
    router.back()
  }

  const handleCall = () => {
  }

  const handleMore = () => {
    if (!chatRoomId || isDeletingRoom) return

    Alert.alert(t('chat.delete_chat_title'), t('chat.delete_chat_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('chat.delete'),
        style: 'destructive',
        onPress: () => {
          setIsDeletingRoom(true)
          deleteChatRoom(chatRoomId)
        },
      },
    ])
  }

  const handleDeleteMessage = useCallback((message: DisplayMessage) => {
    if (!chatRoomId || deletingMessageId || !message.id) return

    const numericMessageId = Number(message.id)
    if (!Number.isFinite(numericMessageId) || numericMessageId <= 0) {
      return
    }

    Alert.alert(
      t('chat_room.delete_message_title'),
      t('chat_room.delete_message_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.delete'),
          style: 'destructive',
          onPress: () => {
            setDeletingMessageId(numericMessageId)
            deleteChatMessage({ chatRoomId, messageId: numericMessageId })
          },
        },
      ],
    )
  }, [chatRoomId, deletingMessageId, deleteChatMessage, t])

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || sendInFlightRef.current) return

    sendInFlightRef.current = true
    setIsSending(true)
    try {
      await send(inputText)
      setInputText('')
      // The autoScroll effect (keyed on the latest message) will pull us to
      // the bottom as soon as the new message lands in mergedMessages.
    } finally {
      sendInFlightRef.current = false
      setIsSending(false)
    }
  }, [inputText, send])

  const handleAttach = () => {
    // TODO: Open image picker and call sendImage
  }

  const handleQuickReply = useCallback((reply: string) => {
    setInputText(reply)
  }, [])

  // Quick Reply Suggestions (translated)
  const quickReplies = useMemo(
    () => [
      t('chat_room.quick_reply_hello'),
      t('chat_room.quick_reply_available'),
    ],
    [t],
  )

  // Handle loading more (older messages)
  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || loadMoreInFlightRef.current) {
      return
    }
    loadMoreInFlightRef.current = true
    try {
      await fetchNextPage()
    } finally {
      loadMoreInFlightRef.current = false
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // ---- Smart auto-scroll -----------------------------------------------
  // Tracks the bottom-most message we've already rendered. When the bottom
  // changes (new outgoing/incoming message arrives) we scrollToEnd. When
  // pagination prepends older messages at the top, the bottom message key
  // stays the same, so we DO NOT scroll — the user keeps their reading
  // position. The very first render scrolls to bottom without animation so
  // the latest message is visible immediately.
  const lastBottomKeyRef = useRef<string | null>(null)
  const didInitialScrollRef = useRef(false)

  useEffect(() => {
    if (mergedMessages.length === 0) return
    const last = mergedMessages[mergedMessages.length - 1]
    const key = last.localId
      ? `local:${last.localId}`
      : last.id > 0
        ? `id:${last.id}`
        : `fallback:${last.sent_at}:${last.content}`

    if (lastBottomKeyRef.current === key) return
    const isFirst = !didInitialScrollRef.current
    lastBottomKeyRef.current = key
    didInitialScrollRef.current = true

    // requestAnimationFrame ensures FlatList has measured the new content.
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: !isFirst })
    })
  }, [mergedMessages])

  // Reset scroll memory when switching rooms
  useEffect(() => {
    lastBottomKeyRef.current = null
    didInitialScrollRef.current = false
  }, [chatRoomId])

  const renderMessageGroup = useCallback(
    ({ item }: { item: MessageGroup }) => (
      <View>
        <DateSeparator date={item.date} />
        {item.messages.map((message) => (
          <MessageBubble
            key={message.localId || message.id}
            message={message}
            onLongPress={() => handleDeleteMessage(message)}
          />
        ))}
      </View>
    ),
    [handleDeleteMessage],
  )

  const messageGroupKeyExtractor = useCallback(
    (item: MessageGroup) => item.date,
    [],
  )

  // Loading state
  if ((isLoadingApi || messagesLoading) && displayMessages.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.profileBackground },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primaryColor} />
      </View>
    )
  }

  return (
    <KeyboardAvoidWrapper
      scrollEnabled={false}
      style={{
        ...styles.container,
        backgroundColor: colors.profileBackground,
      }}
    >
      <ChatHeader
        chatData={effectiveChatData}
        onBack={handleBack}
        onCall={handleCall}
        onMore={handleMore}
        isTyping={isTyping}
      />
      {isDeletingRoom && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="small" color={colors.primaryColor} />
        </View>
      )}

      <ProductCard product={effectiveChatData.product} />

      <SafetyBanner />

      <FlatList
        ref={flatListRef}
        data={messageGroups}
        renderItem={renderMessageGroup}
        keyExtractor={messageGroupKeyExtractor}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        ListHeaderComponent={
          <>
            {isFetchingNextPage && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primaryColor} />
              </View>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <TouchableOpacity
                onPress={handleLoadMore}
                style={styles.loadMoreButton}
              >
                <Text
                  style={[styles.loadMoreText, { color: colors.primaryColor }]}
                >
                  {t('chat_room.load_more')}
                </Text>
              </TouchableOpacity>
            )}
          </>
        }
        ListFooterComponent={
          <ReservedNotice status={effectiveChatData.product.status} />
        }
        // Auto load more when scrolled to top — NOTE: we intentionally do
        // NOT call scrollToEnd here. Initial / new-message scrolling is
        // handled by the auto-scroll effect above so that pagination
        // (which prepends older content at the top) doesn't yank the user
        // back to the bottom.
        onScroll={(event) => {
          const { contentOffset } = event.nativeEvent
          if (contentOffset.y < 50 && hasNextPage && !isFetchingNextPage) {
            handleLoadMore()
          }
        }}
        scrollEventThrottle={100}
        maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
      />

      <QuickReplies replies={quickReplies} onSelect={handleQuickReply} />

      <MessageInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        onAttach={handleAttach}
        onTyping={handleTyping}
        isSending={isSending || !!effectiveChatData.product.isSold}
      />

      {snackbar.visible && (
        <View
          style={[
            styles.snackbar,
            { backgroundColor: snackbar.isError ? '#DC2626' : '#16A34A' },
          ]}
        >
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
        </View>
      )}
    </KeyboardAvoidWrapper>
  )
}

export default ChatRoomPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  headerTrustScore: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionButton: {
    padding: 4,
  },

  // Product Card
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  soldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  soldBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },

  // Safety Banner
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  safetyIcon: {
    fontSize: 14,
  },
  safetyText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },

  // Messages List
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Date Separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    fontSize: 12,
    marginHorizontal: 12,
  },

  // Message Bubble
  messageContainer: {
    marginVertical: 4,
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageContainerOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleMe: {
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: 4,
    shadowRadius: 1,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 1 },
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  failedText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageFooterMe: {
    justifyContent: 'flex-end',
  },
  messageFooterOther: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
  },
  messageStatus: {
    marginLeft: 2,
  },

  // Reserved Notice
  reservedNotice: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  reservedText: {
    fontSize: 13,
  },

  // Quick Replies
  quickRepliesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  quickReplyButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  quickReplyText: {
    fontSize: 13,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
    borderTopWidth: 1,
  },
  attachButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 16,
    transform: [{ rotate: '-20deg' }],
  },

  // Load More
  loadingMore: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deletingOverlay: {
    position: 'absolute',
    right: 48,
    zIndex: 20,
  },
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 84,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    zIndex: 40,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
})
