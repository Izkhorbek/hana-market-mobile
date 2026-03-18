import { HEADER_HEIGHT, HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface CategoryItem {
	id: string
	nameKey:
	| 'electronics'
	| 'fashion'
	| 'home_garden'
	| 'sports'
	| 'toys_hobbies'
	| 'health_beauty'
	image: string
}

const categories: CategoryItem[] = [
	{
		id: 'electronics-1',
		nameKey: 'electronics',
		image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'fashion-1',
		nameKey: 'fashion',
		image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'home-garden-1',
		nameKey: 'home_garden',
		image: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'sports-1',
		nameKey: 'sports',
		image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'toys-1',
		nameKey: 'toys_hobbies',
		image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'health-1',
		nameKey: 'health_beauty',
		image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'electronics-2',
		nameKey: 'electronics',
		image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'fashion-2',
		nameKey: 'fashion',
		image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'home-garden-2',
		nameKey: 'home_garden',
		image: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'sports-2',
		nameKey: 'sports',
		image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'toys-2',
		nameKey: 'toys_hobbies',
		image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=800&q=80',
	},
	{
		id: 'health-2',
		nameKey: 'health_beauty',
		image: 'https://images.unsplash.com/photo-1596462502278-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
	},
]

const CategoriesPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			<View style={[styles.header, { borderBottomColor: colors.borderColor, backgroundColor: colors.background }]}>
				<TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('categories_page.title')}</Text>
				<View style={styles.headerSpacer} />
			</View>

			<ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
				{categories.map(item => (
					<TouchableOpacity key={item.id} activeOpacity={0.85} style={styles.cardTouchable}>
						<ImageBackground source={{ uri: item.image }} style={styles.card} imageStyle={styles.cardImage}>
							<View style={styles.overlay} />
							<Text style={styles.cardText}>{t(`categories_page.items.${item.nameKey}`)}</Text>
						</ImageBackground>
					</TouchableOpacity>
				))}
			</ScrollView>
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
})
