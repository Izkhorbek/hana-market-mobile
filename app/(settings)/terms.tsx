import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface TermsSection {
	id: string
	title: string
	body: string[]
}

const LAST_UPDATED = 'February 1, 2026'

const TERMS_SECTIONS: TermsSection[] = [
	{
		id: 'acceptance',
		title: '1. Terms of Service',
		body: [
			'Welcome to Hana Market. By using this app, you agree to these Terms of Service and our Privacy Policy.',
			'Please read these terms carefully. If you do not agree, you may not use the app.',
		],
	},
	{
		id: 'accounts',
		title: '2. User Accounts',
		body: [
			'You are responsible for keeping your account information secure and accurate.',
			'Misleading information, fraudulent activity, and abuse are strictly prohibited.',
		],
	},
	{
		id: 'marketplace-rules',
		title: '3. Listings and Transactions',
		body: [
			'Users are responsible for listing items honestly and communicating respectfully.',
			'Hana Market does not guarantee item quality, delivery, or payment outcomes between users.',
		],
	},
	{
		id: 'conduct',
		title: '4. Prohibited Items and Conduct',
		body: [
			'Illegal goods, harmful content, harassment, and scams are not allowed.',
			'Accounts that violate these rules may be restricted or removed.',
		],
	},
	{
		id: 'privacy',
		title: '5. Privacy Policy',
		body: [
			'We collect limited data to provide and improve the service, such as account details, device information, and app usage.',
			'Your personal data is handled according to applicable laws and our Privacy Policy.',
		],
	},
	{
		id: 'data-security',
		title: '6. Data Security',
		body: [
			'We use reasonable technical and organizational safeguards to protect your information.',
			'No system is completely secure, but we continuously improve our protections.',
		],
	},
	{
		id: 'termination',
		title: '7. Termination',
		body: [
			'We may suspend or terminate accounts that violate these terms or create risk for the community.',
			'You may stop using the app at any time.',
		],
	},
	{
		id: 'liability',
		title: '8. Limitation of Liability',
		body: [
			'Hana Market is provided "as is" without warranties of uninterrupted operation.',
			'To the extent permitted by law, we are not liable for indirect or consequential damages.',
		],
	},
	{
		id: 'changes',
		title: '9. Changes to These Terms',
		body: [
			'We may update these terms from time to time. Material changes will be communicated in the app.',
			'Continued use after updates means you accept the revised terms.',
		],
	},
	{
		id: 'contact',
		title: '10. Contact Us',
		body: [
			'If you have questions about these Terms and Policies, contact our support team.',
			'Email: support@hanamarket.com',
		],
	},
]

const TermsPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')

	const handleBack = () => {
		router.back()
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
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
					onPress={handleBack}
					style={styles.backButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.terms_policies')}</Text>
				<View style={styles.headerRight} />
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.metaContainer}>
					<Text style={[styles.metaLabel, { color: colors.textMuted }]}>Last Updated</Text>
					<Text style={[styles.metaValue, { color: colors.text }]}>{LAST_UPDATED}</Text>
				</View>

				{TERMS_SECTIONS.map(section => (
					<View key={section.id} style={[styles.sectionCard, { backgroundColor: cardColor }]}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
						{section.body.map((paragraph, idx) => (
							<Text key={`${section.id}-${idx}`} style={[styles.sectionText, { color: colors.textMuted }]}>
								{paragraph}
							</Text>
						))}
					</View>
				))}
			</ScrollView>
		</View>
	)
}

export default TermsPage

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
	metaContainer: {
		marginBottom: 12,
	},
	metaLabel: {
		fontSize: 12,
		fontWeight: '500',
	},
	metaValue: {
		fontSize: 14,
		fontWeight: '600',
		marginTop: 2,
	},
	sectionCard: {
		borderRadius: 12,
		padding: 14,
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: '700',
		marginBottom: 8,
	},
	sectionText: {
		fontSize: 13,
		lineHeight: 20,
		marginBottom: 6,
	},
})
