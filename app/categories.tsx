import { useCategoriesQuery } from '@/api/hooks'
import { HEADER_HEIGHT, HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { Category } from '@/types'
import { resolveImageUrl } from '@/utils/imageUrl'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ArrowLeft, ChevronRight } from 'lucide-react-native'
import React, { useCallback } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SvgUri } from 'react-native-svg'

const CategoriesPage: React.FC = () => {
	const { t, locale } = useTranslations()
	const colors = useThemeColors()
	const insets = useSafeAreaInsets()

	// Fetch categories from API
	const { data: categoriesRes, isLoading, isRefetching, refetch } = useCategoriesQuery()
	const categories = categoriesRes?.data?.data ?? []

	// Navigate to search with preselected category
	const handleCategoryPress = useCallback((category: Category) => {
		router.push({
			pathname: '/search',
			params: { categoryId: String(category.id), categoryName: locale === 'ru' ? category.name_ru : category.name_uz },
		})
	}, [locale])

	// Get localized category name
	const getCategoryName = (category: Category): string => {
		return locale === 'ru' ? category.name_ru : category.name_uz
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			<View style={[styles.header, { borderBottomColor: colors.borderColor, backgroundColor: colors.background }]}>
				<TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('categories_page.title')}</Text>
				<View style={styles.headerSpacer} />
			</View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primaryColor} />
				</View>
			) : (
				<FlatList
					data={categories}
					keyExtractor={item => String(item.id)}
					contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom }]}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={refetch}
							tintColor={colors.primaryColor}
						/>
					}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Text style={[styles.emptyText, { color: colors.textMuted }]}>
								{t('categories_page.empty')}
							</Text>
						</View>
					}
					renderItem={({ item: category, index }) => (
						<TouchableOpacity
							activeOpacity={0.7}
							style={[
								styles.row,
								{ backgroundColor: colors.background, borderBottomColor: colors.borderColor },
								index === 0 && styles.rowFirst,
								index === categories.length - 1 && styles.rowLast,
							]}
							onPress={() => handleCategoryPress(category)}
						>
							<View style={[styles.iconBox, { backgroundColor: colors.profileBackground }]}>
								{resolveImageUrl(category.image_url).endsWith('.svg') ? (
									<SvgUri
										width='100%'
										height='100%'
										uri={resolveImageUrl(category.image_url)}
									/>
								) : (
									<Image
										source={{ uri: resolveImageUrl(category.image_url) }}
										style={styles.iconImage}
										contentFit="contain"
									/>
								)}
							</View>
							<Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
								{getCategoryName(category)}
							</Text>
							<ChevronRight size={18} color={colors.textMuted} style={styles.chevron} />
						</TouchableOpacity>
					)}
				/>
			)}
		</View>
	)
}

export default CategoriesPage

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		height: HEADER_HEIGHT,
		paddingTop: HEADER_PADDING_TOP,
		paddingHorizontal: 16,
		paddingBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: '700',
	},
	headerSpacer: {
		width: 24,
	},
	listContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		paddingBottom: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 14,
		marginBottom: 8,
		borderRadius: 12,
	},
	rowFirst: {},
	rowLast: {},
	iconBox: {
		width: 48,
		height: 48,
		borderRadius: 10,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 14,
	},
	iconImage: {
		width: 36,
		height: 36,
	},
	rowLabel: {
		flex: 1,
		fontSize: 16,
		fontWeight: '600',
	},
	rowCount: {
		fontSize: 13,
		fontWeight: '500',
		marginRight: 6,
	},
	chevron: {
		marginLeft: 2,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
		width: '100%',
	},
	emptyText: {
		fontSize: 16,
		textAlign: 'center',
	},
})
