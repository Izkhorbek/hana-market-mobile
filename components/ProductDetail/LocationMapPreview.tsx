import { googleMapStyle } from '@/components/Maps/googleMapStyle'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { ABSOLUTE_FILL } from '@/constants/styles'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { MapPin } from 'lucide-react-native'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'

interface LocationMapPreviewProps {
	title: string
	subtitle: string
	latitude: number
	longitude: number
	onPress?: () => void
}


const LocationMapPreview: React.FC<LocationMapPreviewProps> = ({
	title,
	subtitle,
	latitude,
	longitude,
	onPress,
}) => {
	const colors = useThemeColors()
	const colorScheme = useColorScheme()

	return (
		<Pressable
			style={[styles.container, { borderColor: colors.borderColor }]}
			onPress={onPress}
		>
			{/* Remount on a theme change — see the note in Maps/GoogleMap.tsx. */}
			<MapView
				key={colorScheme === 'dark' ? 'dark' : 'light'}
				provider={PROVIDER_GOOGLE}
				style={styles.map}
				region={{
					latitude,
					longitude,
					latitudeDelta: 0.005,
					longitudeDelta: 0.005,
				}}
				scrollEnabled={false}
				zoomEnabled={false}
				rotateEnabled={false}
				pitchEnabled={false}
				toolbarEnabled={false}
				customMapStyle={
					colorScheme === 'dark'
						? googleMapStyle.darkMapStyle
						: googleMapStyle.lightMapStyle
				}
				pointerEvents='none'
			>
				<Marker coordinate={{ latitude, longitude }} title={title} pinColor={colors.primaryColor} />
			</MapView>

			{/* Tap overlay */}
			<View style={styles.overlay} pointerEvents='none'>
				<View style={[styles.badge, { backgroundColor: colors.background }]}>
					<MapPin size={13} color={colors.primaryColor} />
					<Text style={[styles.badgeText, { color: colors.text }]} numberOfLines={1}>
						{subtitle || title}
					</Text>
				</View>
			</View>
		</Pressable>
	)
}

export default LocationMapPreview

const styles = StyleSheet.create({
	container: {
		height: 160,
		borderWidth: 1,
		borderRadius: 12,
		overflow: 'hidden',
	},
	map: {
		...ABSOLUTE_FILL,
	},
	overlay: {
		...ABSOLUTE_FILL,
		justifyContent: 'flex-end',
		padding: 8,
	},
	badge: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 4,
		elevation: 3,
		maxWidth: '80%',
	},
	badgeText: {
		fontSize: 12,
		fontWeight: '600',
	},
})
