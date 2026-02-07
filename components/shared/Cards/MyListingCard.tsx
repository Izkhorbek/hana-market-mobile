import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export type ListingStatus = 'active' | 'sold' | 'hidden'

export interface MyListingCardProps {
	id: string
	image: string
	title: string
	price: string
	views: number
	likes: number
	timeAgo: string
	status: ListingStatus
	isInactiveTab?: boolean // When viewing from Sold or Hidden tabs
	onPress?: () => void
	onMenuPress?: () => void
}

const MyListingCard: React.FC<MyListingCardProps> = ({
	id,
	image,
	title,
	price,
	views,
	likes,
	timeAgo,
	status,
	isInactiveTab = false,
	onPress,
	onMenuPress,
}) => {
	const colors = useThemeColors()
	const { t } = useTranslations()

	// Determine if image should be grayscale (for Hidden tab items)
	const isGrayscale = isInactiveTab && status === 'hidden'

	// Determine if sold overlay should be shown
	const showSoldOverlay = status === 'sold'

	return (
		<TouchableOpacity
			style={[styles.container, { borderBottomColor: colors.borderColor }]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			{/* Image Container */}
			<View style={styles.imageContainer}>
				<Image
					source={{ uri: image }}
					style={[
						styles.image,
						isGrayscale && styles.grayscaleImage,
					]}
					resizeMode='cover'
				/>

				{/* Sold Overlay */}
				{showSoldOverlay && (
					<View style={styles.soldOverlay}>
						<View style={styles.soldBadge}>
							<Text style={styles.soldText}>{t('my_listings.sold_badge')}</Text>
						</View>
					</View>
				)}
			</View>

			{/* Content */}
			<View style={styles.content}>
				{/* Title Row */}
				<View style={styles.titleRow}>
					<Text
						style={[styles.title, { color: colors.text }]}
						numberOfLines={1}
						ellipsizeMode='tail'
					>
						{title}
					</Text>
					<TouchableOpacity
						onPress={onMenuPress}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<MaterialCommunityIcons
							name='dots-vertical'
							size={20}
							color={colors.textMuted}
						/>
					</TouchableOpacity>
				</View>

				{/* Price */}
				<Text style={[styles.price, { color: colors.text }]}>{price}</Text>

				{/* Stats Row */}
				<View style={styles.statsRow}>
					<View style={styles.statItem}>
						<Text style={[styles.statLabel, { color: colors.textMuted }]}>
							{t('my_listings.views')}
						</Text>
						<Text style={[styles.statValue, { color: colors.textMuted }]}>{views}</Text>
					</View>

					<Text style={[styles.statDivider, { color: colors.textMuted }]}>•</Text>

					<View style={styles.statItem}>
						<Text style={[styles.statLabel, { color: colors.textMuted }]}>
							{t('my_listings.likes')}
						</Text>
						<Text style={[styles.statValue, { color: colors.textMuted }]}>{likes}</Text>
					</View>

					<Text style={[styles.statDivider, { color: colors.textMuted }]}>•</Text>

					<Text style={[styles.timeAgo, { color: colors.textMuted }]}>{timeAgo}</Text>
				</View>
			</View>
		</TouchableOpacity>
	)
}

export default MyListingCard

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
	},
	imageContainer: {
		width: 64,
		height: 64,
		borderRadius: 8,
		overflow: 'hidden',
		position: 'relative',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	grayscaleImage: {
		opacity: 0.7,
		// Note: React Native doesn't support CSS grayscale filter
		// We use opacity to indicate inactive state
		// For true grayscale, you'd need a native module or process the image
	},
	soldOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	soldBadge: {
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	soldText: {
		color: '#FFFFFF',
		fontSize: 10,
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	content: {
		flex: 1,
		marginLeft: 12,
		justifyContent: 'center',
	},
	titleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	title: {
		fontSize: 15,
		fontWeight: '500',
		flex: 1,
		marginRight: 8,
	},
	price: {
		fontSize: 15,
		fontWeight: '700',
		marginTop: 2,
	},
	statsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
	},
	statItem: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	statLabel: {
		fontSize: 12,
		marginRight: 2,
	},
	statValue: {
		fontSize: 12,
		fontWeight: '500',
	},
	statDivider: {
		marginHorizontal: 6,
		fontSize: 12,
	},
	timeAgo: {
		fontSize: 12,
	},
})
