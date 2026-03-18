import { useThemeColors } from '@/hooks/use-theme-colors'
import React from 'react'
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
}

const SimilarProductCard: React.FC<SimilarProductCardProps> = ({ item, onPress }) => {
	const colors = useThemeColors()

	return (
		<Pressable
			style={[styles.container, { backgroundColor: colors.background, borderColor: colors.borderColor }]}
			onPress={() => onPress?.(item.id)}
		>
			<RemoteImage src={item.image} style={styles.image} resizeMode='cover' />
			<View style={styles.content}>
				<Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
					{item.title}
				</Text>
				<Text style={[styles.price, { color: colors.primaryColor }]} numberOfLines={1}>
					{item.price}
				</Text>
			</View>
		</Pressable>
	)
}

export default SimilarProductCard

const styles = StyleSheet.create({
	container: {
		width: '50%',
		borderRadius: 8,
		borderWidth: 1,
		overflow: 'hidden',
	},
	image: {
		width: '100%',
		height: 90,
	},
	content: {
		padding: 8,
		gap: 4,
	},
	title: {
		fontSize: 12,
		fontWeight: '500',
	},
	price: {
		fontSize: 12,
		fontWeight: '700',
	},
})
