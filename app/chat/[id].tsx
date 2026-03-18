import { useChatMessagesQuery, useChatRoom, useSendMessage, useSignalRConnection, useTypingIndicator, useUserOnlineStatus } from '@/api/hooks';
import RemoteImage from '@/components/shared/RemoteImage';
import { HEADER_PADDING_TOP } from '@/constants/appLimits';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslations } from '@/hooks/use-translation';
import { useAuthStore } from '@/modules/Auth/auth-store';
import { ChatMessage, useChatStore } from '@/modules/Chat/chat-store';
import { ChatData, ChatMessageDto, DisplayMessage } from '@/types';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, CheckCheck, MoreVertical } from 'lucide-react-native';
import { default as React, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';

// Transform ChatMessage (from store) to DisplayMessage
const transformStoreMessage = (message: ChatMessage, currentUserId: number): DisplayMessage => ({
	id: String(message.id),
	text: message.content || '',
	timestamp: format(parseISO(message.sent_at), 'h:mm a'),
	isMe: message.is_mine ? true : false,
	status: message.isPending ? 'pending' : message.is_read ? 'read' : 'sent',
	failed: message.isFailed,
	imageUrl: message.sender_image_url || undefined,
})

// Transform API ChatMessageDto to DisplayMessage
const transformApiMessage = (message: ChatMessageDto, currentUserId: number): DisplayMessage => ({
	id: String(message.id),
	text: message.content || '',
	timestamp: format(parseISO(message.sent_at), 'h:mm a'),
	isMe: message.is_mine ? true : false,
	status: message.is_read ? 'read' : 'sent',
	imageUrl: message.sender_image_url || undefined,
})

// Format date for date separator
const formatMessageDate = (dateString: string): string => {
	const date = parseISO(dateString)
	if (isToday(date)) return 'Today'
	if (isYesterday(date)) return 'Yesterday'
	return format(date, 'MMM d, yyyy')
}

// Group messages by date
interface MessageGroup {
	date: string
	messages: DisplayMessage[]
}

const groupMessagesByDate = (messages: DisplayMessage[], rawMessages: (ChatMessage | ChatMessageDto)[]): MessageGroup[] => {
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
	chatData: ChatData
	onBack: () => void
	onCall: () => void
	onMore: () => void
	isTyping?: boolean
}> = ({ chatData, onBack, onCall, onMore, isTyping }) => {
	const colors = useThemeColors()
	const { t } = useTranslations()

	return (
		<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
			<TouchableOpacity onPress={onBack} style={styles.headerBackButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
				<ArrowLeft size={24} color={colors.text} />
			</TouchableOpacity>

			<View style={styles.headerCenter}>
				<View style={styles.headerNameRow}>
					<Text style={[styles.headerName, { color: colors.text }]}>{chatData.name}</Text>
					{chatData.isOnline && <View style={styles.onlineIndicator} />}
				</View>
				{isTyping ? (
					<Text style={[styles.headerTrustScore, { color: colors.primaryColor }]}>
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
				<TouchableOpacity onPress={onMore} style={styles.headerActionButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<MoreVertical size={22} color={colors.text} />
				</TouchableOpacity>
			</View>
		</View>
	)
}

const ProductCard: React.FC<{ product: ChatData['product'] }> = ({ product }) => {
	const colors = useThemeColors()
	const { t } = useTranslations()

	return (
		<View style={[styles.productCard, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
			<RemoteImage src={product.image} style={styles.productImage} resizeMode='cover' />
			<View style={styles.productInfo}>
				{product.isSold && (
					<View style={styles.soldBadge}>
						<Text style={styles.soldBadgeText}>{t('chat_room.sold')}</Text>
						<Check size={12} color='#fff' strokeWidth={3} />
					</View>
				)}
				{product.isReserved && (
					<View style={styles.soldBadge}>
						<Text style={styles.soldBadgeText}>{t('chat_room.reserved')}</Text>
						<Check size={12} color='#fff' strokeWidth={3} />
					</View>
				)}
				<Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>
					{product.title}
				</Text>
				<Text style={[styles.productPrice, { color: colors.text }]}>{product.price}</Text>
			</View>
		</View>
	)
}

const SafetyBanner: React.FC = () => {
	const colors = useThemeColors()
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
			<View style={[styles.dateLine, { backgroundColor: colors.borderColor }]} />
			<Text style={[styles.dateText, { color: colors.textMuted }]}>{date}</Text>
			<View style={[styles.dateLine, { backgroundColor: colors.borderColor }]} />
		</View>
	)
}

const MessageBubble: React.FC<{ message: DisplayMessage }> = ({ message }) => {
	const colors = useThemeColors()

	const renderContent = () => {
		// Text message (default)
		return (
			<Text style={[styles.messageText, { color: message.isMe ? '#fff' : colors.text }]}>
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
		<View style={[styles.messageContainer, message.isMe ? styles.messageContainerMe : styles.messageContainerOther]}>
			<View
				style={[
					styles.messageBubble,
					message.isMe
						? [styles.messageBubbleMe, { backgroundColor: message.failed ? '#EF4444' : colors.primaryColor }]
						: [styles.messageBubbleOther, { backgroundColor: colors.secondaryColor }],
				]}
			>
				{renderContent()}
			</View>
			<View style={[styles.messageFooter, message.isMe ? styles.messageFooterMe : styles.messageFooterOther]}>
				<Text style={[styles.messageTime, { color: colors.textMuted }]}>{message.timestamp}</Text>
				<View style={styles.messageStatus}>
					{renderStatus()}
				</View>
			</View>
		</View>
	)
}

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

const QuickReplies: React.FC<{ replies: string[]; onSelect: (reply: string) => void }> = ({ replies, onSelect }) => {
	const colors = useThemeColors()

	return (
		<View style={[styles.quickRepliesContainer, { borderTopColor: colors.borderColor }]}>
			{replies.map((reply, index) => (
				<TouchableOpacity
					key={index}
					style={[styles.quickReplyButton, { borderColor: colors.borderColor }]}
					onPress={() => onSelect(reply)}
					activeOpacity={0.7}
				>
					<Text style={[styles.quickReplyText, { color: colors.text }]}>
						{index === 0 ? '‹ ' : ''}{reply}
					</Text>
				</TouchableOpacity>
			))}
		</View>
	)
}

const MessageInput: React.FC<{
	value: string
	onChangeText: (text: string) => void
	onSend: () => void
	onAttach: () => void
	onTyping?: () => void
	isSending?: boolean
}> = ({ value, onChangeText, onSend, onAttach, onTyping, isSending }) => {
	const colors = useThemeColors()
	const { t } = useTranslations()

	const handleChangeText = (text: string) => {
		onChangeText(text)
		onTyping?.()
	}

	return (
		<View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.borderColor }]}>
			<TouchableOpacity onPress={onAttach} style={styles.attachButton}>
				<Text style={[styles.attachIcon, { color: colors.textMuted }]}>+</Text>
			</TouchableOpacity>
			<TextInput
				style={[styles.textInput, { backgroundColor: colors.profileBackground, color: colors.text }]}
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
				style={[styles.sendButton, { backgroundColor: value.trim() ? colors.primaryColor : colors.borderColor }]}
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

	// Get current user
	const currentUserId = useAuthStore((s) => s.user?.id)

	// Establish SignalR connection (required for chat functionality)
	const { isConnected: signalRConnected } = useSignalRConnection()

	// Get chat room info from store (selector includes find to prevent unnecessary re-renders)
	const currentChat = useChatStore((s) =>
		chatRoomId ? s.chatList.find((c) => c.id === chatRoomId) ?? null : null
	)

	console.log('Current Chat:', currentChat)

	// Determine the other user's ID for online status tracking
	const otherUserId = useMemo(() => {
		if (!currentChat || !currentUserId) return null
		const isBuyer = currentChat.buyer.id === currentUserId
		return isBuyer ? currentChat.seller.id : currentChat.buyer.id
	}, [currentChat, currentUserId])

	// Join chat room and get real-time messages
	const { messages: storeMessages, messagesLoading, isConnected } = useChatRoom(chatRoomId)

	// Send message functionality
	const { send, handleTyping } = useSendMessage(chatRoomId)

	// Typing indicator
	const { isTyping } = useTypingIndicator(chatRoomId)

	// Online status of other user
	const { isOnline } = useUserOnlineStatus(otherUserId)

	// Fetch messages from API (initial load)
	const { data: messagesResponse, isLoading: isLoadingApi } = useChatMessagesQuery({
		chatRoomId: chatRoomId || 0,
		querySettings: {
			enabled: !!chatRoomId,
			staleTime: 1000 * 60, // 1 minute
		},
	})

	// Set messages from API to store on initial load
	const setMessages = useChatStore((s) => s.setMessages)
	const messagesInitializedRef = useRef<number | null>(null)

	// API response is wrapped: { data: { chat_room, messages }, message, code }
	const apiMessages = messagesResponse?.data?.data?.messages
	const apiChatRoom = messagesResponse?.data?.data?.chat_room

	console.log('API Messages:', apiMessages)
	console.log('API Chat Room:', apiChatRoom)

	useEffect(() => {
		// Only initialize messages once per chatRoomId when store is empty
		if (chatRoomId && apiMessages && messagesInitializedRef.current !== chatRoomId) {
			// Check store directly to get fresh value (avoid stale closure)
			const currentStoreMessages = useChatStore.getState().messages[chatRoomId] || []
			if (currentStoreMessages.length === 0) {
				messagesInitializedRef.current = chatRoomId
				setMessages(
					chatRoomId,
					apiMessages.map((m) => ({
						...m,
						pending: false,
						failed: false,
					}))
				)
			}
		}
	}, [chatRoomId, apiMessages, setMessages])
	// Get display messages (prefer store for real-time, fallback to API)
	const displayMessages = useMemo(() => {
		const sourceMessages = storeMessages.length > 0 ? storeMessages : apiMessages || []
		if (!currentUserId) return []

		return sourceMessages.map((msg) =>
			'pending' in msg
				? transformStoreMessage(msg as ChatMessage, currentUserId)
				: transformApiMessage(msg as ChatMessageDto, currentUserId)
		)
	}, [storeMessages, apiMessages, currentUserId])

	// Group messages by date
	const messageGroups = useMemo(() => {
		const sourceMessages = storeMessages.length > 0 ? storeMessages : apiMessages || []
		return groupMessagesByDate(displayMessages, sourceMessages)
	}, [displayMessages, storeMessages, apiMessages])

	// Build chat data for header/product card
	// Supports both ChatListItemDto (from store) and ChatRoomDto (from API response)
	const chatData: ChatData | null = useMemo(() => {
		// Try from store first
		if (currentChat && currentUserId) {
			// Determine the other user (buyer if I'm seller, seller if I'm buyer)
			const isBuyer = currentChat.buyer.id === currentUserId
			const otherUser = isBuyer ? currentChat.seller : currentChat.buyer

			return {
				id: currentChat.id,
				name: otherUser.username || 'Unknown',
				avatar: otherUser.profile_image_url || undefined,
				trustScore: '0.0°C',
				isOnline,
				otherUserId: otherUser.id,
				product: {
					id: currentChat.product.id,
					title: currentChat.product.title || 'Product',
					is_free: currentChat.product.is_free || false,
					price: currentChat.product.price ? `${currentChat.product.price}` : '',
					image: currentChat.product.image_url || '',
					isSold: currentChat.product.status === 'sold',
					isReserved: currentChat.product.status === 'reserved',
					status: currentChat.product.status,
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
	}, [currentChat, isOnline, apiChatRoom, currentUserId])

	const handleBack = () => {
		router.back()
	}

	const handleCall = () => {
		console.log('Call pressed')
	}

	const handleMore = () => {
		console.log('More options pressed')
	}

	const handleSend = async () => {
		if (!inputText.trim()) return

		setIsSending(true)
		try {
			await send(inputText)
			setInputText('')
			// Scroll to bottom
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true })
			}, 100)
		} finally {
			setIsSending(false)
		}
	}

	const handleAttach = () => {
		console.log('Attach pressed')
		// TODO: Open image picker and call sendImage
	}

	const handleQuickReply = (reply: string) => {
		setInputText(reply)
	}

	// Quick Reply Suggestions (translated)
	const quickReplies = [t('chat_room.quick_reply_hello'), t('chat_room.quick_reply_available')]

	const renderMessageGroup = ({ item }: { item: MessageGroup }) => (
		<View>
			<DateSeparator date={item.date} />
			{item.messages.map((message) => (
				<MessageBubble key={message.id} message={message} />
			))}
		</View>
	)

	// Loading state
	if ((isLoadingApi || messagesLoading) && displayMessages.length === 0) {
		return (
			<View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.profileBackground }]}>
				<ActivityIndicator size="large" color={colors.primaryColor} />
			</View>
		)
	}

	// No chat data found
	if (!chatData) {
		return (
			<View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.profileBackground }]}>
				<Text style={{ color: colors.textMuted }}>{t('chat_room.not_found')}</Text>
				<TouchableOpacity onPress={handleBack} style={{ marginTop: 16 }}>
					<Text style={{ color: colors.primaryColor }}>{t('common.go_back')}</Text>
				</TouchableOpacity>
			</View>
		)
	}

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.profileBackground }]}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={0}
		>
			<ChatHeader
				chatData={chatData}
				onBack={handleBack}
				onCall={handleCall}
				onMore={handleMore}
				isTyping={isTyping}
			/>

			<ProductCard product={chatData.product} />

			<SafetyBanner />

			<FlatList
				ref={flatListRef}
				data={messageGroups}
				renderItem={renderMessageGroup}
				keyExtractor={(item) => item.date}
				contentContainerStyle={styles.messagesList}
				showsVerticalScrollIndicator={false}
				ListFooterComponent={<ReservedNotice status={chatData.product.status} />}
				onContentSizeChange={() => {
					flatListRef.current?.scrollToEnd({ animated: false })
				}}
			/>

			<QuickReplies replies={quickReplies} onSelect={handleQuickReply} />

			<MessageInput
				value={inputText}
				onChangeText={setInputText}
				onSend={handleSend}
				onAttach={handleAttach}
				onTyping={handleTyping}
				isSending={isSending || chatData.product.isSold}
			/>
		</KeyboardAvoidingView>
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
		paddingTop: HEADER_PADDING_TOP,
		paddingBottom: 12,
		paddingHorizontal: 12,
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
		paddingHorizontal: 12,
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
		paddingBottom: Platform.OS === 'ios' ? 34 : 16,
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
	},
})
