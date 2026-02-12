import ProfilePageHeader from '@/components/headers/ProfilePageHeader'
import { LanguageSelector } from '@/components/Settings/LanguageSelector'
import { Switch } from '@/components/ui/switch'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { useModeToggle } from '@/hooks/useModeToggle'
import { useAuthStore } from '@/modules/Auth/auth-store'
import ProfileHeader from '@/modules/Profile/ProfileHeader'
import ProfileMenuItem from '@/modules/Profile/ProfileMenuItem'
import ProfileSection from '@/modules/Profile/ProfileSection'
import { router } from 'expo-router'
import {
	Bell,
	FileText,
	Globe,
	Heart,
	HelpCircle,
	Home,
	LogOut,
	MapPin,
	MessageCircle,
	MessageSquare,
	Moon,
	Package,
	Settings,
	ShieldCheck,
	Sparkles,
} from 'lucide-react-native'
import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

const ProfilePage = () => {
	const { t, locale } = useTranslations()
	const colors = useThemeColors()
	const backgroundColor = useColor('background')
	const mutedTextColor = useColor('textMuted')
	const { isDark, setMode } = useModeToggle()
	const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false)
	const logout = useAuthStore((s) => s.logout)

	const handleLogout = () => {
		Alert.alert(
			t('profile.logout_confirm_title'),
			t('profile.logout_confirm_message'),
			[
				{ text: t('profile.logout_cancel'), style: 'cancel' },
				{
					text: t('profile.logout'),
					style: 'destructive',
					onPress: () => {
						logout()
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

			<ScrollView
				style={[styles.scrollView, { backgroundColor: colors.profileBackground }]}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Header */}
				<ProfileHeader
					name='John Doe'
					status={t('profile.active')}
					temperature='36.3°C'
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

				{/* Trust & Verification Section */}
				<ProfileSection title={t('profile.trust_verification')}>
					<ProfileMenuItem
						icon={ShieldCheck}
						title={t('profile.verification')}
						subtitle={t('profile.verification_subtitle')}
						onPress={() => handleNavigation('verification')}
					/>
				</ProfileSection>

				{/* Settings Section */}
				<ProfileSection title={t('profile.settings_section')}>
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
				</ProfileSection>

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
			</ScrollView>

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
		paddingBottom: 100,
		paddingTop: 20,
	},
	appVersion: {
		fontSize: 13,
		textAlign: 'center',
		marginTop: 24,
		marginBottom: 16,
	},
})
