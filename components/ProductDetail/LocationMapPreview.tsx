import { useThemeColors } from '@/hooks/use-theme-colors'
import { MapPin } from 'lucide-react-native'
import React from 'react'
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native'

interface LocationMapPreviewProps {
	title: string
	subtitle: string
	onPress?: () => void
}

const LocationMapPreview: React.FC<LocationMapPreviewProps> = ({ title, subtitle, onPress }) => {
	const colors = useThemeColors()

	return (
		<Pressable
			style={[styles.container, { backgroundColor: colors.background, borderColor: colors.borderColor }]}
			onPress={onPress}
		>
			<ImageBackground
				source={{
					uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=80',
				}}
				style={styles.mapImage}
				imageStyle={styles.mapImageRadius}
			>
				<View style={styles.overlay} />
				<View style={styles.content}>
					<View style={[styles.pinCircle, { backgroundColor: `${colors.primaryColor}18` }]}>
						<MapPin size={18} color={colors.primaryColor} />
					</View>
					<Text style={[styles.title, { color: '#fff' }]}>{title}</Text>
					<Text style={[styles.subtitle, { color: '#e5e7eb' }]}>{subtitle}</Text>
					<Text style={[styles.hint, { color: '#d1d5db' }]}>Tap to view on map</Text>
				</View>
			</ImageBackground>
		</Pressable>
	)
}

export default LocationMapPreview

const styles = StyleSheet.create({
	container: {
		borderWidth: 1,
		borderRadius: 12,
		overflow: 'hidden',
	},
	mapImage: {
		height: 130,
	},
	mapImageRadius: {
		borderRadius: 12,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.33)',
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 12,
	},
	pinCircle: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10,
	},
	title: {
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 13,
		marginTop: 3,
		textAlign: 'center',
	},
	hint: {
		fontSize: 12,
		marginTop: 5,
	},
})
