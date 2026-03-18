import { useAboutUsQuery } from '@/api/hooks'
import { HEADER_PADDING_TOP } from '@/constants/appLimits'
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
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'

const APP_YEAR = '2025'

interface ValueItemProps {
	emojiIcon?: string
	icon?: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
	iconBgColor: string
	iconColor: string
	title: string
	description: string
}

const ValueItem: React.FC<ValueItemProps> = ({ emojiIcon, icon: Icon, iconBgColor, iconColor, title, description }) => {
	const colors = useThemeColors()

	return (
		<View style={styles.valueItem}>
			<View style={[styles.valueIconContainer, { backgroundColor: iconBgColor }]}>
				{emojiIcon ? (
					<Text style={styles.emojiIcon}>{emojiIcon}</Text>
				) : Icon ? (
					<Icon size={20} color={iconColor} strokeWidth={1.5} />
				) : null}
			</View>
			<View style={styles.valueContent}>
				<Text style={[styles.valueTitle, { color: colors.text }]}>{title}</Text>
				<Text style={[styles.valueDescription, { color: colors.textMuted }]}>{description}</Text>
			</View>
		</View>
	)
}

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

	const { data, isLoading } = useAboutUsQuery()
	const apiData = data?.data?.data

	const handleGoBack = () => { router.back() }

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			{/* Header */}
			<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('about.title')}</Text>
				<View style={styles.headerRight} />
			</View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color={colors.primaryColor} />
				</View>
			) : (
				<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					{/* App Logo & Info Card */}
					<View style={[styles.logoCard, { backgroundColor: cardColor }]}>
						<View style={[styles.logoContainer, { backgroundColor: colors.primaryColor }]}>
							<ShoppingBag size={32} color='#fff' strokeWidth={1.5} />
						</View>
						<Text style={[styles.appName, { color: colors.text }]}>
							{apiData?.header.app_name ?? 'Hana Market'}
						</Text>
						<Text style={[styles.versionText, { color: colors.textMuted }]}>
							{t('about.version')} {apiData?.header.version ?? '1.0.0'}
						</Text>
						<Text style={[styles.tagline, { color: colors.textMuted }]}>
							{apiData?.header.tagline ?? t('about.tagline')}
						</Text>
					</View>

					{/* Mission Card */}
					<View style={[styles.missionCard, { backgroundColor: colors.primaryColor }]}>
						<View style={styles.missionIconContainer}>
							<HeartHandshake size={28} color='#fff' strokeWidth={1.5} />
						</View>
						<Text style={styles.missionTitle}>
							{apiData?.mission.title ?? t('about.mission_title')}
						</Text>
						<Text style={styles.missionText}>
							{apiData?.mission.description ?? t('about.mission_text')}
						</Text>
					</View>

					{/* About the App Section */}
					<Section title={apiData?.about_app.title ?? t('about.about_app_title')}>
						<View style={[styles.textCard, { backgroundColor: cardColor }]}>
							{apiData?.about_app.paragraphs ? (
								apiData.about_app.paragraphs.map((para, i) => (
									<Text key={i} style={[styles.bodyText, { color: colors.textMuted, marginTop: i > 0 ? 12 : 0 }]}>
										{para}
									</Text>
								))
							) : (
								<>
									<Text style={[styles.bodyText, { color: colors.textMuted }]}>{t('about.about_app_text_1')}</Text>
									<Text style={[styles.bodyText, { color: colors.textMuted, marginTop: 12 }]}>{t('about.about_app_text_2')}</Text>
								</>
							)}
						</View>
					</Section>

					{/* Values Section */}
					<Section title={t('about.values_title')}>
						<View style={[styles.valuesCard, { backgroundColor: cardColor }]}>
							{apiData?.values ? (
								apiData.values.map((val, i) => (
									<ValueItem
										key={i}
										emojiIcon={val.icon}
										iconBgColor={`${colors.primaryColor}15`}
										iconColor={colors.primaryColor}
										title={val.title}
										description={val.description}
									/>
								))
							) : (
								<>
									<ValueItem icon={Users} iconBgColor={`${colors.primaryColor}15`} iconColor={colors.primaryColor} title={t('about.value_community_title')} description={t('about.value_community_desc')} />
									<ValueItem icon={Shield} iconBgColor='#FEF3C7' iconColor='#D97706' title={t('about.value_trust_title')} description={t('about.value_trust_desc')} />
									<ValueItem icon={Sparkles} iconBgColor='#EDE9FE' iconColor='#7C3AED' title={t('about.value_simplicity_title')} description={t('about.value_simplicity_desc')} />
								</>
							)}
						</View>
					</Section>

					{/* Made with Care Section */}
					<Section title={t('about.made_with_care_title')}>
						<View style={[styles.textCard, { backgroundColor: cardColor }]}>
							<Text style={[styles.bodyText, { color: colors.textMuted }]}>
								{apiData?.footer.description ?? t('about.made_with_care_text')}
							</Text>
						</View>
					</Section>

					{/* Footer */}
					<View style={styles.footer}>
						<Text style={[styles.footerCopyright, { color: colors.textMuted }]}>
							{apiData?.footer.copyright ?? `© ${APP_YEAR} Hana Market. ${t('about.all_rights_reserved')}`}
						</Text>
						<View style={styles.footerLove}>
							<Text style={[styles.footerLoveText, { color: colors.textMuted }]}>
								{apiData?.footer.tagline ?? `${t('about.built_with')} `}
							</Text>
							{!apiData?.footer.tagline && (
								<>
									<Heart size={14} color='#EF4444' fill='#EF4444' />
									<Text style={[styles.footerLoveText, { color: colors.textMuted }]}>{t('about.for_communities')}</Text>
								</>
							)}
						</View>
					</View>
				</ScrollView>
			)}
		</View>
	)
}

export default AboutPage

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: HEADER_PADDING_TOP,
		paddingBottom: 16,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
	},
	backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
	headerTitle: { fontSize: 18, fontWeight: '600' },
	headerRight: { width: 40 },
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	scrollView: { flex: 1 },
	scrollContent: { padding: 16, paddingBottom: 40 },
	logoCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
	logoContainer: { width: 72, height: 72, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
	appName: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
	versionText: { fontSize: 13, marginBottom: 12 },
	tagline: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
	missionCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
	missionIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
	missionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
	missionText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', lineHeight: 22 },
	section: { marginBottom: 24 },
	sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 },
	textCard: { borderRadius: 16, padding: 20 },
	bodyText: { fontSize: 14, lineHeight: 22 },
	valuesCard: { borderRadius: 16, padding: 16 },
	valueItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
	valueIconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
	emojiIcon: { fontSize: 18 },
	valueContent: { flex: 1 },
	valueTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
	valueDescription: { fontSize: 13, lineHeight: 19 },
	footer: { alignItems: 'center', paddingTop: 8, paddingBottom: 16 },
	footerCopyright: { fontSize: 12, marginBottom: 8 },
	footerLove: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	footerLoveText: { fontSize: 12 },
})
