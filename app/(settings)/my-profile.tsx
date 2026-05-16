import { useProfileQuery } from '@/api/hooks'
import RemoteImage from '@/components/shared/RemoteImage'
import ThemedScrollView from '@/components/themed-scrollview'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { router } from 'expo-router'
import { ArrowLeft, BadgeCheck, MapPin, Pencil, User } from 'lucide-react-native'
import React from 'react'
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

//  InfoRow 

interface InfoRowProps {
	label: string
	value: string | null | undefined
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
	const colors = useThemeColors()
	const { t } = useTranslations()

	return (
		<View style={styles.infoRow}>
			<Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
			<Text
				style={[
					styles.infoValue,
					{ color: colors.textMuted, opacity: value ? 1 : 0.5 },
				]}
				numberOfLines={1}
			>
				{value || t('my_profile.not_specified')}
			</Text>
		</View>
	)
}

//  StatItem 
interface StatItemProps {
	value: number
	label: string
	isLoading?: boolean
}

const StatItem: React.FC<StatItemProps> = ({ value, label, isLoading }) => {
	const colors = useThemeColors()

	return (
		<View style={styles.statItem}>
			{isLoading ? (
				<ActivityIndicator size='small' color={colors.primaryColor} style={{ marginBottom: 4 }} />
			) : (
				<Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
			)}
			<Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
		</View>
	)
}

//  Main page 
const MyProfilePage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')
	const textColor = useColor('text')
	const mutedTextColor = useColor('textMuted')
	const insets = useSafeAreaInsets()

	//  API 
	const { data: profileRes, isLoading: profileLoading } = useProfileQuery()

	const listingsCount = profileRes?.data?.data?.total_products ?? 0
	const likedCount = profileRes?.data?.data?.total_likes ?? 0
	const phoneNumber = profileRes?.data?.data?.phone_number
	const email = profileRes?.data?.data?.email
	const bio = profileRes?.data?.data?.bio

	console.log('Profile data:', profileRes?.data?.data)

	// Display name: "First Last" -> @username -> phone_number -> "--"
	const displayName =
		profileRes?.data?.data?.first_name || profileRes?.data?.data?.last_name
			? [profileRes?.data?.data?.first_name, profileRes?.data?.data?.last_name].filter(Boolean).join(' ')
			: profileRes?.data?.data?.username ?? profileRes?.data?.data?.phone_number ?? '--'

	//  Loading 
	if (profileLoading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.profileBackground, paddingBottom: insets.bottom }]}>
				<View
					style={[
						styles.header,
						{ backgroundColor: colors.background, borderBottomColor: colors.borderColor },
					]}
				>
					<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
						<ArrowLeft size={24} color={colors.text} />
					</TouchableOpacity>
					<Text style={[styles.headerTitle, { color: colors.text }]}>{t('my_profile.title')}</Text>
					<View style={styles.headerRight} />
				</View>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color={colors.primaryColor} />
				</View>
			</View>
		)
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background}]}>
			{/* Header */}
			<View
				style={[
					styles.header,
					{ backgroundColor: colors.background, borderBottomColor: colors.borderColor },
				]}
			>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.primaryColor }]}>
					{t('my_profile.title')}
				</Text>
				<View style={styles.headerRight} />
			</View>

			<ThemedScrollView
				style={[styles.scrollView, { backgroundColor: colors.profileBackground }]}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				withSafeBottom
			>
				{/* Profile Card */}
				<View style={[styles.card, { backgroundColor: cardColor }]}>
					<View style={styles.profileSection}>
						{/* Avatar */}
						<View style={styles.avatarWrapper}>
							{profileRes?.data?.data?.profile_image_url ? (
								<RemoteImage
									src={profileRes.data.data.profile_image_url}
									style={styles.avatarImage}
									resizeMode='cover'
								/>
							) : (
								<View
									style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryColor }]}
								>
									<User size={50} color='#fff' strokeWidth={1.5} />
								</View>
							)}
						</View>

						{/* Name */}
						<Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>

						{/* @username */}
						{profileRes?.data?.data?.username && (
							<Text style={[styles.usernameHandle, { color: colors.textMuted }]}>
								@{profileRes.data.data.username}
							</Text>
						)}

						{/* Verified */}
						{profileRes?.data?.data?.is_verified && (
							<View
								style={[styles.verifiedBadge, { backgroundColor: colors.primaryColor + '20' }]}
							>
								<BadgeCheck size={14} color={colors.primaryColor} />
								<Text style={[styles.verifiedText, { color: colors.primaryColor }]}>
									{t('my_profile.verified')}
								</Text>
							</View>
						)}

						{/* Location */}
						{profileRes?.data?.data?.address_name && (
							<View style={styles.locationRow}>
								<MapPin size={13} color={colors.textMuted} />
								<Text style={[styles.locationText, { color: colors.textMuted }]}>
									{profileRes.data.data.address_name}
								</Text>
							</View>
						)}

						{/* Edit button */}
						<TouchableOpacity
							style={[styles.editButton, { backgroundColor: colors.primaryColor }]}
							onPress={() => router.push('/(settings)/edit-profile')}
							activeOpacity={0.8}
						>
							<Pencil size={18} color='#fff' />
							<Text style={styles.editButtonText}>{t('my_profile.edit_profile')}</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Account Information Card */}
				<View style={[styles.card, { backgroundColor: cardColor }]}>
					<Text style={[styles.sectionTitle, { color: mutedTextColor }]}>
						{t('my_profile.account_information')}
					</Text>

					<InfoRow label={t('my_profile.phone_number')} value={phoneNumber} />
					<InfoRow label={t('my_profile.email')} value={email} />

					{bio ? (
						<View style={styles.bioRow}>
							<Text style={[styles.infoLabel, { color: textColor }]}>
								{t('my_profile.bio')}
							</Text>
							<Text style={[styles.bioText, { color: mutedTextColor }]}>{bio}</Text>
						</View>
					) : (
						<InfoRow label={t('my_profile.bio')} value={null} />
					)}
				</View>

				{/* Activity Card */}
				<View style={[styles.card, { backgroundColor: cardColor }]}>
					<Text style={[styles.sectionTitle, { color: mutedTextColor }]}>
						{t('my_profile.activity')}
					</Text>

					<View style={styles.statsContainer}>
						<StatItem
							value={listingsCount}
							label={t('my_profile.listings')}
							isLoading={profileLoading}
						/>
						<View style={[styles.statDivider, { backgroundColor: mutedTextColor }]} />
						<StatItem
							value={likedCount}
							label={t('my_profile.liked')}
							isLoading={profileLoading}
						/>
					</View>
				</View>
			</ThemedScrollView>
		</View >
	)
}

export default MyProfilePage

const styles = StyleSheet.create({
	container: { flex: 1 },
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		borderBottomWidth: 1,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'flex-start',
	},
	headerTitle: { fontSize: 18, fontWeight: '600' },
	headerRight: { width: 40 },
	scrollView: { flex: 1 },
	scrollContent:
	{
		padding: 10,
	},
	card: { borderRadius: 16, padding: 20, marginBottom: 16 },
	profileSection: { alignItems: 'center' },
	avatarWrapper: { marginBottom: 16 },
	avatarImage: { width: 100, height: 100, borderRadius: 50 },
	avatarPlaceholder: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	userName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
	usernameHandle: { fontSize: 14, marginBottom: 10 },
	verifiedBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 20,
		marginBottom: 8,
	},
	verifiedText: { fontSize: 12, fontWeight: '600' },
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginBottom: 20,
	},
	locationText: { fontSize: 13 },
	editButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 12,
		width: '100%',
		gap: 8,
		marginTop: 4,
	},
	editButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
	sectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 16,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
	},
	infoLabel: { fontSize: 15, fontWeight: '500' },
	infoValue: { fontSize: 15, maxWidth: '55%', textAlign: 'right' },
	bioRow: { paddingVertical: 12 },
	bioText: { fontSize: 14, lineHeight: 20, marginTop: 6 },
	statsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		paddingVertical: 8,
	},
	statItem: { alignItems: 'center', flex: 1 },
	statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
	statLabel: { fontSize: 13 },
	statDivider: { width: 1, height: 40 },
})