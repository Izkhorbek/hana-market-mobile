import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { router } from 'expo-router'
import {
	ArrowLeft,
	Heart,
	HeartHandshake,
	Shield,
	ShoppingBag,
	Sparkles,
	Users,
} from 'lucide-react-native'
import React from 'react'
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

// App version info
const APP_VERSION = '1.0.0'
const APP_YEAR = '2025'

// Value Item Component
interface ValueItemProps {
	icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
	iconBgColor: string
	iconColor: string
	title: string
	description: string
}

const ValueItem: React.FC<ValueItemProps> = ({
	icon: Icon,
	iconBgColor,
	iconColor,
	title,
	description,
}) => {
	const colors = useThemeColors()

	return (
		<View style={styles.valueItem}>
			<View style={[styles.valueIconContainer, { backgroundColor: iconBgColor }]}>
				<Icon size={20} color={iconColor} strokeWidth={1.5} />
			</View>
			<View style={styles.valueContent}>
				<Text style={[styles.valueTitle, { color: colors.text }]}>{title}</Text>
				<Text style={[styles.valueDescription, { color: colors.textMuted }]}>
					{description}
				</Text>
			</View>
		</View>
	)
}

// Section Component
interface SectionProps {
	title: string
	children: React.ReactNode
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
	const colors = useThemeColors()

	return (
		<View style={styles.section}>
			<Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
			{children}
		</View>
	)
}

const AboutPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')

	const handleGoBack = () => {
		router.back()
	}

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
					{t('about.title')}
				</Text>
				<View style={styles.headerRight} />
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* App Logo & Info Card */}
				<View style={[styles.logoCard, { backgroundColor: cardColor }]}>
					<View style={[styles.logoContainer, { backgroundColor: colors.primaryColor }]}>
						<ShoppingBag size={32} color='#fff' strokeWidth={1.5} />
					</View>
					<Text style={[styles.appName, { color: colors.text }]}>Hana Market</Text>
					<Text style={[styles.versionText, { color: colors.textMuted }]}>
						{t('about.version')} {APP_VERSION}
					</Text>
					<Text style={[styles.tagline, { color: colors.textMuted }]}>
						{t('about.tagline')}
					</Text>
				</View>

				{/* Mission Card */}
				<View style={[styles.missionCard, { backgroundColor: colors.primaryColor }]}>
					<View style={styles.missionIconContainer}>
						<HeartHandshake size={28} color='#fff' strokeWidth={1.5} />
					</View>
					<Text style={styles.missionTitle}>{t('about.mission_title')}</Text>
					<Text style={styles.missionText}>{t('about.mission_text')}</Text>
				</View>

				{/* About the App Section */}
				<Section title={t('about.about_app_title')}>
					<View style={[styles.textCard, { backgroundColor: cardColor }]}>
						<Text style={[styles.bodyText, { color: colors.textMuted }]}>
							{t('about.about_app_text_1')}
						</Text>
						<Text style={[styles.bodyText, { color: colors.textMuted, marginTop: 12 }]}>
							{t('about.about_app_text_2')}
						</Text>
					</View>
				</Section>

				{/* What We Stand For Section */}
				<Section title={t('about.values_title')}>
					<View style={[styles.valuesCard, { backgroundColor: cardColor }]}>
						<ValueItem
							icon={Users}
							iconBgColor={`${colors.primaryColor}15`}
							iconColor={colors.primaryColor}
							title={t('about.value_community_title')}
							description={t('about.value_community_desc')}
						/>
						<ValueItem
							icon={Shield}
							iconBgColor='#FEF3C7'
							iconColor='#D97706'
							title={t('about.value_trust_title')}
							description={t('about.value_trust_desc')}
						/>
						<ValueItem
							icon={Sparkles}
							iconBgColor='#EDE9FE'
							iconColor='#7C3AED'
							title={t('about.value_simplicity_title')}
							description={t('about.value_simplicity_desc')}
						/>
					</View>
				</Section>

				{/* Made with Care Section */}
				<Section title={t('about.made_with_care_title')}>
					<View style={[styles.textCard, { backgroundColor: cardColor }]}>
						<Text style={[styles.bodyText, { color: colors.textMuted }]}>
							{t('about.made_with_care_text')}
						</Text>
					</View>
				</Section>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={[styles.footerCopyright, { color: colors.textMuted }]}>
						© {APP_YEAR} Hana Market. {t('about.all_rights_reserved')}
					</Text>
					<View style={styles.footerLove}>
						<Text style={[styles.footerLoveText, { color: colors.textMuted }]}>
							{t('about.built_with')}
						</Text>
						<Heart size={14} color='#EF4444' fill='#EF4444' />
						<Text style={[styles.footerLoveText, { color: colors.textMuted }]}>
							{t('about.for_communities')}
						</Text>
					</View>
				</View>
			</ScrollView>
		</View>
	)
}

export default AboutPage

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
		paddingBottom: 40,
	},
	logoCard: {
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		marginBottom: 16,
	},
	logoContainer: {
		width: 72,
		height: 72,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	appName: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 4,
	},
	versionText: {
		fontSize: 13,
		marginBottom: 12,
	},
	tagline: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
	missionCard: {
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		marginBottom: 24,
	},
	missionIconContainer: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	missionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#fff',
		marginBottom: 8,
	},
	missionText: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.9)',
		textAlign: 'center',
		lineHeight: 22,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 12,
		paddingHorizontal: 4,
	},
	textCard: {
		borderRadius: 16,
		padding: 20,
	},
	bodyText: {
		fontSize: 14,
		lineHeight: 22,
	},
	valuesCard: {
		borderRadius: 16,
		padding: 16,
	},
	valueItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingVertical: 12,
	},
	valueIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 14,
	},
	valueContent: {
		flex: 1,
	},
	valueTitle: {
		fontSize: 15,
		fontWeight: '600',
		marginBottom: 4,
	},
	valueDescription: {
		fontSize: 13,
		lineHeight: 19,
	},
	footer: {
		alignItems: 'center',
		paddingTop: 8,
		paddingBottom: 16,
	},
	footerCopyright: {
		fontSize: 12,
		marginBottom: 8,
	},
	footerLove: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	footerLoveText: {
		fontSize: 12,
	},
})
