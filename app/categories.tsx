import { useCategoriesQuery } from '@/api/hooks'
import { HEADER_HEIGHT, HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { Category } from '@/types'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React, { useCallback } from 'react'
import { ActivityIndicator, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

// Default category images (fallback when API doesn't provide images)
const CATEGORY_IMAGES: Record<string, string> = {
	electronics: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
	fashion: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
	home: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=800&q=80',
	sports: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
	toys: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=800&q=80',
	health: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
	cars: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80',
	realestate: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
	jobs: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80',
	default: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
}

const getCategoryImage = (categoryName: string): string => {
	const normalizedName = categoryName.toLowerCase().replace(/[\s_-]/g, '')
	for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
		if (normalizedName.includes(key)) return url
	}
	return CATEGORY_IMAGES.default
}

const CategoriesPage: React.FC = () => {
	const { t, locale } = useTranslations()
	const colors = useThemeColors()

	// Fetch categories from API
	const { data: categoriesRes, isLoading, isRefetching, refetch } = useCategoriesQuery()
	const categories = categoriesRes?.data?.data ?? []

	// Navigate to home with category filter
	const handleCategoryPress = useCallback((category: Category) => {
		router.push({
			pathname: '/(tabs)/home',
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
				<ScrollView
					contentContainerStyle={styles.gridContainer}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={refetch}
							tintColor={colors.primaryColor}
						/>
					}
				>
					{categories.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={[styles.emptyText, { color: colors.textMuted }]}>
								{t('categories_page.empty')}
							</Text>
						</View>
					) : (
						categories.map(category => (
							<TouchableOpacity
								key={category.id}
								activeOpacity={0.85}
								style={styles.cardTouchable}
								onPress={() => handleCategoryPress(category)}
							>
								<ImageBackground
									source={{ uri: getCategoryImage(getCategoryName(category)) }}
									style={styles.card}
									imageStyle={styles.cardImage}
								>
									<View style={styles.overlay} />
									<Text style={styles.cardText}>{getCategoryName(category)}</Text>
									{category.product_count > 0 && (
										<Text style={styles.countText}>{category.product_count}</Text>
									)}
								</ImageBackground>
							</TouchableOpacity>
						))
					)}
				</ScrollView>
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
		borderBottomWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerTitle: {
		fontSize: 34 - 8,
		fontWeight: '700',
	},
	headerSpacer: {
		width: 24,
	},
	gridContainer: {
		padding: 12,
		paddingBottom: 36,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	cardTouchable: {
		width: '48.5%',
		marginBottom: 10,
	},
	card: {
		height: 130,
		justifyContent: 'flex-end',
	},
	cardImage: {
		borderRadius: 12,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.28)',
		borderRadius: 12,
	},
	cardText: {
		color: '#fff',
		fontSize: 28 - 8,
		fontWeight: '700',
		paddingHorizontal: 12,
		paddingBottom: 12,
	},
	countText: {
		position: 'absolute',
		top: 8,
		right: 8,
		backgroundColor: 'rgba(0,0,0,0.5)',
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
		overflow: 'hidden',
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
