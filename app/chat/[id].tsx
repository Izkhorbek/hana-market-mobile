import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Check, CheckCheck, MoreVertical, Phone } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import {
	FlatList,
	Image,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'

// Types
interface Message {
	id: string
	text: string
	timestamp: string
	isMe: boolean
	status?: 'sent' | 'delivered' | 'read'
}

interface ChatData {
	id: string
	name: string
	avatar?: string
	trustScore: string
	product: {
		title: string
		price: string
		image: string
		isSold?: boolean
	}
}

// Mock data
const mockChatData: ChatData = {
	id: '1',
	name: 'Sarah',
	avatar: 'https://i.pravatar.cc/150?img=1',
	trustScore: '37.7°C',
	product: {
		title: 'White Storage Wardrobe',
		price: '$150',
		image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=200&q=80',
		isSold: true,
	},
}

const mockMessages: Message[] = [
	{
		id: '1',
		text: 'Hello! 😊',
		timestamp: '4:29 PM',
		isMe: false,
	},
	{
		id: '2',
		text: 'Is the price negotiable?',
		timestamp: '4:29 PM',
		isMe: false,
	},
	{
		id: '3',
		text: 'Unfortunately the price is firm.',
		timestamp: '5:55 AM',
		isMe: true,
		status: 'read',
	},
	{
		id: '4',
		text: 'Understood, I can meet anytime today.',
		timestamp: '6:14 AM',
		isMe: false,
	},
	{
		id: '5',
		text: "Great! Let's meet at 3 PM.",
		timestamp: '6:20 AM',
		isMe: true,
		status: 'read',
	},
]

// Group messages by date
interface MessageGroup {
	date: string
	messages: Message[]
}

const groupMessagesByDate = (messages: Message[]): MessageGroup[] => {
	// For demo, we'll create two groups
	return [
		{
			date: 'Aug 5, 2025',
			messages: messages.slice(0, 2),
		},
		{
			date: 'Aug 6, 2025',
			messages: messages.slice(2),
		},
	]
}

// Quick Reply Suggestions
const quickReplies = ['Yes, what time works?', 'When can we meet?']

// Components
const ChatHeader: React.FC<{
	chatData: ChatData
	onBack: () => void
	onCall: () => void
	onMore: () => void
}> = ({ chatData, onBack, onCall, onMore }) => {
	const colors = useThemeColors()

	return (
		<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
			<TouchableOpacity onPress={onBack} style={styles.headerBackButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
				<ArrowLeft size={24} color={colors.text} />
			</TouchableOpacity>

			<View style={styles.headerCenter}>
				<Text style={[styles.headerName, { color: colors.text }]}>{chatData.name}</Text>
				<Text style={[styles.headerTrustScore, { color: colors.textMuted }]}>
					Trust Score:{chatData.trustScore}
				</Text>
			</View>

			<View style={styles.headerActions}>
				<TouchableOpacity onPress={onCall} style={styles.headerActionButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<Phone size={22} color={colors.text} />
				</TouchableOpacity>
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
			<Image source={{ uri: product.image }} style={styles.productImage} resizeMode='cover' />
			<View style={styles.productInfo}>
				{product.isSold && (
					<View style={styles.soldBadge}>
						<Text style={styles.soldBadgeText}>{t('chat_room.sold')}</Text>
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

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
	const colors = useThemeColors()

	return (
		<View style={[styles.messageContainer, message.isMe ? styles.messageContainerMe : styles.messageContainerOther]}>
			<View
				style={[
					styles.messageBubble,
					message.isMe
						? [styles.messageBubbleMe, { backgroundColor: colors.primaryColor }]
						: [styles.messageBubbleOther, { backgroundColor: colors.profileBackground }],
				]}
			>
				<Text style={[styles.messageText, { color: message.isMe ? '#fff' : colors.text }]}>
					{message.text}
				</Text>
			</View>
			<View style={[styles.messageFooter, message.isMe ? styles.messageFooterMe : styles.messageFooterOther]}>
				<Text style={[styles.messageTime, { color: colors.textMuted }]}>{message.timestamp}</Text>
				{message.isMe && message.status && (
					<View style={styles.messageStatus}>
						{message.status === 'read' ? (
							<CheckCheck size={14} color={colors.primaryColor} />
						) : (
							<Check size={14} color={colors.textMuted} />
						)}
					</View>
				)}
			</View>
		</View>
	)
}

const ReservedNotice: React.FC = () => {
	const colors = useThemeColors()
	const { t } = useTranslations()

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
}> = ({ value, onChangeText, onSend, onAttach }) => {
	const colors = useThemeColors()
	const { t } = useTranslations()

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
				onChangeText={onChangeText}
				multiline
				maxLength={1000}
			/>
			<TouchableOpacity
				onPress={onSend}
				style={[styles.sendButton, { backgroundColor: value.trim() ? colors.primaryColor : colors.borderColor }]}
				disabled={!value.trim()}
			>
				<Text style={styles.sendIcon}>➤</Text>
			</TouchableOpacity>
		</View>
	)
}

// Main Component
const ChatRoomPage: React.FC = () => {
	const { id } = useLocalSearchParams<{ id?: string }>()
	const colors = useThemeColors()
	const flatListRef = useRef<FlatList>(null)

	const [messages, setMessages] = useState<Message[]>(mockMessages)
	const [inputText, setInputText] = useState('')
	const [chatData] = useState<ChatData>(mockChatData)

	const messageGroups = groupMessagesByDate(messages)

	const handleBack = () => {
		router.back()
	}

	const handleCall = () => {
		console.log('Call pressed')
	}

	const handleMore = () => {
		console.log('More options pressed')
	}

	const handleSend = () => {
		if (!inputText.trim()) return

		const newMessage: Message = {
			id: String(Date.now()),
			text: inputText.trim(),
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			isMe: true,
			status: 'sent',
		}

		setMessages(prev => [...prev, newMessage])
		setInputText('')

		// Scroll to bottom
		setTimeout(() => {
			flatListRef.current?.scrollToEnd({ animated: true })
		}, 100)
	}

	const handleAttach = () => {
		console.log('Attach pressed')
	}

	const handleQuickReply = (reply: string) => {
		setInputText(reply)
	}

	const renderMessageGroup = ({ item }: { item: MessageGroup }) => (
		<View>
			<DateSeparator date={item.date} />
			{item.messages.map(message => (
				<MessageBubble key={message.id} message={message} />
			))}
		</View>
	)

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.profileBackground }]}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={0}
		>
			<ChatHeader chatData={chatData} onBack={handleBack} onCall={handleCall} onMore={handleMore} />

			<ProductCard product={chatData.product} />

			<SafetyBanner />

			<FlatList
				ref={flatListRef}
				data={messageGroups}
				renderItem={renderMessageGroup}
				keyExtractor={item => item.date}
				contentContainerStyle={styles.messagesList}
				showsVerticalScrollIndicator={false}
				ListFooterComponent={<ReservedNotice />}
			/>

			<QuickReplies replies={quickReplies} onSelect={handleQuickReply} />

			<MessageInput
				value={inputText}
				onChangeText={setInputText}
				onSend={handleSend}
				onAttach={handleAttach}
			/>
		</KeyboardAvoidingView>
	)
}

export default ChatRoomPage

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	// Header
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: Platform.OS === 'ios' ? 54 : 14,
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
	headerName: {
		fontSize: 17,
		fontWeight: '600',
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
	},
	messageText: {
		fontSize: 15,
		lineHeight: 20,
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
