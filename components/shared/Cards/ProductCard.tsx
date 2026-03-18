import RemoteImage from '@/components/shared/RemoteImage'
import { AppLimits } from '@/constants/appLimits'
import { Colors } from '@/constants/theme'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface ProductCardProps {
	title: string
	description: string
	moljal: string
	main_image_url: string
	is_free?: boolean
	price: string | number
	status: string
	distance: string
	view_count: number
	likes_count: number
	created_ago: string
	onPress?: () => void
	onDotsPress?: () => void
	onHeartPress?: () => void
}

const ProductCard: React.FC<ProductCardProps> = ({
	title,
	description,
	main_image_url,
	distance,
	created_ago,
	moljal,
	price,
	is_free,
	status,
	likes_count,
	view_count,
	onPress,
	onDotsPress,
	onHeartPress,
}) => {
	const colors = useThemeColors()
	const { t } = useTranslations();

	console.log('imagesrc', main_image_url);
	return (
		<TouchableOpacity
			style={[styles.container, { borderColor: colors.borderColor }]}
			activeOpacity={0.8}
			onPress={onPress}
		>
			{/* Product Image */}
			<TouchableOpacity onPress={onPress}>
				<RemoteImage src={main_image_url} style={styles.image} resizeMode='cover' />
			</TouchableOpacity>

			{/* Content Section */}
			<View style={styles.content}>
				<View>
					{/* Header with Title and Dots */}
					<View style={styles.header}>
						<Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
							{title}
						</Text>
						<TouchableOpacity onPress={onDotsPress} style={styles.dotsButton}>
							<MaterialCommunityIcons name='dots-vertical' size={20} color={colors.subText} />
						</TouchableOpacity>
					</View>

					{/* Location and Time Row */}
					<View style={styles.infoRow}>
						<View style={styles.infoItem}>
							<MaterialIcons name='location-on' size={14} color={colors.subText} />
							<Text style={[styles.infoText, { color: colors.subText }]}>{distance}</Text>
						</View>
						<View style={styles.infoItem}>
							<Ionicons name='time-outline' size={14} color={colors.subText} />
							<Text style={[styles.infoText, { color: colors.subText }]}>{created_ago}</Text>
						</View>
					</View>

					{/* Moljal */}
					<Text style={[styles.address, { color: colors.subText }]} numberOfLines={1}>
						{moljal}
					</Text>
				</View>
				{/* Price and Likes Row */}
				<View style={styles.footer}>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
						{(status === 'reserved' || status === 'sold') &&
							<Text style={{
								fontSize: 12,
								color: 'white',
								backgroundColor: AppLimits.ProductStatusColors[status as keyof typeof AppLimits.ProductStatusColors],
								paddingHorizontal: 4,
								paddingVertical: 1,
								borderRadius: 4
							}}>
								{status}</Text>
						}
						{is_free && <Text style={{
							fontSize: 16,
							color: 'white',
							backgroundColor: Colors.light.primaryColor,
							paddingHorizontal: 8,
							paddingVertical: 1,
							borderRadius: 4
						}}>
							{t('home.free')}
						</Text>}
						<Text style={[styles.price, { color: colors.text }]}>{price}</Text>
					</View>
					<TouchableOpacity onPress={onHeartPress} style={styles.likesContainer}>
						<Ionicons name='heart' size={18} color={colors.subText} />
						<Text style={[styles.likesText, { color: colors.subText }]}>{likes_count}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		overflow: 'hidden',
		borderColor: Colors.light.borderColor,
		marginVertical: 0,
		paddingVertical: 8,
		marginHorizontal: 10,
	},
	image: {
		width: 130,
		height: 130,
		borderRadius: 8,
	},
	content: {
		flex: 1,
		paddingLeft: 10,
		paddingVertical: 2,
		justifyContent: 'space-between',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	title: {
		fontSize: 18,
		fontWeight: '400',
		flex: 1,
		marginRight: 8,
		lineHeight: 20,
	},
	dotsButton: {
		padding: 2,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
		gap: 12,
	},
	infoItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
	},
	infoText: {
		fontSize: 14,
		fontWeight: '400',
	},
	address: {
		fontSize: 14,
		fontWeight: '400',
		marginTop: 5,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	price: {
		fontSize: 16,
		fontWeight: '700',
	},
	likesContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	likesText: {
		fontSize: 14,
		fontWeight: '400',
	},
})

export default ProductCard
