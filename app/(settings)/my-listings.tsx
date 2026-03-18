import { useMyProductsQuery } from '@/api/hooks'
import MyListingCard, { ListingStatus, MyListingCardProps } from '@/components/shared/Cards/MyListingCard'
import { HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { MyProductDto } from '@/types'
import { resolveImageUrl } from '@/utils/imageUrl'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React, { useMemo, useState } from 'react'
import {
	ActivityIndicator,
	FlatList,
	Platform,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'

type TabType = 'active' | 'sold' | 'hidden'

interface TabItem {
	key: TabType
	label: string
}


// Helper to convert API product to card props
const mapProductToCardProps = (product: MyProductDto): MyListingCardProps => ({
	id: String(product.id),
	image: resolveImageUrl(product.main_image_url) || '',
	title: product.title || '',
	price: product.price || '',
	views: product.views_count,
	likes: product.likes_count,
	timeAgo: product.created_at,
	status: product.status as ListingStatus,
})

const MyListingsPage = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const [activeTab, setActiveTab] = useState<TabType>('active')

	// Fetch my products from API
	const { data: myProductsResponse, isLoading, refetch, isRefetching } = useMyProductsQuery({})

	// Get products array from response
	const allProducts = myProductsResponse?.data?.data || []

	console.log('Fetched my products:', allProducts) // Debug log to check API response

	// Filter products by status based on active tab
	const filteredProducts = useMemo(() => {
		return allProducts.filter((product: MyProductDto) => product.status === activeTab)
	}, [allProducts, activeTab])

	// Map filtered products to card props
	const filteredListings = useMemo(() => {
		return filteredProducts.map(mapProductToCardProps)
	}, [filteredProducts])

	const tabs: TabItem[] = [
		{ key: 'active', label: t('my_listings.tab_active') },
		{ key: 'sold', label: t('my_listings.tab_sold') },
		{ key: 'hidden', label: t('my_listings.tab_hidden') },
	]

	const handleGoBack = () => {
		router.back()
	}

	const handleListingPress = (listing: MyListingCardProps) => {
		// Navigate to edit page
		router.push(`/(post)/edit/${listing.id}` as any)
	}

	const handleMenuPress = (listing: MyListingCardProps) => {
		console.log('Menu pressed for:', listing.id)
		// TODO: Show action sheet with options (edit, delete, hide, mark as sold, etc.)
	}

	const renderListingItem = ({ item }: { item: MyListingCardProps }) => (
		<MyListingCard
			{...item}
			isInactiveTab={activeTab !== 'active'}
			onPress={() => handleListingPress(item)}
			onMenuPress={() => handleMenuPress(item)}
		/>
	)

	const renderEmptyState = () => (
		<View style={styles.emptyContainer}>
			{isLoading ? (
				<ActivityIndicator size="large" color={colors.primaryColor} />
			) : (
				<Text style={[styles.emptyText, { color: colors.textMuted }]}>
					{t('my_listings.empty_state')}
				</Text>
			)}
		</View>
	)

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
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
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>
					{t('my_listings.title')}
				</Text>
				<View style={styles.headerRight} />
			</View>

			{/* Tabs */}
			<View style={[styles.tabsContainer, { backgroundColor: colors.background }]}>
				{tabs.map(tab => {
					const isActive = activeTab === tab.key
					return (
						<TouchableOpacity
							key={tab.key}
							style={[
								styles.tab,
								isActive && [styles.activeTab, { borderBottomColor: colors.primaryColor }],
							]}
							onPress={() => setActiveTab(tab.key)}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.tabText,
									{ color: isActive ? colors.text : colors.textMuted },
									isActive && styles.activeTabText,
								]}
							>
								{tab.label}
							</Text>
						</TouchableOpacity>
					)
				})}
			</View>

			{/* Listings */}
			<FlatList
				data={filteredListings}
				renderItem={renderListingItem}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={renderEmptyState}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={refetch}
						tintColor={colors.primaryColor}
						colors={[colors.primaryColor]}
					/>
				}
			/>
		</View>
	)
}

export default MyListingsPage

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
		borderBottomWidth: 0,
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
	tabsContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},
	activeTab: {
		borderBottomWidth: 2,
	},
	tabText: {
		fontSize: 15,
		fontWeight: '500',
	},
	activeTabText: {
		fontWeight: '600',
	},
	listContent: {
		flexGrow: 1,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 15,
	},
})
