import { useTermsQuery } from '@/api/hooks'
import { HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const TermsPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')

	const { data, isLoading } = useTermsQuery()
	const termsData = data?.data?.data

	const handleBack = () => { router.back() }

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
				<TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.terms_policies')}</Text>
				<View style={styles.headerRight} />
			</View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color={colors.primaryColor} />
				</View>
			) : (
				<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
					{termsData?.last_updated && (
						<View style={styles.metaContainer}>
							<Text style={[styles.metaLabel, { color: colors.textMuted }]}>Last Updated</Text>
							<Text style={[styles.metaValue, { color: colors.text }]}>{termsData.last_updated}</Text>
						</View>
					)}

					{termsData?.sections.map((section) => (
						<View key={section.order} style={[styles.sectionCard, { backgroundColor: cardColor }]}>
							{/* Section Title */}
							<Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>

							{/* Intro paragraph */}
							{section.intro && (
								<Text style={[styles.introText, { color: colors.textMuted }]}>{section.intro}</Text>
							)}

							{/* Items */}
							{section.items.map((item, idx) => (
								<View key={idx} style={styles.itemContainer}>
									{item.subtitle && (
										<Text style={[styles.itemSubtitle, { color: colors.text }]}>{item.subtitle}</Text>
									)}
									<Text style={[styles.itemContent, { color: colors.textMuted }]}>{item.content}</Text>
									{item.bullet_points && item.bullet_points.map((point, bIdx) => (
										<View key={bIdx} style={styles.bulletRow}>
											<View style={[styles.bullet, { backgroundColor: colors.textMuted }]} />
											<Text style={[styles.bulletText, { color: colors.textMuted }]}>{point}</Text>
										</View>
									))}
								</View>
							))}
						</View>
					))}
				</ScrollView>
			)}
		</View>
	)
}

export default TermsPage

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
	metaContainer: { marginBottom: 12 },
	metaLabel: { fontSize: 12, fontWeight: '500' },
	metaValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
	sectionCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
	sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
	introText: { fontSize: 13, lineHeight: 20, marginBottom: 10, fontStyle: 'italic' },
	itemContainer: { marginBottom: 8 },
	itemSubtitle: { fontSize: 13, fontWeight: '600', marginBottom: 3 },
	itemContent: { fontSize: 13, lineHeight: 20 },
	bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, paddingLeft: 8 },
	bullet: { width: 4, height: 4, borderRadius: 2, marginTop: 8, marginRight: 8 },
	bulletText: { flex: 1, fontSize: 13, lineHeight: 20 },
})
