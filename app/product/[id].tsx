import { useCreateChatMutation, useProductQuery, useProductsBySellerQuery, useRelatedProductsQuery, useToggleLikeMutation } from '@/api/hooks'
import LocationMapPreview from '@/components/ProductDetail/LocationMapPreview'
import ProductImageGallery from '@/components/ProductDetail/ProductImageGallery'
import SimilarProductCard, { SimilarProduct } from '@/components/ProductDetail/SimilarProductCard'
import RemoteImage from '@/components/shared/RemoteImage'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import ImageViewer from '@/components/ui/ImageViewer'
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
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

interface ProductCollectionSheetProps {
	isVisible: boolean
	title: string
	contextLabel?: string
	products: SimilarProduct[]
	onClose: () => void
	onPressProduct: (id: string) => void
	colors: ReturnType<typeof useThemeColors>
}

const ProductCollectionSheet: React.FC<ProductCollectionSheetProps> = ({
	isVisible,
	title,
	contextLabel,
	products,
	onClose,
	onPressProduct,
	colors,
}) => {
	return (
		<BottomSheet
			isVisible={isVisible}
			onClose={onClose}
			snapPoints={[0.78]}
			style={{ backgroundColor: colors.background }}
		>
			<View style={styles.sheetContent}>
				<View style={[
					styles.sheetHero,
					{ backgroundColor: colors.card, borderColor: colors.borderColor },
				]}>
					<View style={styles.sheetHeroTextWrap}>
						<Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
						{contextLabel ? (
							<Text style={[styles.sheetSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
								{contextLabel}
							</Text>
						) : null}
					</View>
					<View style={[styles.sheetCountBadge, { backgroundColor: `${colors.primaryColor}18` }]}>
						<Text style={[styles.sheetCountText, { color: colors.primaryColor }]}>{products.length}</Text>
					</View>
				</View>

				<View style={styles.sheetGrid}>
					{products.map((item) => (
						<SimilarProductCard
							key={item.id}
							item={item}
							variant='grid'
							onPress={onPressProduct}
						/>
					))}
				</View>
			</View>
		</BottomSheet>
	)
}

const ProductDetailPage: React.FC = () => {
	const { id } = useLocalSearchParams<{ id?: string }>()
	const productId = id ? parseInt(id, 10) : 0
	const colors = useThemeColors()
	const { t } = useTranslations()
	const [isLiked, setIsLiked] = useState(false)
	const isLikedRef = useRef(false)
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const currentUserId = useAuthStore((s) => s.user?.id)
	const user = useAuthStore((s) => s.user)

	console.log("user", user)

	// Image viewer state
	const [imageViewerVisible, setImageViewerVisible] = useState(false)
	const [imageViewerIndex, setImageViewerIndex] = useState(0)
	const [imageViewerUrls, setImageViewerUrls] = useState<string[]>([])
	const [activeSheet, setActiveSheet] = useState<'related' | null>(null)

	// Handle image press from gallery
	const handleImagePress = useCallback((index: number, urls: string[]) => {
		setImageViewerIndex(index)
		setImageViewerUrls(urls)
		setImageViewerVisible(true)
	}, [])

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

	// Seller info
	const productSellerId = product?.user_id ?? 0
	const isMyProduct = !!currentUserId && productSellerId === currentUserId
	const productSellerUserName = product?.seller?.username ?? 'unknown'
	const productSellerLocation = product?.seller?.address_name ?? 'unknown'
	const productSellerProfileImage = product?.seller?.profile_image_url ?? null

	console.log("product", product)
	console.log('currentUserId', currentUserId)
	console.log('isMyProduct', isMyProduct)

	// ── Seller products ──────────────────────────────────────────────────────
	const { data: sellerProductsRes } = useProductsBySellerQuery({
		sellerId: productSellerId,
		pageSize: 12,
		querySettings: { enabled: productSellerId > 0 },
	})
	const sellerProducts: SimilarProduct[] = (sellerProductsRes?.data?.data?.items ?? [])
		.filter((p: any) => Number(p.id) !== productId)
		.map((p: any) => ({
			id: String(p.id),
			title: p.title ?? '',
			price: p.is_free ? t('home.free') : (p.price ?? ''),
			image: p.main_image_url ?? '',
		}))

	// ── Related products ─────────────────────────────────────────────────────
	const { data: relatedProductsRes } = useRelatedProductsQuery({
		productId,
		querySettings: { enabled: productId > 0 },
	})
	const relatedProducts: SimilarProduct[] = (relatedProductsRes?.data?.data ?? [])
		.filter((p: any) => Number(p.id) !== productId)
		.map((p: any) => ({
			id: String(p.id),
			title: p.title ?? '',
			price: p.is_free ? t('home.free') : (p.price ?? ''),
			image: p.main_image_url ?? '',
		}))

	const sellerPreviewProducts = sellerProducts.slice(0, 6)
	const relatedPreviewProducts = relatedProducts.slice(0, 6)

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
			pathname: '/product/location',
			params: {
				latitude: String(productLat),
				longitude: String(productLng),
				title: productTitle,
				moljal: productMoljal,
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
		if (isMyProduct) return
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
	}, [isAuthenticated, isMyProduct, productSellerId, productId, createChat])

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
		setActiveSheet(null)
		router.push(`/product/${id}`)
	}, [])

	const handleOpenSellerProducts = useCallback(() => {
		if (!productSellerId) return
		router.push({
			pathname: '/product/seller/[sellerId]',
			params: {
				sellerId: String(productSellerId),
				sellerName: productSellerUserName,
			},
		})
	}, [productSellerId, productSellerUserName])


	//---Seller products section ------------------------------
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
							onImagePress={handleImagePress}
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
					<AnimatedTouchableOpacity
						style={[styles.sellerRow, { borderBottomColor: colors.borderColor }, sellerRowStyle]}
						onPress={handleOpenSellerProducts}
						activeOpacity={0.8}
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
					</AnimatedTouchableOpacity>

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
					{sellerProducts.length > 0 && (
						<Animated.View style={sellerProductsStyle}>
							<View style={styles.sectionHeaderRow}>
								<Text style={[styles.sectionTitle, { color: colors.text }]}>
									{t('product_detail.more_from_seller')}
								</Text>
								<TouchableOpacity onPress={handleOpenSellerProducts} activeOpacity={0.75}>
									<Text style={[styles.seeAll, { color: colors.primaryColor }]}>
										{t('product_detail.see_all')}
									</Text>
								</TouchableOpacity>
							</View>
							<Animated.ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.hList}
							>
								{sellerPreviewProducts.map(item => (
									<SimilarProductCard key={item.id} item={item} onPress={handleOpenProduct} />
								))}
							</Animated.ScrollView>
						</Animated.View>
					)}

					{/* Related Products */}
					{relatedProducts.length > 0 && (
						<Animated.View style={similarProductsStyle}>
							<View style={styles.sectionHeaderRow}>
								<Text style={[styles.sectionTitle, { color: colors.text }]}>
									{t('product_detail.similar_listings')}
								</Text>
								{/* <TouchableOpacity onPress={() => setActiveSheet('related')} activeOpacity={0.75}>
									<Text style={[styles.seeAll, { color: colors.primaryColor }]}>
										{t('product_detail.see_all')}
									</Text>
								</TouchableOpacity> */}
							</View>
							<Animated.ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.hList}
							>
								{relatedPreviewProducts.map(item => (
									<SimilarProductCard key={item.id} item={item} onPress={handleOpenProduct} />
								))}
							</Animated.ScrollView>
						</Animated.View>
					)}
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
					style={[
						styles.chatButton,
						{
							backgroundColor: colors.primaryColor,
							opacity: chatPending || isMyProduct ? 0.45 : 1,
						},
					]}
					onPress={handleChat}
					disabled={chatPending || isMyProduct}
				>
					<MessageCircle size={20} color='#fff' />
					<Text style={styles.chatButtonText}>{t('product_detail.chat_with_seller')}</Text>
				</TouchableOpacity>
			</Animated.View>

			{/* Fullscreen Image Viewer */}
			<ImageViewer
				visible={imageViewerVisible}
				images={imageViewerUrls}
				initialIndex={imageViewerIndex}
				onClose={() => setImageViewerVisible(false)}
			/>

			<ProductCollectionSheet
				isVisible={activeSheet === 'related'}
				title={t('product_detail.similar_listings')}
				contextLabel={productCategory}
				products={relatedProducts}
				onClose={() => setActiveSheet(null)}
				onPressProduct={handleOpenProduct}
				colors={colors}
			/>
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
	hList: { gap: 10, paddingBottom: 12, paddingRight: 16 },
	sheetContent: {
		gap: 16,
	},
	sheetHero: {
		borderWidth: 1,
		borderRadius: 18,
		paddingHorizontal: 16,
		paddingVertical: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	sheetHeroTextWrap: {
		flex: 1,
		gap: 4,
	},
	sheetTitle: {
		fontSize: 18,
		fontWeight: '700',
	},
	sheetSubtitle: {
		fontSize: 13,
	},
	sheetCountBadge: {
		minWidth: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 12,
	},
	sheetCountText: {
		fontSize: 15,
		fontWeight: '700',
	},
	sheetGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: 12,
		columnGap: 0,
		paddingBottom: 12,
	},

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
