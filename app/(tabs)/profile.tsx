import ProfilePageHeader from '@/components/headers/ProfilePageHeader'
import { LanguageSelector } from '@/components/Settings/LanguageSelector'
import ThemedScrollView from '@/components/themed-scrollview'
import { Switch } from '@/components/ui/switch'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { useModeToggle } from '@/hooks/useModeToggle'
import { useAuthStore } from '@/modules/Auth/auth-store'
import ProfileHeader from '@/modules/Profile/ProfileHeader'
import ProfileMenuItem from '@/modules/Profile/ProfileMenuItem'
import ProfileSection from '@/modules/Profile/ProfileSection'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { router, useFocusEffect } from 'expo-router'
import {
	FileText,
	Flag,
	Globe,
	Heart,
	HelpCircle,
	Home,
	LogOut,
	MapPin,
	MessageSquare,
	Moon,
	Package,
	Sparkles
} from 'lucide-react-native'
import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ProfilePage = () => {
	const { t, locale } = useTranslations()
	const colors = useThemeColors()
	const backgroundColor = useColor('background')
	const mutedTextColor = useColor('textMuted')
	const infoCardBg = useColor('infoCardBg')
	const infoCardBorder = useColor('infoCardBorder')
	const infoCardText = useColor('infoCardText')
	const cardColor = useColor('profileCard')
	const textColor = useColor('text')
	const insets = useSafeAreaInsets()
	const tabBarHeight = useBottomTabBarHeight()
	const { isDark, setMode } = useModeToggle()
	const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false)
	const logout = useAuthStore((s) => s.logout)
	const fetchUser = useAuthStore((s) => s.fetchUser)

	const { isAuthenticated, user } = useAuthStore()
	const timeAbbreviations = [
		{ short: 's', label: t('profile.abbreviation_second'), example: '1s' },
		{ short: 'm', label: t('profile.abbreviation_minute'), example: '1m' },
		{ short: 'h', label: t('profile.abbreviation_hour'), example: '1h' },
		{ short: 'd', label: t('profile.abbreviation_day'), example: '1d' },
		{ short: 'mo', label: t('profile.abbreviation_month'), example: '1mo' },
		{ short: 'yr', label: t('profile.abbreviation_year'), example: '1yr' },
	]

	useFocusEffect(
		useCallback(() => {
			if (isAuthenticated) fetchUser()
		}, [isAuthenticated, fetchUser]),
	)

	const handleLogout = () => {
		Alert.alert(
			t('profile.logout_confirm_title'),
			t('profile.logout_confirm_message'),
			[
				{ text: t('profile.logout_cancel'), style: 'cancel' },
				{
					text: t('profile.logout'),
					style: 'destructive',
					onPress: async () => {
						// Await the durable keychain clear before navigating so a
						// force-kill right after logout can't restore the session (M2).
						await logout()
						router.replace('/(auth)/welcome')
					},
				},
			],
		)
	}

	const handleNavigation = (route: string) => {
		if (route === 'manage-neighborhood') {
			router.push('/(settings)/manage')
		} else if (route === 'edit-profile') {
			router.push('/(settings)/my-profile')
		} else if (route === 'listings') {
			router.push('/(settings)/my-listings')
		} else if (route === 'favorites') {
			router.push('/(settings)/favorites')
		} else if (route === 'my-complaints') {
			router.push('/(settings)/my-complaint')
		} else if (route === 'verification') {
			router.push('/(settings)/verification')
		} else if (route === 'settings') {
			router.push('/(settings)/settings')
		} else if (route === 'contact') {
			router.push('/(settings)/contact')
		} else if (route === 'whats-new') {
			router.push('/(settings)/whats-new')
		} else if (route === 'feedback') {
			router.push('/(settings)/feedback')
		} else if (route === 'about') {
			router.push('/(settings)/about')
		} else if (route === 'terms') {
			router.push('/(settings)/terms')
		} else {
			console.log('Navigate to:', route)
			// TODO: Add navigation logic for other routes
		}
	}

	const getLanguageName = (code: string) => {

		const languages: Record<string, string> = {
			en: 'English',
			uz: "O'zbekcha",
			ru: 'Русский',
		}

		return languages[code] || code
	}

	return (
		<View style={[styles.container, { backgroundColor }]}>
			<ProfilePageHeader />

			<ThemedScrollView
				style={[styles.scrollView, { backgroundColor: colors.profileBackground }]}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Math.max(insets.bottom, 16) }]}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Header */}
				<ProfileHeader
					name={user?.username || t('profile.guest')}
					status={t('profile.active')}
					// temperature='0.0°C'
					temperature='0.0°C'
					profile_image={user?.profile_image_url ?? ''}
					onPress={() => handleNavigation('edit-profile')}
				/>

				{/* My Activity Section */}
				<ProfileSection title={t('profile.my_activity')}>
					<ProfileMenuItem
						icon={Package}
						title={t('profile.listings')}
						subtitle={t('profile.listings_subtitle')}
						onPress={() => handleNavigation('listings')}
					/>
					<ProfileMenuItem
						icon={Heart}
						title={t('profile.favorites')}
						onPress={() => handleNavigation('favorites')}
					/>
					<ProfileMenuItem
						icon={Flag}
						title={t('profile.my_complaints')}
						onPress={() => handleNavigation('my-complaints')}
					/>
				</ProfileSection>

				{/* Neighborhood Section */}
				<ProfileSection title={t('profile.neighborhood')}>
					<ProfileMenuItem
						icon={MapPin}
						title={t('profile.manage_neighborhood')}
						subtitle={t('profile.manage_neighborhood_subtitle')}
						onPress={() => handleNavigation('manage-neighborhood')}
					/>
				</ProfileSection>

				{/* Trust & Verification Section
				<ProfileSection title={t('profile.trust_verification')}>
					<ProfileMenuItem
						icon={ShieldCheck}
						title={t('profile.verification')}
						subtitle={t('profile.verification_subtitle')}
						onPress={() => handleNavigation('verification')}
					/>
				</ProfileSection> */}

				{/* Settings Section */}
				{/* <ProfileSection title={t('profile.settings_section')}>
					<ProfileMenuItem
						icon={Settings}
						title={t('profile.settings')}
						onPress={() => handleNavigation('settings')}
					/>
					<ProfileMenuItem
						icon={MessageCircle}
						title={t('profile.chats')}
						onPress={() => handleNavigation('chats')}
					/>
					<ProfileMenuItem
						icon={Bell}
						title={t('profile.notifications')}
						onPress={() => handleNavigation('notifications')}
					/>
				</ProfileSection> */}

				{/* Appearance Section */}
				<ProfileSection title={t('profile.appearance')}>
					<ProfileMenuItem
						icon={Globe}
						title={t('profile.language')}
						subtitle={getLanguageName(locale)}
						onPress={() => setIsLanguageModalVisible(true)}
					/>
					<ProfileMenuItem
						icon={Moon}
						title={t('profile.theme')}
						showChevron={false}
						rightContent={
							<Switch value={isDark} onValueChange={value => setMode(value ? 'dark' : 'light')} />
						}
					/>
				</ProfileSection>

				<ProfileSection title={t('profile.abbreviations_section')}>
					<View
						style={[
							styles.abbreviationCard,
							{
								backgroundColor: infoCardBg,
								borderColor: infoCardBorder,
							},
						]}
					>
						<Text style={[styles.abbreviationCardTitle, { color: infoCardText }]}>
							{t('profile.abbreviations_title')}
						</Text>
						<Text style={[styles.abbreviationCardSubtitle, { color: infoCardText }]}>
							{t('profile.abbreviations_subtitle')}
						</Text>
						<View style={styles.abbreviationList}>
							{timeAbbreviations.map((item) => (
								<View
									key={item.short}
									style={[
										styles.abbreviationRow,
										{ backgroundColor: cardColor },
									]}
								>
									<View style={styles.abbreviationMeta}>
										{/* <Text style={[styles.abbreviationBadge, { color: infoCardText }]}>
											{item.short}
										</Text> */}
										<Text style={[styles.abbreviationLabel, { color: textColor }]}>
											{item.label}
										</Text>
									</View>
									<Text style={[styles.abbreviationExample, { color: mutedTextColor }]}>
										<Ionicons name='time-outline' size={14} color={colors.subText} />
										{item.example}
									</Text>
								</View>
							))}
						</View>
					</View>
				</ProfileSection>

				{/* Support & Information Section */}
				<ProfileSection title={t('profile.support_information')}>
					<ProfileMenuItem
						icon={HelpCircle}
						title={t('profile.contact_us')}
						onPress={() => handleNavigation('contact')}
					/>
					<ProfileMenuItem
						icon={Sparkles}
						title={t('profile.whats_new')}
						onPress={() => handleNavigation('whats-new')}
					/>
					<ProfileMenuItem
						icon={MessageSquare}
						title={t('profile.feedback')}
						onPress={() => handleNavigation('feedback')}
					/>
					<ProfileMenuItem
						icon={Home}
						title={t('profile.about')}
						onPress={() => handleNavigation('about')}
					/>
					<ProfileMenuItem
						icon={FileText}
						title={t('profile.terms_policies')}
						onPress={() => handleNavigation('terms')}
					/>
				</ProfileSection>

				{/* Logout */}
				<ProfileSection title="">
					<ProfileMenuItem
						icon={LogOut}
						title={t('profile.logout')}
						showChevron={false}
						onPress={handleLogout}
					/>
				</ProfileSection>

				{/* App Version */}
				<Text style={[styles.appVersion, { color: mutedTextColor }]}>
					{t('profile.app_version')}
				</Text>
			</ThemedScrollView>

			{/* Language Selector Modal */}
			<LanguageSelector
				isVisible={isLanguageModalVisible}
				onClose={() => setIsLanguageModalVisible(false)}
			/>
		</View>
	)
}

export default ProfilePage

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 10,
		paddingBottom: 16,
		paddingTop: 20,
	},
	appVersion: {
		fontSize: 13,
		textAlign: 'center',
		marginTop: 24,
		marginBottom: 16,
	},
	abbreviationCard: {
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
	},
	abbreviationCardTitle: {
		fontSize: 15,
		fontWeight: '700',
		marginBottom: 6,
	},
	abbreviationCardSubtitle: {
		fontSize: 13,
		lineHeight: 18,
		opacity: 0.92,
	},
	abbreviationList: {
		marginTop: 14,
		gap: 8,
	},
	abbreviationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 14,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	abbreviationMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		flexShrink: 1,
	},
	abbreviationBadge: {
		fontSize: 12,
		fontWeight: '800',
		textTransform: 'uppercase',
		minWidth: 28,
	},
	abbreviationLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	abbreviationExample: {
		fontSize: 12,
		fontWeight: '500',
		marginLeft: 12,
	},
})
