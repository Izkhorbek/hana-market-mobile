import { useNewsListQuery } from '@/api/hooks'
import { HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import type { NewsItem } from '@/types'
import { parseBackendDateTime } from '@/utils/dateTime'
import { router } from 'expo-router'
import { ArrowLeft, Sparkles } from 'lucide-react-native'
import React from 'react'
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'

// Category badge color map
const CATEGORY_COLORS: Record<string, string> = {
	updates: '#02A348',
	announcement: '#3B82F6',
	tips: '#7C3AED',
	maintenance: '#F59E0B',
}

interface NewsItemCardProps {
	item: NewsItem
	isRu: boolean
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, isRu }) => {
	const colors = useThemeColors()
	const cardColor = useColor('profileCard')

	const title = isRu ? item.title_ru : item.title_uz
	const content = isRu ? item.content_ru : item.content_uz
	const categoryColor = CATEGORY_COLORS[item.category] ?? colors.primaryColor

	const formatDate = (dateStr: string) => {
		try {
			return parseBackendDateTime(dateStr).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})
		} catch {
			return dateStr
		}
	}

	const contentPreview = content.length > 140 ? `${content.slice(0, 140).trimEnd()}…` : content

	return (
		<View style={[styles.newsCard, { backgroundColor: cardColor }]}>
			<View style={styles.newsCardHeader}>
				<View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}18` }]}>
					<Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
						{item.category.replace('_', ' ').toUpperCase()}
					</Text>
				</View>
				<Text style={[styles.newsDate, { color: colors.textMuted }]}>
					{formatDate(item.published_at)}
				</Text>
			</View>
			<Text style={[styles.newsTitle, { color: colors.text }]}>{title}</Text>
			<Text style={[styles.newsContent, { color: colors.textMuted }]}>{contentPreview}</Text>
		</View>
	)
}

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
	const { t, locale } = useTranslations()
	const colors = useThemeColors()

	const { data, isLoading } = useNewsListQuery({ params: { page: 1, pageSize: 20 } })
	const newsList = data?.data?.data ?? []
	const isRu = locale === 'ru'

	const handleGoBack = () => { router.back() }

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			{/* Header */}
			<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('whats_new.title')}</Text>
				<View style={styles.headerRight} />
			</View>

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{/* Hero Card */}
				<HeroCard />

				{/* News Items */}
				{isLoading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size='large' color={colors.primaryColor} />
					</View>
				) : newsList.length > 0 ? (
					newsList.map(item => (
						<NewsItemCard key={item.id} item={item} isRu={isRu} />
					))
				) : (
					<View style={[styles.emptyCard, { backgroundColor: colors.infoCardBg, borderColor: colors.infoCardBorder }]}>
						<Text style={[styles.emptyText, { color: colors.infoCardText }]}>{t('whats_new.no_news')}</Text>
					</View>
				)}

				{/* Footer Note */}
				{!isLoading && (
					<View style={[styles.footerCard, { backgroundColor: colors.infoCardBg, borderColor: colors.infoCardBorder }]}>
						<Text style={[styles.footerText, { color: colors.infoCardText }]}>{t('whats_new.footer_note')}</Text>
					</View>
				)}
			</ScrollView>
		</View>
	)
}

export default WhatsNewPage

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
	scrollView: { flex: 1 },
	scrollContent: { padding: 16, paddingBottom: 40 },
	heroCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
	heroIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
	heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
	heroDescription: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', lineHeight: 20 },
	loadingContainer: { paddingVertical: 40, alignItems: 'center' },
	newsCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
	newsCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
	categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
	categoryBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
	newsDate: { fontSize: 12 },
	newsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6, lineHeight: 20 },
	newsContent: { fontSize: 13, lineHeight: 19 },
	emptyCard: { borderRadius: 12, padding: 20, borderWidth: 1, alignItems: 'center', marginBottom: 16 },
	emptyText: { fontSize: 14 },
	footerCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginTop: 8 },
	footerText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
})
