import { useSendContactMessageMutation } from '@/api/hooks'
import FormInput from '@/components/FormElements/FormInput'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import ThemedScrollView from '@/components/themed-scrollview'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'
import { router } from 'expo-router'
import { ArrowLeft, Mail, MessageCircle, Phone, Send } from 'lucide-react-native'
import React from 'react'
import { useForm } from 'react-hook-form'
import {
	Alert,
	Linking,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ContactFormData {
	name: string
	email: string
	subject: string
	message: string
}

const CONTACT_INFO = {
	email: 'hanamarket@gmail.com',
	phone: '+99850 177 40 94',
	workingHours: 'Du-Juma, 9:00-18:00 gacha',
}

interface ContactCardProps {
	icon: React.ReactNode
	title: string
	value: string
	subtitle: string
	onPress?: () => void
}

const ContactCard: React.FC<ContactCardProps> = ({ icon, title, value, subtitle, onPress }) => {
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')

	return (
		<TouchableOpacity
			style={[styles.contactCard, { backgroundColor: cardColor }]}
			onPress={onPress}
			activeOpacity={onPress ? 0.7 : 1}
			disabled={!onPress}
		>
			<View style={[styles.contactIconContainer, { backgroundColor: `${colors.primaryColor}15` }]}>
				{icon}
			</View>
			<View style={styles.contactContent}>
				<Text style={[styles.contactTitle, { color: colors.textMuted }]}>{title}</Text>
				<Text style={[styles.contactValue, { color: colors.text }]}>{value}</Text>
				<Text style={[styles.contactSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
			</View>
		</TouchableOpacity>
	)
}

const ContactPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')
	const { isKeyboardVisible } = useKeyboardHeight()
    const insets = useSafeAreaInsets()

	const { control, handleSubmit, reset, formState: { isValid } } = useForm<ContactFormData>({
		defaultValues: { name: '', email: '', subject: '', message: '' },
		mode: 'onChange',
	})

	const { mutate: sendMessage, isPending: isSubmitting } = useSendContactMessageMutation({
		onSuccess: () => {
			Alert.alert(t('contact.success_title'), t('contact.success_message'), [{
				text: 'OK',
				onPress: () => { reset(); router.back() },
			}])
		},
		onError: () => {
			Alert.alert(t('contact.error_title'), t('contact.error_message'))
		},
	})

	const handleGoBack = () => { router.back() }
	const handleEmailPress = () => { Linking.openURL(`mailto:${CONTACT_INFO.email}`) }
	const handlePhonePress = () => { Linking.openURL(`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`) }

	const onSubmit = (data: ContactFormData) => {
		sendMessage({
			name: data.name,
			email: data.email,
			subject: data.subject,
			message: data.message,
		})
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			{/* Header */}
			<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('contact.title')}</Text>
				<View style={styles.headerRight} />
			</View>

			<KeyboardAvoidWrapper style={styles.keyboardView}>
				<ThemedScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
					withSafeBottom
				>
					{/* Hero Section */}
					<View style={styles.heroSection}>
						<Text style={[styles.heroTitle, { color: colors.text }]}>{t('contact.hero_title')}</Text>
						<Text style={[styles.heroDescription, { color: colors.textMuted }]}>{t('contact.hero_description')}</Text>
					</View>

					{/* Contact Cards */}
					<View style={styles.contactCardsContainer}>
						<ContactCard
							icon={<Mail size={22} color={colors.primaryColor} />}
							title={t('contact.email_us')}
							value={CONTACT_INFO.email}
							subtitle={t('contact.email_response_time')}
							onPress={handleEmailPress}
						/>
						<ContactCard
							icon={<Phone size={22} color={colors.primaryColor} />}
							title={t('contact.call_us')}
							value={CONTACT_INFO.phone}
							subtitle={CONTACT_INFO.workingHours}
							onPress={handlePhonePress}
						/>
					</View>

					{/* Message Form */}
					<View style={styles.formSection}>
						<View style={styles.formHeader}>
							<MessageCircle size={18} color={colors.textMuted} />
							<Text style={[styles.formSectionTitle, { color: colors.textMuted }]}>{t('contact.send_message')}</Text>
						</View>

						<View style={[styles.formCard, { backgroundColor: cardColor }]}>
							<View style={styles.inputGroup}>
								<FormInput control={control} name='name' label={t('contact.your_name')} placeholder={t('contact.name_placeholder')} required rules={{ required: t('contact.errors.name_required'), minLength: { value: 2, message: t('contact.errors.name_min') } }} autoCapitalize='words' autoCorrect={false} />
							</View>
							<View style={styles.inputGroup}>
								<FormInput control={control} name='phone' label={t('contact.phone_number')} placeholder={t('contact.phone_placeholder')} required rules={{ required: t('contact.errors.phone_required'), pattern: { value: /^[0-9]{10,15}$/, message: t('contact.errors.phone_invalid') } }} keyboardType='phone-pad' autoCapitalize='none' autoCorrect={false} />
							</View>
							<View style={styles.inputGroup}>
								<FormInput control={control} name='subject' label={t('contact.subject')} placeholder={t('contact.subject_placeholder')} required rules={{ required: t('contact.errors.subject_required'), minLength: { value: 5, message: t('contact.errors.subject_min') } }} autoCapitalize='sentences' />
							</View>
							<View style={styles.inputGroup}>
								<FormInput control={control} name='message' label={t('contact.message')} placeholder={t('contact.message_placeholder')} required type='textarea' rows={5} rules={{ required: t('contact.errors.message_required'), minLength: { value: 20, message: t('contact.errors.message_min') } }} autoCapitalize='sentences' />
							</View>

							<TouchableOpacity
								style={[styles.submitButton, { backgroundColor: colors.primaryColor }, (isSubmitting || !isValid) && styles.submitButtonDisabled]}
								onPress={handleSubmit(onSubmit)}
								disabled={isSubmitting || !isValid}
								activeOpacity={0.8}
							>
								<Send size={18} color='#fff' />
								<Text style={styles.submitButtonText}>
									{isSubmitting ? t('contact.sending') : t('contact.send_message_btn')}
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Help Card */}
					<View style={[styles.helpCard, { backgroundColor: colors.infoCardBg, borderColor: colors.infoCardBorder }]}>
						<Text style={[styles.helpTitle, { color: colors.infoCardText }]}>{t('contact.help_title')}</Text>
						<Text style={[styles.helpText, { color: colors.infoCardText }]}>{t('contact.help_description')}</Text>
					</View>
				</ThemedScrollView>
			</KeyboardAvoidWrapper>
		</View>
	)
}

export default ContactPage

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
	},
	backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
	headerTitle: { fontSize: 18, fontWeight: '600' },
	headerRight: { width: 40 },
	keyboardView: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent: { padding: 16, paddingBottom: 16 },
	heroSection: { marginBottom: 20 },
	heroTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
	heroDescription: { fontSize: 15, lineHeight: 22 },
	contactCardsContainer: { gap: 12, marginBottom: 24 },
	contactCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12 },
	contactIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
	contactContent: { flex: 1 },
	contactTitle: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
	contactValue: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
	contactSubtitle: { fontSize: 12 },
	formSection: { marginBottom: 20 },
	formHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 },
	formSectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
	formCard: { borderRadius: 16, padding: 20 },
	inputGroup: { marginBottom: 16 },
	submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8, marginTop: 8 },
	submitButtonDisabled: { opacity: 0.6 },
	submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
	helpCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
	helpTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
	helpText: { fontSize: 13, lineHeight: 20 },
})
