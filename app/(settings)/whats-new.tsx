import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { router } from 'expo-router'
import {
	ArrowLeft,
	Bell,
	Bookmark,
	Grid3X3,
	Heart,
	Image,
	LayoutDashboard,
	List,
	Map,
	MapPin,
	MessageCircle,
	Search,
	ShieldCheck,
	ShoppingBag,
	Sparkles,
	User,
	UserPlus,
} from 'lucide-react-native'
import React, { useState } from 'react'
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

// Types
interface FeatureItem {
	id: string
	icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
	title: string
	description: string
}

interface VersionRelease {
	version: string
	date: string
	isLatest?: boolean
	features: FeatureItem[]
}

// Feature Item Component
interface FeatureItemProps {
	icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
	title: string
	description: string
	iconColor: string
	iconBgColor: string
}

const FeatureItemCard: React.FC<FeatureItemProps> = ({
	icon: Icon,
	title,
	description,
	iconColor,
	iconBgColor,
}) => {
	const colors = useThemeColors()

	return (
		<View style={styles.featureItem}>
			<View style={[styles.featureIconContainer, { backgroundColor: iconBgColor }]}>
				<Icon size={18} color={iconColor} strokeWidth={1.5} />
			</View>
			<View style={styles.featureContent}>
				<Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
				<Text style={[styles.featureDescription, { color: colors.textMuted }]}>
					{description}
				</Text>
			</View>
		</View>
	)
}

// Version Section Component
interface VersionSectionProps {
	version: string
	date: string
	isLatest?: boolean
	features: FeatureItem[]
	isExpanded: boolean
	onToggle: () => void
}

const VersionSection: React.FC<VersionSectionProps> = ({
	version,
	date,
	isLatest = false,
	features,
	isExpanded,
	onToggle,
}) => {
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')

	return (
		<View style={styles.versionSection}>
			{/* Version Header */}
			<View style={styles.versionHeader}>
				<View style={styles.versionInfo}>
					<Text style={[styles.versionLabel, { color: colors.textMuted }]}>Version</Text>
					<View style={styles.versionRow}>
						<Text style={[styles.versionNumber, { color: colors.text }]}>{version}</Text>
						{isLatest && (
							<View style={[styles.latestBadge, { backgroundColor: colors.primaryColor }]}>
								<Text style={styles.latestBadgeText}>LATEST</Text>
							</View>
						)}
					</View>
				</View>
				<Text style={[styles.versionDate, { color: colors.textMuted }]}>{date}</Text>
			</View>

			{/* Features List */}
			<View style={[styles.featuresCard, { backgroundColor: cardColor }]}>
				{features.map((feature, index) => (
					<FeatureItemCard
						key={feature.id}
						icon={feature.icon}
						title={feature.title}
						description={feature.description}
						iconColor={colors.primaryColor}
						iconBgColor={`${colors.primaryColor}15`}
					/>
				))}
			</View>

			{/* Older Versions Toggle */}
			<TouchableOpacity
				style={styles.olderVersionsButton}
				onPress={onToggle}
				activeOpacity={0.7}
			>
				<Text style={[styles.olderVersionsText, { color: colors.textMuted }]}>
					{isExpanded ? 'Hide older versions' : 'Older versions'}
				</Text>
			</TouchableOpacity>
		</View>
	)
}

// Hero Card Component
const HeroCard: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()

	return (
		<View style={[styles.heroCard, { backgroundColor: colors.primaryColor }]}>
			<View style={styles.heroIconContainer}>
				<Sparkles size={28} color='#fff' strokeWidth={1.5} />
			</View>
			<Text style={styles.heroTitle}>{t('whats_new.hero_title')}</Text>
			<Text style={styles.heroDescription}>{t('whats_new.hero_description')}</Text>
		</View>
	)
}

const WhatsNewPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

	const handleGoBack = () => {
		router.back()
	}

	const toggleVersion = (version: string) => {
		setExpandedVersions(prev => {
			const newSet = new Set(prev)
			if (newSet.has(version)) {
				newSet.delete(version)
			} else {
				newSet.add(version)
			}
			return newSet
		})
	}

	// Release data - in real app, this would come from API
	const releases: VersionRelease[] = [
		{
			version: '1.1.0',
			date: 'February 2025',
			isLatest: true,
			features: [
				{
					id: '1-1',
					icon: Search,
					title: t('whats_new.features.enhanced_search'),
					description: t('whats_new.features.enhanced_search_desc'),
				},
				{
					id: '1-2',
					icon: Map,
					title: t('whats_new.features.interactive_maps'),
					description: t('whats_new.features.interactive_maps_desc'),
				},
				{
					id: '1-3',
					icon: LayoutDashboard,
					title: t('whats_new.features.dashboard'),
					description: t('whats_new.features.dashboard_desc'),
				},
				{
					id: '1-4',
					icon: ShieldCheck,
					title: t('whats_new.features.verification'),
					description: t('whats_new.features.verification_desc'),
				},
				{
					id: '1-5',
					icon: MapPin,
					title: t('whats_new.features.neighborhood'),
					description: t('whats_new.features.neighborhood_desc'),
				},
			],
		},
		{
			version: '0.9.5',
			date: 'January 2025',
			features: [
				{
					id: '2-1',
					icon: MessageCircle,
					title: t('whats_new.features.realtime_chat'),
					description: t('whats_new.features.realtime_chat_desc'),
				},
				{
					id: '2-2',
					icon: Heart,
					title: t('whats_new.features.favorites'),
					description: t('whats_new.features.favorites_desc'),
				},
				{
					id: '2-3',
					icon: User,
					title: t('whats_new.features.profile_customization'),
					description: t('whats_new.features.profile_customization_desc'),
				},
			],
		},
		{
			version: '0.9.0',
			date: 'December 2024',
			features: [
				{
					id: '3-1',
					icon: Grid3X3,
					title: t('whats_new.features.category_browsing'),
					description: t('whats_new.features.category_browsing_desc'),
				},
				{
					id: '3-2',
					icon: List,
					title: t('whats_new.features.listing_management'),
					description: t('whats_new.features.listing_management_desc'),
				},
				{
					id: '3-3',
					icon: Image,
					title: t('whats_new.features.image_upload'),
					description: t('whats_new.features.image_upload_desc'),
				},
				{
					id: '3-4',
					icon: Bell,
					title: t('whats_new.features.push_notifications'),
					description: t('whats_new.features.push_notifications_desc'),
				},
			],
		},
		{
			version: '0.8.0',
			date: 'November 2024',
			features: [
				{
					id: '4-1',
					icon: Sparkles,
					title: t('whats_new.features.initial_release'),
					description: t('whats_new.features.initial_release_desc'),
				},
				{
					id: '4-2',
					icon: ShoppingBag,
					title: t('whats_new.features.browse_listings'),
					description: t('whats_new.features.browse_listings_desc'),
				},
				{
					id: '4-3',
					icon: UserPlus,
					title: t('whats_new.features.user_accounts'),
					description: t('whats_new.features.user_accounts_desc'),
				},
			],
		},
	]

	// Show first version always, others based on expansion state
	const visibleReleases = releases.filter(
		(release, index) => index === 0 || expandedVersions.has(releases[index - 1].version)
	)

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
					{t('whats_new.title')}
				</Text>
				<View style={styles.headerRight} />
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Hero Card */}
				<HeroCard />

				{/* Version Releases */}
				{releases.map((release, index) => (
					<VersionSection
						key={release.version}
						version={release.version}
						date={release.date}
						isLatest={release.isLatest}
						features={release.features}
						isExpanded={expandedVersions.has(release.version)}
						onToggle={() => toggleVersion(release.version)}
					/>
				))}

				{/* Footer Note */}
				<View
					style={[
						styles.footerCard,
						{
							backgroundColor: colors.infoCardBg,
							borderColor: colors.infoCardBorder,
						},
					]}
				>
					<Text style={[styles.footerText, { color: colors.infoCardText }]}>
						{t('whats_new.footer_note')}
					</Text>
				</View>
			</ScrollView>
		</View>
	)
}

export default WhatsNewPage

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
	heroCard: {
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		marginBottom: 24,
	},
	heroIconContainer: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	heroTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#fff',
		marginBottom: 8,
		textAlign: 'center',
	},
	heroDescription: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.9)',
		textAlign: 'center',
		lineHeight: 20,
	},
	versionSection: {
		marginBottom: 8,
	},
	versionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 12,
		paddingHorizontal: 4,
	},
	versionInfo: {
		flex: 1,
	},
	versionLabel: {
		fontSize: 12,
		fontWeight: '500',
		marginBottom: 2,
	},
	versionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	versionNumber: {
		fontSize: 18,
		fontWeight: '700',
	},
	latestBadge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
	},
	latestBadgeText: {
		fontSize: 10,
		fontWeight: '700',
		color: '#fff',
	},
	versionDate: {
		fontSize: 13,
		marginTop: 4,
	},
	featuresCard: {
		borderRadius: 12,
		padding: 4,
		marginBottom: 8,
	},
	featureItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: 12,
	},
	featureIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	featureContent: {
		flex: 1,
	},
	featureTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 2,
	},
	featureDescription: {
		fontSize: 13,
		lineHeight: 18,
	},
	olderVersionsButton: {
		alignItems: 'center',
		paddingVertical: 12,
	},
	olderVersionsText: {
		fontSize: 13,
		fontWeight: '500',
	},
	footerCard: {
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		marginTop: 8,
	},
	footerText: {
		fontSize: 13,
		lineHeight: 20,
		textAlign: 'center',
	},
})
