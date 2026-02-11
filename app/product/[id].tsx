import LocationMapPreview from '@/components/ProductDetail/LocationMapPreview'
import SimilarProductCard, { SimilarProduct } from '@/components/ProductDetail/SimilarProductCard'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router, useLocalSearchParams } from 'expo-router'
import {
	ArrowLeft,
	ChevronRight,
	Clock3,
	Heart,
	MapPin,
	MessageCircle,
	Share2,
} from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import {
	Dimensions,
	Image,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import Animated, {
	Easing,
	interpolate,
	SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from 'react-native-reanimated'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const STICKY_HEADER_HEIGHT = 80
const HERO_HEIGHT = 320
const STICKY_THRESHOLD = HERO_HEIGHT - STICKY_HEADER_HEIGHT - 20

const mockSellerProducts: SimilarProduct[] = [
	{
		id: '11',
		title: 'MacBook Pro 16"',
		price: '25,000,000 UZS',
		image:
			'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=700&q=80',
	},
	{
		id: '12',
		title: 'iPhone 15 Pro Max',
		price: '18,000,000 UZS',
		image:
			'https://images.unsplash.com/photo-1510557880182-3f8f7a2d47cb?auto=format&fit=crop&w=700&q=80',
	},
	{
		id: '13',
		title: 'Sofa Set',
		price: '8,500,000 UZS',
		image:
			'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80',
	},
]

const mockSimilarProducts: SimilarProduct[] = [
	{
		id: '21',
		title: 'Modern 2-Room',
		price: '450,000 $',
		image:
			'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80',
	},
	{
		id: '22',
		title: '3-Room',
		price: '550,000 $',
		image:
			'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=700&q=80',
	},
	{
		id: '23',
		title: 'Luxury Apartment',
		price: '750,000 $',
		image:
			'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=700&q=80',
	},
]

// Product data (mock)
const productData = {
	title: 'Modern Renovated 3-Room Apartment',
	price: '500,000 $',
	image:
		'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
}

// Animation configuration
const ANIMATION_CONFIG = {
	imageScale: { initial: 0.85, final: 1 },
	imageDuration: 400,
	contentDelay: 150,
	contentDuration: 350,
	staggerDelay: 60,
}

// Animated ScrollView
const AnimatedScrollView = Animated.ScrollView

const ProductDetailPage: React.FC = () => {
	const { id } = useLocalSearchParams<{ id?: string }>()
	const colors = useThemeColors()
	const { t } = useTranslations()
	const [showStickyHeader, setShowStickyHeader] = useState(false)

	// Animation values
	const imageScale = useSharedValue(ANIMATION_CONFIG.imageScale.initial)
	const imageOpacity = useSharedValue(0)
	const headerButtonsOpacity = useSharedValue(0)
	const stickyHeaderOpacity = useSharedValue(0)

	// Content section animations (staggered from top to bottom)
	const sellerRowAnim = useSharedValue(0)
	const titleAnim = useSharedValue(0)
	const priceAnim = useSharedValue(0)
	const metaAnim = useSharedValue(0)
	const descriptionAnim = useSharedValue(0)
	const locationAnim = useSharedValue(0)
	const statsAnim = useSharedValue(0)
	const sellerProductsAnim = useSharedValue(0)
	const similarProductsAnim = useSharedValue(0)
	const bottomBarAnim = useSharedValue(0)

	// Start animations on mount
	useEffect(() => {
		// Hero image scale animation
		imageOpacity.value = withTiming(1, { duration: 200 })
		imageScale.value = withSpring(ANIMATION_CONFIG.imageScale.final, {
			damping: 15,
			stiffness: 100,
		})

		// Header buttons fade in
		headerButtonsOpacity.value = withDelay(200, withTiming(1, { duration: 300 }))

		// Content sections flow in from top to bottom with stagger
		const baseDelay = ANIMATION_CONFIG.contentDelay
		const stagger = ANIMATION_CONFIG.staggerDelay
		const duration = ANIMATION_CONFIG.contentDuration
		const easing = Easing.out(Easing.cubic)

		sellerRowAnim.value = withDelay(baseDelay, withTiming(1, { duration, easing }))
		titleAnim.value = withDelay(baseDelay + stagger, withTiming(1, { duration, easing }))
		priceAnim.value = withDelay(baseDelay + stagger * 2, withTiming(1, { duration, easing }))
		metaAnim.value = withDelay(baseDelay + stagger * 3, withTiming(1, { duration, easing }))
		descriptionAnim.value = withDelay(baseDelay + stagger * 4, withTiming(1, { duration, easing }))
		locationAnim.value = withDelay(baseDelay + stagger * 5, withTiming(1, { duration, easing }))
		statsAnim.value = withDelay(baseDelay + stagger * 6, withTiming(1, { duration, easing }))
		sellerProductsAnim.value = withDelay(
			baseDelay + stagger * 7,
			withTiming(1, { duration, easing }),
		)
		similarProductsAnim.value = withDelay(
			baseDelay + stagger * 8,
			withTiming(1, { duration, easing }),
		)
		bottomBarAnim.value = withDelay(baseDelay + stagger * 9, withTiming(1, { duration, easing }))
	}, [])

	// Handle scroll for sticky header
	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetY = event.nativeEvent.contentOffset.y
		const shouldShow = offsetY > STICKY_THRESHOLD

		if (shouldShow !== showStickyHeader) {
			setShowStickyHeader(shouldShow)
			stickyHeaderOpacity.value = withTiming(shouldShow ? 1 : 0, { duration: 200 })
		}
	}

	// Animated styles
	const heroImageStyle = useAnimatedStyle(() => ({
		transform: [{ scale: imageScale.value }],
		opacity: imageOpacity.value,
	}))

	const headerButtonsStyle = useAnimatedStyle(() => ({
		opacity: headerButtonsOpacity.value,
	}))

	const stickyHeaderStyle = useAnimatedStyle(() => ({
		opacity: stickyHeaderOpacity.value,
		transform: [{ translateY: interpolate(stickyHeaderOpacity.value, [0, 1], [-20, 0]) }],
	}))

	// Helper to create slide-up + fade-in animation style
	const createSlideUpStyle = (animValue: SharedValue<number>, translateY = 20) =>
		useAnimatedStyle(() => ({
			opacity: animValue.value,
			transform: [{ translateY: interpolate(animValue.value, [0, 1], [translateY, 0]) }],
		}))

	const sellerRowStyle = createSlideUpStyle(sellerRowAnim)
	const titleStyle = createSlideUpStyle(titleAnim)
	const priceStyle = createSlideUpStyle(priceAnim, 15)
	const metaStyle = createSlideUpStyle(metaAnim, 15)
	const descriptionStyle = createSlideUpStyle(descriptionAnim)
	const locationStyle = createSlideUpStyle(locationAnim)
	const statsStyle = createSlideUpStyle(statsAnim, 15)
	const sellerProductsStyle = createSlideUpStyle(sellerProductsAnim)
	const similarProductsStyle = createSlideUpStyle(similarProductsAnim)
	const bottomBarStyle = useAnimatedStyle(() => ({
		opacity: bottomBarAnim.value,
		transform: [{ translateY: interpolate(bottomBarAnim.value, [0, 1], [50, 0]) }],
	}))

	const latitude = 41.309
	const longitude = 69.241
	const locationText = 'Chilonzor, Tashkent'

	const handleMapPress = () => {
		router.push({
			pathname: '/(tabs)/map',
			params: {
				latitude: String(latitude),
				longitude: String(longitude),
				markerTitle: 'Meeting location',
			},
		})
	}

	const handleOpenProduct = (productId: string) => {
		router.push(`/product/${productId}`)
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			{/* Sticky Header - appears on scroll */}
			{showStickyHeader && (
				<Animated.View
					style={[
						styles.stickyHeader,
						{ backgroundColor: colors.background, borderBottomColor: colors.borderColor },
						stickyHeaderStyle,
					]}
				>
					{/* Back Button */}
					<TouchableOpacity
						style={[styles.stickyBackButton, { backgroundColor: colors.profileBackground }]}
						onPress={() => router.back()}
					>
						<ArrowLeft size={20} color={colors.text} />
					</TouchableOpacity>

					{/* Square Image */}
					<Image
						source={{ uri: productData.image }}
						style={styles.stickyImage}
						resizeMode='cover'
					/>

					{/* Product Info */}
					<View style={styles.stickyInfo}>
						<Text style={[styles.stickyTitle, { color: colors.text }]} numberOfLines={1}>
							{productData.title}
						</Text>
						<Text style={[styles.stickyPrice, { color: colors.primaryColor }]}>
							{productData.price}
						</Text>
					</View>

					{/* Share Button */}
					<TouchableOpacity
						style={[styles.stickyShareButton, { backgroundColor: colors.profileBackground }]}
						onPress={() => console.log('Share')}
					>
						<Share2 size={18} color={colors.text} />
					</TouchableOpacity>
				</Animated.View>
			)}

			<AnimatedScrollView
				showsVerticalScrollIndicator={false}
				onScroll={handleScroll}
				scrollEventThrottle={16}
			>
				{/* Hero Section with Scale Animation */}
				<View style={styles.hero}>
					<Animated.View style={[styles.heroImageContainer, heroImageStyle]}>
						<Image
							source={{ uri: productData.image }}
							style={styles.heroImage}
							resizeMode='cover'
						/>
					</Animated.View>
					<Animated.View style={[styles.heroTopRow, headerButtonsStyle]}>
						<TouchableOpacity
							style={[styles.circleButton, { backgroundColor: colors.background }]}
							onPress={() => router.back()}
						>
							<ArrowLeft size={18} color={colors.text} />
						</TouchableOpacity>
						<TouchableOpacity style={[styles.circleButton, { backgroundColor: colors.background }]}>
							<Share2 size={18} color={colors.text} />
						</TouchableOpacity>
					</Animated.View>
				</View>

				<View style={[styles.content, { backgroundColor: colors.profileBackground }]}>
					{/* Seller Row */}
					<Animated.View
						style={[styles.sellerRow, { borderBottomColor: colors.borderColor }, sellerRowStyle]}
					>
						<View style={styles.sellerInfo}>
							<View style={[styles.avatar, { backgroundColor: colors.primaryColor }]}>
								<Text style={styles.avatarText}>A</Text>
							</View>
							<View>
								<Text style={[styles.sellerName, { color: colors.text }]}>Aziz Rahimov</Text>
								<Text style={[styles.sellerMeta, { color: colors.textMuted }]}>
									Chilonzor, Tashkent
								</Text>
							</View>
						</View>
						<ChevronRight size={18} color={colors.textMuted} />
					</Animated.View>

					{/* Title & Price */}
					<Animated.View style={titleStyle}>
						<Text style={[styles.title, { color: colors.text }]}>{productData.title}</Text>
					</Animated.View>
					<Animated.View style={priceStyle}>
						<Text style={[styles.price, { color: colors.primaryColor }]}>{productData.price}</Text>
						<Text style={[styles.negotiable, { color: colors.textMuted }]}>
							{t('product_detail.price_negotiable')}
						</Text>
					</Animated.View>

					{/* Meta Row */}
					<Animated.View style={[styles.metaRow, metaStyle]}>
						<View style={styles.metaItem}>
							<MapPin size={14} color={colors.textMuted} />
							<Text style={[styles.metaText, { color: colors.textMuted }]}>Real Estate</Text>
						</View>
						<View style={styles.metaItem}>
							<Clock3 size={14} color={colors.textMuted} />
							<Text style={[styles.metaText, { color: colors.textMuted }]}>2 hours ago</Text>
						</View>
					</Animated.View>

					<View style={[styles.separator, { backgroundColor: colors.borderColor }]} />

					{/* Description */}
					<Animated.View style={descriptionStyle}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							{t('product_detail.description')}
						</Text>
						<Text style={[styles.description, { color: colors.textMuted }]}>
							Located in Chilonzor district, this newly renovated 3-room apartment is for sale.
							Total area is 85 sq.m. 5th floor out of 9. All utilities available: water, gas,
							electricity. The apartment is fully furnished, with clean stairways and elevator.
							Nearby schools, kindergartens, shops and public transport stops are available.
						</Text>
					</Animated.View>

					{/* Meeting Location */}
					<Animated.View style={locationStyle}>
						<Text style={[styles.sectionTitle, { color: colors.text, marginTop: 18 }]}>
							{t('product_detail.meeting_location')}
						</Text>
						<LocationMapPreview
							title={locationText}
							subtitle={t('product_detail.tap_to_view_map')}
							onPress={handleMapPress}
						/>
					</Animated.View>

					<View style={[styles.separator, { backgroundColor: colors.borderColor }]} />

					{/* Stats */}
					<Animated.View style={[styles.statsRow, statsStyle]}>
						<Text style={[styles.statText, { color: colors.textMuted }]}>
							1,234 {t('product_detail.likes')}
						</Text>
						<Text style={[styles.statText, { color: colors.textMuted }]}>
							5,678 {t('product_detail.views')}
						</Text>
					</Animated.View>

					{/* More from this seller */}
					<Animated.View style={sellerProductsStyle}>
						<View style={styles.sectionHeaderRow}>
							<Text style={[styles.sectionTitle, { color: colors.text }]}>
								{t('product_detail.more_from_seller')}
							</Text>
							<Text style={[styles.seeAll, { color: colors.primaryColor }]}>
								{t('product_detail.see_all')}
							</Text>
						</View>
						<Animated.ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.hList}
						>
							{mockSellerProducts.map(item => (
								<SimilarProductCard key={item.id} item={item} onPress={handleOpenProduct} />
							))}
						</Animated.ScrollView>
					</Animated.View>

					{/* Similar Listings */}
					<Animated.View style={similarProductsStyle}>
						<View style={styles.sectionHeaderRow}>
							<Text style={[styles.sectionTitle, { color: colors.text }]}>
								{t('product_detail.similar_listings')}
							</Text>
							<Text style={[styles.seeAll, { color: colors.primaryColor }]}>
								{t('product_detail.see_all')}
							</Text>
						</View>
						<Animated.ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.hList}
						>
							{mockSimilarProducts.map(item => (
								<SimilarProductCard key={item.id} item={item} onPress={handleOpenProduct} />
							))}
						</Animated.ScrollView>
					</Animated.View>
				</View>
			</AnimatedScrollView>

			{/* Bottom Bar with slide-up animation */}
			<Animated.View
				style={[
					styles.bottomBar,
					{ backgroundColor: colors.background, borderTopColor: colors.borderColor },
					bottomBarStyle,
				]}
			>
				<TouchableOpacity style={[styles.likeButton, { borderColor: colors.borderColor }]}>
					<Heart size={22} color={colors.textMuted} />
				</TouchableOpacity>
				<TouchableOpacity style={[styles.chatButton, { backgroundColor: colors.primaryColor }]}>
					<MessageCircle size={20} color='#fff' />
					<Text style={styles.chatButtonText}>{t('product_detail.chat_with_seller')}</Text>
				</TouchableOpacity>
			</Animated.View>
		</View>
	)
}

export default ProductDetailPage

const styles = StyleSheet.create({
	container: { flex: 1 },

	// Sticky Header Styles
	stickyHeader: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 100,
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: Platform.OS === 'ios' ? 50 : 10,
		paddingBottom: 10,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		gap: 10,
	},
	stickyBackButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	stickyImage: {
		width: 50,
		height: 50,
		borderRadius: 8,
	},
	stickyInfo: {
		flex: 1,
		justifyContent: 'center',
	},
	stickyTitle: {
		fontSize: 14,
		fontWeight: '600',
	},
	stickyPrice: {
		fontSize: 15,
		fontWeight: '700',
		marginTop: 2,
	},
	stickyShareButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Hero Section
	hero: { height: HERO_HEIGHT, position: 'relative', overflow: 'hidden' },
	heroImageContainer: { width: '100%', height: '100%' },
	heroImage: { width: '100%', height: '100%' },
	heroTopRow: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 54 : 14,
		left: 14,
		right: 14,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	circleButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Content
	content: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 120,
	},
	sellerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: 12,
		borderBottomWidth: 1,
	},
	sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	avatar: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
	sellerName: { fontSize: 15, fontWeight: '700' },
	sellerMeta: { fontSize: 12, marginTop: 2 },
	title: { marginTop: 14, fontSize: 24, fontWeight: '700', lineHeight: 30 },
	price: { marginTop: 10, fontSize: 26, fontWeight: '800' },
	negotiable: { fontSize: 13, marginTop: 4 },
	metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
	metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
	metaText: { fontSize: 12 },
	separator: { height: 1, marginVertical: 14 },
	sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
	description: { marginTop: 10, fontSize: 14, lineHeight: 22 },
	statsRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
	statText: { fontSize: 13 },
	sectionHeaderRow: {
		marginTop: 8,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	seeAll: { fontSize: 13, fontWeight: '600' },
	hList: { gap: 10, paddingBottom: 12 },

	// Bottom Bar - increased height
	bottomBar: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: Platform.OS === 'ios' ? 34 : 20,
		flexDirection: 'row',
		gap: 12,
		borderTopWidth: 1,
	},
	likeButton: {
		width: 52,
		height: 52,
		borderWidth: 1.5,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	chatButton: {
		flex: 1,
		height: 52,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
	},
	chatButtonText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 16,
	},
})
