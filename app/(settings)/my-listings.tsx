import MyListingCard, { ListingStatus, MyListingCardProps } from '@/components/shared/Cards/MyListingCard'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React, { useState } from 'react'
import {
	FlatList,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

type TabType = 'active' | 'sold' | 'hidden'

interface TabItem {
	key: TabType
	label: string
}

// Mock data for demonstration
const mockListings: MyListingCardProps[] = [
	{
		id: '1',
		image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200',
		title: 'Vintage Film Camera',
		price: '$85',
		views: 24,
		likes: 5,
		timeAgo: '2 days ago',
		status: 'active',
	},
	{
		id: '2',
		image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200',
		title: 'Modern Office Chair',
		price: '$120',
		views: 18,
		likes: 3,
		timeAgo: '4 days ago',
		status: 'active',
	},
	{
		id: '3',
		image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200',
		title: 'Polaroid Camera',
		price: '$45',
		views: 31,
		likes: 7,
		timeAgo: '1 day ago',
		status: 'active',
	},
	{
		id: '4',
		image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200',
		title: 'Mountain Bike',
		price: '$200',
		views: 42,
		likes: 8,
		timeAgo: '1 week ago',
		status: 'sold',
	},
	{
		id: '5',
		image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
		title: 'Nike Air Sneakers',
		price: '$65',
		views: 12,
		likes: 2,
		timeAgo: '3 days ago',
		status: 'hidden',
	},
]

const MyListingsPage = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const [activeTab, setActiveTab] = useState<TabType>('active')

	const tabs: TabItem[] = [
		{ key: 'active', label: t('my_listings.tab_active') },
		{ key: 'sold', label: t('my_listings.tab_sold') },
		{ key: 'hidden', label: t('my_listings.tab_hidden') },
	]

	const handleGoBack = () => {
		router.back()
	}

	const handleListingPress = (listing: MyListingCardProps) => {
		console.log('Listing pressed:', listing.id)
		// TODO: Navigate to listing detail
	}

	const handleMenuPress = (listing: MyListingCardProps) => {
		console.log('Menu pressed for:', listing.id)
		// TODO: Show action sheet with options (edit, delete, hide, mark as sold, etc.)
	}

	// Filter listings based on active tab
	const filteredListings = mockListings.filter(listing => listing.status === activeTab)

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
			<Text style={[styles.emptyText, { color: colors.textMuted }]}>
				{t('my_listings.empty_state')}
			</Text>
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
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
