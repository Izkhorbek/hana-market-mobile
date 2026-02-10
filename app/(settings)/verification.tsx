import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router } from 'expo-router'
import { ArrowLeft, Camera, CheckCircle2, FileText, Shield, ShieldCheck } from 'lucide-react-native'
import React from 'react'
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

// Types
interface VerificationStep {
	id: string
	icon: React.ReactNode
	title: string
	description: string
	isCompleted: boolean
}

// Reusable Step Item Component
interface StepItemProps {
	icon: React.ReactNode
	title: string
	description: string
	isCompleted: boolean
	isLast?: boolean
}

const StepItem: React.FC<StepItemProps> = ({
	icon,
	title,
	description,
	isCompleted,
	isLast = false,
}) => {
	const colors = useThemeColors()

	return (
		<View style={[styles.stepItem, !isLast && styles.stepItemBorder]}>
			<View
				style={[
					styles.stepIconContainer,
					{
						backgroundColor: isCompleted
							? `${colors.primaryColor}15`
							: `${colors.primaryColor}10`,
						borderColor: colors.primaryColor,
					},
				]}
			>
				{icon}
			</View>
			<View style={styles.stepContent}>
				<Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
				<Text style={[styles.stepDescription, { color: colors.textMuted }]}>
					{description}
				</Text>
			</View>
		</View>
	)
}

const VerificationPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()

	const handleGoBack = () => {
		router.back()
	}

	const handleStartVerification = () => {
		// Disabled - under development
		console.log('Verification feature is under development')
	}

	const handleMaybeLater = () => {
		router.back()
	}

	// Verification steps data
	const steps: VerificationStep[] = [
		{
			id: 'selfie',
			icon: <Camera size={20} color={colors.primaryColor} />,
			title: t('verification.step_selfie_title'),
			description: t('verification.step_selfie_description'),
			isCompleted: false,
		},
		{
			id: 'upload_id',
			icon: <FileText size={20} color={colors.primaryColor} />,
			title: t('verification.step_upload_title'),
			description: t('verification.step_upload_description'),
			isCompleted: false,
		},
		{
			id: 'get_verified',
			icon: <CheckCircle2 size={20} color={colors.primaryColor} />,
			title: t('verification.step_verified_title'),
			description: t('verification.step_verified_description'),
			isCompleted: false,
		},
	]

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
					{t('verification.title')}
				</Text>
				<View style={styles.headerRight} />
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Under Development Banner */}
				<View
					style={[
						styles.devBanner,
						{
							backgroundColor: colors.infoCardBg,
							borderColor: colors.infoCardBorder,
						},
					]}
				>
					<Text style={[styles.devBannerText, { color: colors.infoCardText }]}>
						{t('verification.under_development')}
					</Text>
				</View>

				{/* Shield Icon */}
				<View style={styles.iconSection}>
					<View
						style={[
							styles.shieldIconContainer,
							{ backgroundColor: colors.borderColor },
						]}
					>
						<Shield size={48} color={colors.textMuted} strokeWidth={1.5} />
					</View>
				</View>

				{/* Title and Description */}
				<View style={styles.titleSection}>
					<Text style={[styles.mainTitle, { color: colors.text }]}>
						{t('verification.not_verified_title')}
					</Text>
					<Text style={[styles.mainDescription, { color: colors.textMuted }]}>
						{t('verification.not_verified_description')}
					</Text>
				</View>

				{/* Verification Steps Card */}
				<View style={[styles.stepsCard, { backgroundColor: colors.background }]}>
					<Text style={[styles.stepsTitle, { color: colors.textMuted }]}>
						{t('verification.steps_title')}
					</Text>

					{steps.map((step, index) => (
						<StepItem
							key={step.id}
							icon={step.icon}
							title={step.title}
							description={step.description}
							isCompleted={step.isCompleted}
							isLast={index === steps.length - 1}
						/>
					))}
				</View>

				{/* Privacy Notice */}
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
						{t('verification.privacy_notice')}
					</Text>
				</View>
			</ScrollView>

			{/* Bottom Buttons */}
			<View style={[styles.bottomContainer, { backgroundColor: colors.profileBackground }]}>
				<TouchableOpacity
					style={[
						styles.startButton,
						{ backgroundColor: colors.primaryColor },
						styles.buttonDisabled,
					]}
					onPress={handleStartVerification}
					activeOpacity={1}
					disabled
				>
					<ShieldCheck size={20} color='#fff' />
					<Text style={styles.startButtonText}>
						{t('verification.start_verification')}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.laterButton}
					onPress={handleMaybeLater}
					activeOpacity={0.7}
				>
					<Text style={[styles.laterButtonText, { color: colors.textMuted }]}>
						{t('verification.maybe_later')}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

export default VerificationPage

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
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 24,
	},
	devBanner: {
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		marginBottom: 24,
		alignItems: 'center',
	},
	devBannerText: {
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
	},
	iconSection: {
		alignItems: 'center',
		marginBottom: 24,
	},
	shieldIconContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	titleSection: {
		alignItems: 'center',
		marginBottom: 32,
		paddingHorizontal: 16,
	},
	mainTitle: {
		fontSize: 22,
		fontWeight: '700',
		marginBottom: 12,
		textAlign: 'center',
	},
	mainDescription: {
		fontSize: 15,
		lineHeight: 22,
		textAlign: 'center',
	},
	stepsCard: {
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
	},
	stepsTitle: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 16,
	},
	stepItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
	},
	stepItemBorder: {
		borderBottomWidth: 0,
	},
	stepIconContainer: {
		width: 44,
		height: 44,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 14,
	},
	stepContent: {
		flex: 1,
	},
	stepTitle: {
		fontSize: 15,
		fontWeight: '600',
		marginBottom: 2,
	},
	stepDescription: {
		fontSize: 13,
		lineHeight: 18,
	},
	privacyCard: {
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
	},
	privacyText: {
		fontSize: 13,
		lineHeight: 20,
		textAlign: 'center',
	},
	bottomContainer: {
		padding: 16,
		paddingBottom: Platform.OS === 'ios' ? 34 : 16,
	},
	startButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
		marginBottom: 12,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	startButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	laterButton: {
		alignItems: 'center',
		paddingVertical: 12,
	},
	laterButtonText: {
		fontSize: 15,
		fontWeight: '500',
	},
})
