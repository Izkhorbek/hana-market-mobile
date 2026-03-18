import { Switch } from '@/components/ui/switch'
import { HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import ProfileSection from '@/modules/Profile/ProfileSection'
import { router } from 'expo-router'
import {
	ArrowLeft,
	Bell,
	ChevronRight,
	Eye,
	Globe,
	Heart,
	Lock,
	MapPin,
	MessageSquare,
	Shield,
	User,
	UserX,
} from 'lucide-react-native'
import React, { useState } from 'react'
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'

// Types for settings state
interface NotificationSettings {
	pushNotifications: boolean
	newMessages: boolean
	listingUpdates: boolean
	favoriteAlerts: boolean
	nearbyListings: boolean
}

interface PrivacySettings {
	showProfileToOthers: boolean
	shareLocation: boolean
	onlineStatus: boolean
}

interface AccountSettings {
	twoFactorAuth: boolean
}

// Reusable Setting Item with Switch
interface SettingItemWithSwitchProps {
	icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
	title: string
	subtitle: string
	value: boolean
	onValueChange: (value: boolean) => void
	disabled?: boolean
}

const SettingItemWithSwitch: React.FC<SettingItemWithSwitchProps> = ({
	icon: Icon,
	title,
	subtitle,
	value,
	onValueChange,
	disabled = false,
}) => {
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')

	return (
		<View style={[styles.settingItem, { backgroundColor: cardColor }]}>
			<View style={styles.settingIconContainer}>
				<Icon size={20} color={colors.text} strokeWidth={1.5} />
			</View>
			<View style={styles.settingContent}>
				<Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
				<Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
					{subtitle}
				</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				disabled={disabled}
			/>
		</View>
	)
}

// Reusable Setting Item with Chevron
interface SettingItemWithChevronProps {
	icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
	title: string
	subtitle: string
	onPress: () => void
	disabled?: boolean
}

const SettingItemWithChevron: React.FC<SettingItemWithChevronProps> = ({
	icon: Icon,
	title,
	subtitle,
	onPress,
	disabled = false,
}) => {
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')

	return (
		<TouchableOpacity
			style={[styles.settingItem, { backgroundColor: cardColor }]}
			onPress={onPress}
			activeOpacity={disabled ? 1 : 0.7}
			disabled={disabled}
		>
			<View style={styles.settingIconContainer}>
				<Icon size={20} color={colors.text} strokeWidth={1.5} />
			</View>
			<View style={styles.settingContent}>
				<Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
				<Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
					{subtitle}
				</Text>
			</View>
			<ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
		</TouchableOpacity>
	)
}

const SettingsPage: React.FC = () => {
	const { t, locale } = useTranslations()
	const colors = useThemeColors()

	// Notification settings state
	const [notifications, setNotifications] = useState<NotificationSettings>({
		pushNotifications: true,
		newMessages: true,
		listingUpdates: true,
		favoriteAlerts: false,
		nearbyListings: true,
	})

	// Privacy settings state
	const [privacy, setPrivacy] = useState<PrivacySettings>({
		showProfileToOthers: true,
		shareLocation: true,
		onlineStatus: true,
	})

	// Account settings state
	const [account, setAccount] = useState<AccountSettings>({
		twoFactorAuth: false,
	})

	const handleGoBack = () => {
		router.back()
	}

	// Notification handlers
	const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
		setNotifications(prev => ({ ...prev, [key]: value }))
		// TODO: Save to backend/storage
		console.log(`Notification setting ${key} changed to:`, value)
	}

	// Privacy handlers
	const updatePrivacy = (key: keyof PrivacySettings, value: boolean) => {
		setPrivacy(prev => ({ ...prev, [key]: value }))
		// TODO: Save to backend/storage
		console.log(`Privacy setting ${key} changed to:`, value)
	}

	// Account handlers
	const updateAccount = (key: keyof AccountSettings, value: boolean) => {
		setAccount(prev => ({ ...prev, [key]: value }))
		// TODO: Save to backend/storage
		console.log(`Account setting ${key} changed to:`, value)
	}

	const handleBlockedUsers = () => {
		// TODO: Navigate to blocked users page
		console.log('Navigate to blocked users')
	}

	const handleLanguage = () => {
		// TODO: Open language selector
		console.log('Open language selector')
	}

	const handleAccountManagement = () => {
		// TODO: Navigate to account management
		console.log('Navigate to account management')
	}

	const getLanguageName = (code: string): string => {
		const languages: Record<string, string> = {
			en: 'English',
			uz: "O'zbekcha",
			ru: 'Русский',
		}
		return languages[code] || code
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
					{t('settings_page.title')}
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
						{t('settings_page.under_development')}
					</Text>
				</View>

				{/* Notifications Section */}
				<ProfileSection title={t('settings_page.notifications')}>
					<SettingItemWithSwitch
						icon={Bell}
						title={t('settings_page.push_notifications')}
						subtitle={t('settings_page.push_notifications_desc')}
						value={notifications.pushNotifications}
						onValueChange={v => updateNotification('pushNotifications', v)}
					/>
					<SettingItemWithSwitch
						icon={MessageSquare}
						title={t('settings_page.new_messages')}
						subtitle={t('settings_page.new_messages_desc')}
						value={notifications.newMessages}
						onValueChange={v => updateNotification('newMessages', v)}
					/>
					<SettingItemWithSwitch
						icon={Bell}
						title={t('settings_page.listing_updates')}
						subtitle={t('settings_page.listing_updates_desc')}
						value={notifications.listingUpdates}
						onValueChange={v => updateNotification('listingUpdates', v)}
					/>
					<SettingItemWithSwitch
						icon={Heart}
						title={t('settings_page.favorite_alerts')}
						subtitle={t('settings_page.favorite_alerts_desc')}
						value={notifications.favoriteAlerts}
						onValueChange={v => updateNotification('favoriteAlerts', v)}
					/>
					<SettingItemWithSwitch
						icon={MapPin}
						title={t('settings_page.nearby_listings')}
						subtitle={t('settings_page.nearby_listings_desc')}
						value={notifications.nearbyListings}
						onValueChange={v => updateNotification('nearbyListings', v)}
					/>
				</ProfileSection>

				{/* Privacy Section */}
				<ProfileSection title={t('settings_page.privacy')}>
					<SettingItemWithSwitch
						icon={Eye}
						title={t('settings_page.show_profile')}
						subtitle={t('settings_page.show_profile_desc')}
						value={privacy.showProfileToOthers}
						onValueChange={v => updatePrivacy('showProfileToOthers', v)}
					/>
					<SettingItemWithSwitch
						icon={MapPin}
						title={t('settings_page.share_location')}
						subtitle={t('settings_page.share_location_desc')}
						value={privacy.shareLocation}
						onValueChange={v => updatePrivacy('shareLocation', v)}
					/>
					<SettingItemWithSwitch
						icon={User}
						title={t('settings_page.online_status')}
						subtitle={t('settings_page.online_status_desc')}
						value={privacy.onlineStatus}
						onValueChange={v => updatePrivacy('onlineStatus', v)}
					/>
					<SettingItemWithChevron
						icon={UserX}
						title={t('settings_page.blocked_users')}
						subtitle={t('settings_page.blocked_users_desc')}
						onPress={handleBlockedUsers}
					/>
				</ProfileSection>

				{/* Account Section */}
				<ProfileSection title={t('settings_page.account')}>
					<SettingItemWithSwitch
						icon={Shield}
						title={t('settings_page.two_factor')}
						subtitle={t('settings_page.two_factor_desc')}
						value={account.twoFactorAuth}
						onValueChange={v => updateAccount('twoFactorAuth', v)}
					/>
					<SettingItemWithChevron
						icon={Globe}
						title={t('settings_page.language')}
						subtitle={getLanguageName(locale)}
						onPress={handleLanguage}
					/>
					<SettingItemWithChevron
						icon={Lock}
						title={t('settings_page.account_management')}
						subtitle={t('settings_page.account_management_desc')}
						onPress={handleAccountManagement}
					/>
				</ProfileSection>
			</ScrollView>
		</View>
	)
}

export default SettingsPage

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: HEADER_PADDING_TOP,
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
	settingItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		marginBottom: 2,
	},
	settingIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	settingContent: {
		flex: 1,
	},
	settingTitle: {
		fontSize: 15,
		fontWeight: '500',
	},
	settingSubtitle: {
		fontSize: 13,
		marginTop: 2,
	},
})
