import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router } from 'expo-router'
import { ArrowLeft, Pencil, User } from 'lucide-react-native'
import React from 'react'
import {
	Image,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

// Types for user profile data
interface UserProfile {
	id: string
	name: string
	profileImage: string | null
	temperature: string
	isActive: boolean
	phoneNumber: string
	memberSince: string
	stats: {
		listings: number
		sold: number
		reviews: number
	}
}

// Mock user data - replace with actual data from API/context
const mockUserProfile: UserProfile = {
	id: '1',
	name: 'John Doe',
	profileImage: null,
	temperature: '36.3°C',
	isActive: true,
	phoneNumber: '+82 10-1234-5678',
	memberSince: 'January 2024',
	stats: {
		listings: 12,
		sold: 8,
		reviews: 24,
	},
}

// Reusable components
interface ProfileAvatarProps {
	imageUri: string | null
	size?: number
	showStatus?: boolean
	isActive?: boolean
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
	imageUri,
	size = 100,
	showStatus = false,
	isActive = true,
}) => {
	const colors = useThemeColors()
	const statusSize = size * 0.16

	return (
		<View style={styles.avatarWrapper}>
			{imageUri ? (
				<Image
					source={{ uri: imageUri }}
					style={[
						styles.avatarImage,
						{ width: size, height: size, borderRadius: size / 2 },
					]}
				/>
			) : (
				<View
					style={[
						styles.avatarPlaceholder,
						{
							width: size,
							height: size,
							borderRadius: size / 2,
							backgroundColor: colors.primaryColor,
						},
					]}
				>
					<User size={size * 0.5} color='#fff' strokeWidth={1.5} />
				</View>
			)}
			{showStatus && (
				<View
					style={[
						styles.statusIndicator,
						{
							width: statusSize,
							height: statusSize,
							borderRadius: statusSize / 2,
							backgroundColor: isActive ? '#10b981' : colors.textMuted,
							borderColor: colors.background,
						},
					]}
				/>
			)}
		</View>
	)
}

interface InfoRowProps {
	label: string
	value: string
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
	const colors = useThemeColors()

	return (
		<View style={styles.infoRow}>
			<Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
			<Text style={[styles.infoValue, { color: colors.textMuted }]}>{value}</Text>
		</View>
	)
}

interface StatItemProps {
	value: number
	label: string
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => {
	const colors = useThemeColors()

	return (
		<View style={styles.statItem}>
			<Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
			<Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
		</View>
	)
}

const MyProfilePage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()

	// In real app, fetch user data from context/API
	const user = mockUserProfile

	const handleGoBack = () => {
		router.back()
	}

	const handleEditProfile = () => {
		router.push('/(settings)/edit-profile')
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
					{t('my_profile.title')}
				</Text>
				<View style={styles.headerRight} />
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Card */}
				<View style={[styles.card, { backgroundColor: colors.background }]}>
					<View style={styles.profileSection}>
						<ProfileAvatar
							imageUri={user.profileImage}
							size={100}
							showStatus
							isActive={user.isActive}
						/>

						<Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>

						<View style={styles.statusBadge}>
							<View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
							<Text style={[styles.statusText, { color: colors.textMuted }]}>
								{user.temperature} {t('my_profile.active')}
							</Text>
						</View>

						<TouchableOpacity
							style={[styles.editButton, { backgroundColor: colors.primaryColor }]}
							onPress={handleEditProfile}
							activeOpacity={0.8}
						>
							<Pencil size={18} color='#fff' />
							<Text style={styles.editButtonText}>{t('my_profile.edit_profile')}</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Account Information Card */}
				<View style={[styles.card, { backgroundColor: colors.background }]}>
					<Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
						{t('my_profile.account_information')}
					</Text>

					<InfoRow label={t('my_profile.phone_number')} value={user.phoneNumber} />
					<InfoRow label={t('my_profile.member_since')} value={user.memberSince} />
				</View>

				{/* Activity Card */}
				<View style={[styles.card, { backgroundColor: colors.background }]}>
					<Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
						{t('my_profile.activity')}
					</Text>

					<View style={styles.statsContainer}>
						<StatItem value={user.stats.listings} label={t('my_profile.listings')} />
						<View style={[styles.statDivider, { backgroundColor: colors.borderColor }]} />
						<StatItem value={user.stats.sold} label={t('my_profile.sold')} />
						<View style={[styles.statDivider, { backgroundColor: colors.borderColor }]} />
						<StatItem value={user.stats.reviews} label={t('my_profile.reviews')} />
					</View>
				</View>
			</ScrollView>
		</View>
	)
}

export default MyProfilePage

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
	card: {
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
	},
	profileSection: {
		alignItems: 'center',
	},
	avatarWrapper: {
		position: 'relative',
		marginBottom: 16,
	},
	avatarImage: {
		resizeMode: 'cover',
	},
	avatarPlaceholder: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	statusIndicator: {
		position: 'absolute',
		bottom: 4,
		right: 4,
		borderWidth: 3,
	},
	userName: {
		fontSize: 22,
		fontWeight: '700',
		marginBottom: 8,
	},
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 6,
	},
	statusText: {
		fontSize: 14,
	},
	editButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 12,
		width: '100%',
		gap: 8,
	},
	editButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
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
	infoLabel: {
		fontSize: 15,
		fontWeight: '500',
	},
	infoValue: {
		fontSize: 15,
	},
	statsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		paddingVertical: 8,
	},
	statItem: {
		alignItems: 'center',
		flex: 1,
	},
	statValue: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 13,
	},
	statDivider: {
		width: 1,
		height: 40,
	},
})
