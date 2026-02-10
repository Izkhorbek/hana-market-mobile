import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { router } from 'expo-router'
import { ArrowLeft, MessageSquare, Send, Star } from 'lucide-react-native'
import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'

// Form data interface
interface FeedbackFormData {
	rating: number
	message: string
}

// API response interface
interface FeedbackResponse {
	success: boolean
	message?: string
	feedbackId?: string
}

// Star Rating Component
interface StarRatingProps {
	rating: number
	onRatingChange: (rating: number) => void
	size?: number
	disabled?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({
	rating,
	onRatingChange,
	size = 36,
	disabled = false,
}) => {
	const colors = useThemeColors()

	return (
		<View style={styles.starContainer}>
			{[1, 2, 3, 4, 5].map(star => (
				<TouchableOpacity
					key={star}
					onPress={() => !disabled && onRatingChange(star)}
					activeOpacity={disabled ? 1 : 0.7}
					disabled={disabled}
					style={styles.starButton}
				>
					<Star
						size={size}
						color={star <= rating ? '#FBBF24' : colors.borderColor}
						fill={star <= rating ? '#FBBF24' : 'transparent'}
						strokeWidth={1.5}
					/>
				</TouchableOpacity>
			))}
		</View>
	)
}

// Character Counter Component
interface CharacterCounterProps {
	current: number
	max?: number
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ current, max }) => {
	const colors = useThemeColors()

	return (
		<View style={styles.counterContainer}>
			<Text style={[styles.counterText, { color: colors.textMuted }]}>
				{current}
			</Text>
			<Text style={[styles.counterLabel, { color: colors.textMuted }]}>
				characters
			</Text>
		</View>
	)
}

const FeedbackPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Initialize react-hook-form
	const {
		control,
		handleSubmit,
		watch,
		reset,
		formState: { isValid },
	} = useForm<FeedbackFormData>({
		defaultValues: {
			rating: 0,
			message: '',
		},
		mode: 'onChange',
	})

	// Watch message for character count
	const message = watch('message')
	const rating = watch('rating')

	const handleGoBack = () => {
		router.back()
	}

	// API call function - ready for backend integration
	const submitFeedback = async (data: FeedbackFormData): Promise<FeedbackResponse> => {
		// TODO: Replace with actual API call
		// Example implementation:
		// const response = await fetch('YOUR_API_URL/feedback', {
		//   method: 'POST',
		//   headers: {
		//     'Content-Type': 'application/json',
		//     'Authorization': `Bearer ${token}`,
		//   },
		//   body: JSON.stringify({
		//     rating: data.rating,
		//     message: data.message,
		//     platform: Platform.OS,
		//     appVersion: '1.1.0',
		//     timestamp: new Date().toISOString(),
		//   }),
		// })
		// return response.json()

		// Simulated API call
		await new Promise(resolve => setTimeout(resolve, 1000))

		console.log('Feedback data to send:', {
			rating: data.rating,
			message: data.message,
			platform: Platform.OS,
			appVersion: '1.1.0',
			timestamp: new Date().toISOString(),
		})

		return {
			success: true,
			message: 'Feedback submitted successfully',
			feedbackId: 'FB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
		}
	}

	// Form submission handler
	const onSubmit = async (data: FeedbackFormData) => {
		setIsSubmitting(true)
		try {
			const response = await submitFeedback(data)

			if (response.success) {
				Alert.alert(
					t('feedback.success_title'),
					t('feedback.success_message'),
					[
						{
							text: 'OK',
							onPress: () => {
								reset()
								router.back()
							},
						},
					]
				)
			} else {
				Alert.alert(t('feedback.error_title'), response.message || t('feedback.error_message'))
			}
		} catch (error) {
			console.error('Error submitting feedback:', error)
			Alert.alert(t('feedback.error_title'), t('feedback.error_message'))
		} finally {
			setIsSubmitting(false)
		}
	}

	// Check if form can be submitted (at least message is required)
	const canSubmit = message.trim().length > 0

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			{/* Header */}
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
					onPress={handleGoBack}
					style={styles.backButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>
					{t('feedback.title')}
				</Text>
				<View style={styles.headerRight} />
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardView}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
				>
					{/* Hero Section */}
					<View style={styles.heroSection}>
						<View
							style={[
								styles.heroIconContainer,
								{ backgroundColor: `${colors.primaryColor}15` },
							]}
						>
							<MessageSquare size={24} color={colors.primaryColor} strokeWidth={1.5} />
						</View>
						<View style={styles.heroContent}>
							<Text style={[styles.heroTitle, { color: colors.text }]}>
								{t('feedback.hero_title')}
							</Text>
							<Text style={[styles.heroDescription, { color: colors.textMuted }]}>
								{t('feedback.hero_description')}
							</Text>
						</View>
					</View>

					{/* Rating Card */}
					<View style={[styles.card, { backgroundColor: cardColor }]}>
						<Text style={[styles.cardTitle, { color: colors.text }]}>
							{t('feedback.rating_title')}
						</Text>
						<Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
							{t('feedback.rating_optional')}
						</Text>

						<Controller
							control={control}
							name='rating'
							render={({ field: { value, onChange } }) => (
								<StarRating
									rating={value}
									onRatingChange={onChange}
									size={40}
								/>
							)}
						/>
					</View>

					{/* Message Card */}
					<View style={[styles.card, { backgroundColor: cardColor }]}>
						<Text style={[styles.cardTitle, { color: colors.text }]}>
							{t('feedback.message_title')}
						</Text>
						<Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
							{t('feedback.message_subtitle')}
						</Text>

						<Controller
							control={control}
							name='message'
							rules={{
								required: t('feedback.errors.message_required'),
							}}
							render={({ field: { value, onChange, onBlur } }) => (
								<TextInput
									style={[
										styles.textArea,
										{
											backgroundColor: colors.profileBackground,
											borderColor: colors.borderColor,
											color: colors.text,
										},
									]}
									placeholder={t('feedback.message_placeholder')}
									placeholderTextColor={colors.textMuted}
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									multiline
									numberOfLines={6}
									textAlignVertical='top'
								/>
							)}
						/>

						<CharacterCounter current={message.length} />
					</View>

					{/* Submit Button */}
					<TouchableOpacity
						style={[
							styles.submitButton,
							{ backgroundColor: colors.primaryColor },
							(isSubmitting || !canSubmit) && styles.submitButtonDisabled,
						]}
						onPress={handleSubmit(onSubmit)}
						disabled={isSubmitting || !canSubmit}
						activeOpacity={0.8}
					>
						<Send size={18} color='#fff' />
						<Text style={styles.submitButtonText}>
							{isSubmitting ? t('feedback.submitting') : t('feedback.submit_button')}
						</Text>
					</TouchableOpacity>

					{/* Privacy Note */}
					<View
						style={[
							styles.privacyCard,
							{
								backgroundColor: colors.infoCardBg,
								borderColor: colors.infoCardBorder,
							},
						]}
					>
						<Text style={[styles.privacyText, { color: colors.infoCardText }]}>
							{t('feedback.privacy_note')}
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	)
}

export default FeedbackPage

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
		paddingBottom: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'flex-start',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	headerRight: {
		width: 40,
	},
	keyboardView: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 40,
	},
	heroSection: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 24,
	},
	heroIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 14,
	},
	heroContent: {
		flex: 1,
	},
	heroTitle: {
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 4,
	},
	heroDescription: {
		fontSize: 14,
		lineHeight: 20,
	},
	card: {
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	cardSubtitle: {
		fontSize: 13,
		marginBottom: 16,
	},
	starContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	starButton: {
		padding: 4,
	},
	textArea: {
		minHeight: 140,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		lineHeight: 22,
	},
	counterContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
		gap: 4,
	},
	counterText: {
		fontSize: 13,
		fontWeight: '500',
	},
	counterLabel: {
		fontSize: 13,
	},
	submitButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
		marginBottom: 16,
	},
	submitButtonDisabled: {
		opacity: 0.6,
	},
	submitButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	privacyCard: {
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
	},
	privacyText: {
		fontSize: 13,
		lineHeight: 20,
	},
})
