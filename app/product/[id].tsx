import { useCreateChatMutation, useProductQuery, useToggleLikeMutation } from '@/api/hooks'
import LocationMapPreview from '@/components/ProductDetail/LocationMapPreview'
import ProductImageGallery from '@/components/ProductDetail/ProductImageGallery'
import SimilarProductCard, { SimilarProduct } from '@/components/ProductDetail/SimilarProductCard'
import RemoteImage from '@/components/shared/RemoteImage'
import { AppLimits } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { router, useLocalSearchParams } from 'expo-router'
import {
	ArrowLeft,
	ChevronRight,
	Clock3,
	Heart,
	MessageCircle,
	Share2
} from 'lucide-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
	Platform,
	Share,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'
import Animated, {
	Easing,
	interpolate,
	SharedValue,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming
} from 'react-native-reanimated'

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
	const productId = id ? parseInt(id, 10) : 0
	const colors = useThemeColors()
	const { t } = useTranslations()
	const [isLiked, setIsLiked] = useState(false)
	const isLikedRef = useRef(false)
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

	// ── Real product data ────────────────────────────────────────────────────
	const { data: productRes, isLoading: productLoading } = useProductQuery({
		id: productId,
		querySettings: { enabled: productId > 0 },
	})

	const product = productRes?.data?.data

	// Derived display values
	const productTitle = product?.title ?? ''
	const productPrice = product?.is_free ? t('home.free') : (product?.price ?? '')
	const productMainImage = product?.main_image_url ?? null
	const productImages = product?.images ?? []
	const productDesc = product?.description ?? ''
	const productMoljal = product?.moljal ?? ''
	const productLat = product?.latitude ?? 41.309
	const productLng = product?.longitude ?? 69.241
	const productViews = product?.views_count ?? 0
	const productLikes = product?.likes_count ?? 0
	const productCategory = product?.category_name_uz ?? ''
	const productCreated = product?.created_ago ?? ''
	const isNegotiable = product?.is_negotiable ?? false
	const productWorkType = product?.work_type ?? null
	const productStatus = product?.status ?? 'sold'
	const productIsLiked = product?.is_liked ?? false

	// prepare images for gallery component
	const imagesGalleryImages = productImages?.map((image: string) => ({ image_url: image }));

	// Sync like state from API once product loads
	useEffect(() => {
		setIsLiked(productIsLiked)
		isLikedRef.current = productIsLiked
	}, [productIsLiked])

	// Seller info (using mock data for now)
	const productSellerId = product?.user_id ?? 0
	const productSellerUserName = product?.seller?.username ?? 'unknown'
	const productSellerLocation = product?.seller?.address_name ?? 'unknown'
	const productSellerProfileImage = product?.seller?.profile_image_url ?? null

	// ── Animations ───────────────────────────────────────────────────────────
	// Scroll position drives ALL scroll-based animations on the UI thread
	const scrollY = useSharedValue(0)
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			'worklet'
			scrollY.value = event.contentOffset.y
		},
	})

	// Entry animations
	const headerButtonsOpacity = useSharedValue(0)

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

	// Start entry animations on mount
	useEffect(() => {
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

	// ── Scroll-driven animated styles (run on UI thread, zero setState) ──────
	// Parallax hero: image moves up at PARALLAX_FACTOR speed; scales up on pull-down
	const heroImageParallaxStyle = useAnimatedStyle(() => {
		const translateY = interpolate(
			scrollY.value,
			[0, AppLimits.HERO_HEIGHT],
			[0, AppLimits.HERO_HEIGHT * AppLimits.PARALLAX_FACTOR],
			'clamp',
		)
		const scale = interpolate(
			scrollY.value,
			[-AppLimits.PARALLAX_EXTRA, 0],
			[1 + AppLimits.PARALLAX_EXTRA / AppLimits.HERO_HEIGHT, 1],
			'clamp',
		)
		return { transform: [{ scale }, { translateY }] }
	})

	// Sticky header: slides down from behind status bar and fades in
	const stickyHeaderStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
			scrollY.value,
			[AppLimits.STICKY_THRESHOLD, AppLimits.STICKY_THRESHOLD + 40],
			[0, 1],
			'clamp',
		)
		const translateY = interpolate(
			scrollY.value,
			[AppLimits.STICKY_THRESHOLD, AppLimits.STICKY_THRESHOLD + 40],
			[-AppLimits.STICKY_HEADER_HEIGHT, 0],
			'clamp',
		)
		return { opacity, transform: [{ translateY }] }
	})

	const headerButtonsStyle = useAnimatedStyle(() => ({
		opacity: headerButtonsOpacity.value,
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

	const handleMapPress = useCallback(() => {
		router.push({
			pathname: '/(tabs)/map',
			params: {
				latitude: String(productLat),
				longitude: String(productLng),
				markerTitle: productMoljal || productTitle,
			},
		})
	}, [productLat, productLng, productMoljal, productTitle])

	const { mutate: toggleLike, isPending: likePending } = useToggleLikeMutation()
	const { mutate: createChat, isPending: chatPending } = useCreateChatMutation()

	const handleLike = useCallback(() => {
		if (!isAuthenticated) { router.push('/(auth)/auth'); return }
		const next = !isLikedRef.current
		isLikedRef.current = next
		setIsLiked(next)
		toggleLike(
			{ id: productId, data: { is_liked: next } },
			{ onError: () => { isLikedRef.current = !next; setIsLiked(!next) } },
		)
	}, [isAuthenticated, productId, toggleLike])

	const handleChat = useCallback(() => {
		if (!isAuthenticated) { router.push('/(auth)/auth'); return }
		if (!productSellerId) return
		createChat(
			{ seller_id: productSellerId, product_id: productId },
			{
				onSuccess: (res) => {
					// API response is wrapped: { data: ChatRoomDto, message, code }
					const chatRoomId = res.data?.data?.id
					if (chatRoomId) {
						router.push(`/chat/${chatRoomId}`)
					}
				}
			},
		)
	}, [isAuthenticated, productSellerId, productId, createChat])

	const handleShare = useCallback(async () => {
		try {
			await Share.share({
				title: productTitle,
				message: productTitle
					? `${productTitle}\nhttps://hanamarket.uz/product/${productId}`
					: `https://hanamarket.uz/product/${productId}`,
				url: Platform.select({
					ios: `https://hanamarket.uz/product/${productId}`,
					android: `https://hanamarket.uz/product/${productId}`,
				}),
			})
		} catch (e) {
			// user dismissed or error — no-op
		}
	}, [productTitle, productId])

	const handleOpenProduct = useCallback((id: string) => {
		router.push(`/product/${id}`)
	}, [])


	//---Seller products section ------------------------------
	const { data: sellerProductsRes } = useProductQuery({
		id: productSellerId,
		querySettings: { enabled: !!productSellerId },
	})


	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			{/* Sticky Header — always present, driven by scrollY */}
			<Animated.View style={[
				styles.stickyHeader,
				{ backgroundColor: colors.background, borderBottomColor: colors.borderColor },
				stickyHeaderStyle,
			]}
				pointerEvents='box-none'
			>
				{/* Back Button */}
				<TouchableOpacity
					style={[styles.stickyBackButton, { backgroundColor: colors.profileBackground }]}
					onPress={() => router.back()}
				>
					<ArrowLeft size={20} color={colors.text} />
				</TouchableOpacity>

				{/* Square Image */}
				<RemoteImage
					src={productMainImage ?? (productImages.length > 0 ? productImages[0].image_url : null)}
					style={styles.stickyImage}
					resizeMode='cover'
				/>

				{/* Product Info */}
				<View style={styles.stickyInfo}>
					<Text style={[styles.stickyTitle, { color: colors.text }]} numberOfLines={1}>
						{productTitle}
					</Text>
					<Text style={[styles.stickyPrice, { color: colors.primaryColor }]}>
						{productPrice}
					</Text>
				</View>

				{/* Share Button */}
				<TouchableOpacity
					style={[styles.stickyShareButton, { backgroundColor: colors.profileBackground }]}
					onPress={handleShare}
				>
					<Share2 size={18} color={colors.text} />
				</TouchableOpacity>
			</Animated.View>

			{/*  Main images Section */}
			<AnimatedScrollView
				showsVerticalScrollIndicator={false}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
			>
				{/* Hero — overflow:hidden clips the parallax container */}
				<View style={styles.hero}>
					{/* Parallax container: taller than hero to allow translateY travel */}
					<Animated.View style={[styles.heroParallaxContainer, heroImageParallaxStyle]}>
						<ProductImageGallery
							mainImage={null}
							images={imagesGalleryImages}
						/>
					</Animated.View>
					<Animated.View style={[styles.heroTopRow, headerButtonsStyle]}>
						<TouchableOpacity
							style={[styles.circleButton, { backgroundColor: colors.background }]}
							onPress={() => router.back()}
						>
							<ArrowLeft size={18} color={colors.text} />
						</TouchableOpacity>
						<TouchableOpacity style={[styles.circleButton, { backgroundColor: colors.background }]} onPress={handleShare}>
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
							{productSellerProfileImage ? (
								<RemoteImage
									style={[styles.avatar]}
									src={productSellerProfileImage}
									resizeMode='cover'
								/>
							) : (
								<Text style={styles.avatarText}>{productSellerUserName.charAt(0).toUpperCase()}</Text>
							)}
							<View>
								<Text style={[styles.sellerName, { color: colors.text }]}>{productSellerUserName}</Text>
								<Text style={[styles.sellerMeta, { color: colors.textMuted }]}>
									{productMoljal ? productMoljal : productSellerLocation}
								</Text>
							</View>
						</View>
						<ChevronRight size={18} color={colors.textMuted} />
					</Animated.View>

					{/* Title & Price */}
					<Animated.View style={titleStyle}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
							{(productStatus === 'reserved' || productStatus === 'sold') &&
								<Text style={[styles.title, {
									color: productStatus === 'sold' ? colors.statusSold : colors.statusReserved,
									backgroundColor: 'rgb(235, 235, 235)',
									paddingHorizontal: 4,
									paddingVertical: 1,
									marginRight: 6,
									borderRadius: 4
								}]}>
									{productStatus}</Text>
							}
							<Text style={[styles.title, { color: colors.text }]}>{productTitle}</Text>
						</View>
					</Animated.View>
					<Animated.View style={priceStyle}>
						<Text style={[styles.price, { color: colors.primaryColor }]}>{productPrice}</Text>
						{isNegotiable && (
							<Text style={[styles.negotiable, { color: colors.textMuted }]}>
								{t('product_detail.price_negotiable')}
							</Text>
						)}
					</Animated.View>

					{/* Category and Created_ago Meta Row */}
					<Animated.View style={[styles.metaRow, metaStyle]}>
						{productCategory ? (
							<View style={styles.metaItem}>
								<Text style={[styles.metaText, { color: colors.textMuted, textDecorationLine: 'underline' }]}>{productCategory}</Text>
							</View>
						) : null}
						{productCreated ? (
							<View style={styles.metaItem}>
								<Clock3 size={14} color={colors.textMuted} />
								<Text style={[styles.metaText, { color: colors.textMuted }]}>{productCreated}</Text>
							</View>
						) : null}
					</Animated.View>

					<View style={[styles.separator, { backgroundColor: colors.borderColor }]} />

					{/* Description */}
					{productDesc ? (
						<Animated.View style={descriptionStyle}>
							<Text style={[styles.sectionTitle, { color: colors.text }]}>
								{t('product_detail.description')}
							</Text>
							<Text style={[styles.description, { color: colors.textMuted }]}>
								{productDesc}
							</Text>
						</Animated.View>
					) : null}

					{/* Meeting Location */}
					{(productLat && productLng) ? (
						<Animated.View style={locationStyle}>
							<Text style={[styles.sectionTitle, { color: colors.text, marginTop: 18 }]}>
								{t('product_detail.meeting_location')} {productMoljal ? `- ${productMoljal}` : ''}
							</Text>
							<LocationMapPreview
								title={productMoljal || t('product_detail.meeting_location')}
								subtitle={t('product_detail.tap_to_view_map')}
								latitude={productLat}
								longitude={productLng}
								onPress={handleMapPress}
							/>
						</Animated.View>
					) : null}

					<View style={[styles.separator, { backgroundColor: colors.borderColor }]} />

					{/* Stats */}
					<Animated.View style={[styles.statsRow, statsStyle]}>
						<Text style={[styles.statText, { color: colors.textMuted }]}>
							{productLikes.toLocaleString()} {t('product_detail.likes')}
						</Text>
						<Text style={[styles.statText, { color: colors.textMuted }]}>
							{productViews.toLocaleString()} {t('product_detail.views')}
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
				<TouchableOpacity
					style={[
						styles.likeButton,
						{ borderColor: isLiked ? colors.primaryColor : colors.borderColor },
					]}
					onPress={handleLike}
					disabled={likePending}
				>
					<Heart
						size={22}
						color={isLiked ? colors.primaryColor : colors.textMuted}
						fill={isLiked ? colors.primaryColor : 'transparent'}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.chatButton, { backgroundColor: colors.primaryColor, opacity: chatPending ? 0.7 : 1 }]}
					onPress={handleChat}
					disabled={chatPending}
				>
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
		paddingTop: AppLimits.STATUS_BAR_HEIGHT,
		height: AppLimits.STICKY_HEADER_HEIGHT,
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
	hero: { height: AppLimits.HERO_HEIGHT, position: 'relative', overflow: 'hidden' },
	// Extends below clip area to allow parallax translateY without revealing empty space
	heroParallaxContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: -AppLimits.PARALLAX_EXTRA,
	},
	heroTopRow: {
		position: 'absolute',
		top: AppLimits.STATUS_BAR_HEIGHT + 10,
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
	metaText: { fontSize: 14 },
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
