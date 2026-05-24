import { useThemeColors } from '@/hooks/use-theme-colors'
import React, { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import RemoteImage from '../shared/RemoteImage'

export interface SimilarProduct {
	id: string
	title: string
	price: string
	image: string
}

interface SimilarProductCardProps {
	item: SimilarProduct
	onPress?: (id: string) => void
	variant?: 'compact' | 'grid'
}

const SimilarProductCardComponent: React.FC<SimilarProductCardProps> = ({
	item,
	onPress,
	variant = 'compact',
}) => {
	const colors = useThemeColors()
	const isGrid = variant === 'grid'

	return (
		<Pressable
			style={[
				styles.container,
				isGrid ? styles.gridContainer : styles.compactContainer,
				{ backgroundColor: colors.background, borderColor: colors.borderColor },
			]}
			onPress={() => onPress?.(item.id)}
		>
			<RemoteImage
				src={item.image}
				style={[styles.image, isGrid ? styles.gridImage : styles.compactImage]}
				resizeMode='cover'
				cachePolicy='disk'
				requestedWidth={isGrid ? 320 : 344}
				requestedHeight={isGrid ? 244 : 216}
				requestedQuality={65}
			/>
			<View style={[styles.content, isGrid && styles.gridContent]}>
				<Text style={[styles.title, isGrid && styles.gridTitle, { color: colors.text }]} numberOfLines={isGrid ? 2 : 1}>
					{item.title}
				</Text>
				<Text style={[styles.price, isGrid && styles.gridPrice, { color: colors.primaryColor }]} numberOfLines={1}>
					{item.price}
				</Text>
			</View>
		</Pressable>
	)
}

const SimilarProductCard = memo(SimilarProductCardComponent)

export default SimilarProductCard

const styles = StyleSheet.create({
	container: {
		borderRadius: 8,
		borderWidth: 1,
		overflow: 'hidden',
	},
	compactContainer: {
		width: 172,
	},
	gridContainer: {
		width: '48%',
		minWidth: 152,
	},
	image: {
		width: '100%',
	},
	compactImage: {
		height: 108,
	},
	gridImage: {
		height: 122,
	},
	content: {
		padding: 10,
		gap: 4,
	},
	gridContent: {
		minHeight: 74,
		justifyContent: 'space-between',
	},
	title: {
		fontSize: 12,
		fontWeight: '500',
	},
	gridTitle: {
		fontSize: 13,
		lineHeight: 18,
	},
	price: {
		fontSize: 12,
		fontWeight: '700',
	},
	gridPrice: {
		fontSize: 13,
	},
})
