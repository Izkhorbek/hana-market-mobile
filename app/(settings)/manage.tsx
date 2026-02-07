import { useColorScheme } from '@/hooks/use-color-scheme'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import Slider from '@react-native-community/slider'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { ArrowLeft, Check, MapPin } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Circle, Marker } from 'react-native-maps'

// Dark mode map style
const darkMapStyle = [
	{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
	{ elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
	{ elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
	{
		featureType: 'administrative.locality',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#d59563' }],
	},
	{
		featureType: 'poi',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#d59563' }],
	},
	{
		featureType: 'poi.park',
		elementType: 'geometry',
		stylers: [{ color: '#263c3f' }],
	},
	{
		featureType: 'poi.park',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#6b9a76' }],
	},
	{
		featureType: 'road',
		elementType: 'geometry',
		stylers: [{ color: '#38414e' }],
	},
	{
		featureType: 'road',
		elementType: 'geometry.stroke',
		stylers: [{ color: '#212a37' }],
	},
	{
		featureType: 'road',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#9ca5b3' }],
	},
	{
		featureType: 'road.highway',
		elementType: 'geometry',
		stylers: [{ color: '#746855' }],
	},
	{
		featureType: 'road.highway',
		elementType: 'geometry.stroke',
		stylers: [{ color: '#1f2835' }],
	},
	{
		featureType: 'road.highway',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#f3d19c' }],
	},
	{
		featureType: 'transit',
		elementType: 'geometry',
		stylers: [{ color: '#2f3948' }],
	},
	{
		featureType: 'transit.station',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#d59563' }],
	},
	{
		featureType: 'water',
		elementType: 'geometry',
		stylers: [{ color: '#17263c' }],
	},
	{
		featureType: 'water',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#515c6d' }],
	},
	{
		featureType: 'water',
		elementType: 'labels.text.stroke',
		stylers: [{ color: '#17263c' }],
	},
]

// Light mode map style (standard Google Maps)
const lightMapStyle: any[] = []

interface LocationData {
	latitude: number
	longitude: number
	neighborhood?: string
	city?: string
	country?: string
}

// Default location (Tashkent)
const DEFAULT_LOCATION = {
	latitude: 41.3111,
	longitude: 69.2797,
}

const ManageNeighborhoodPage = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const colorScheme = useColorScheme()
	const mapRef = useRef<MapView>(null)

	// User's actual GPS location - this is fixed and doesn't change when map moves
	const [userLocation, setUserLocation] = useState<LocationData | null>(null)

	const [radius, setRadius] = useState(3) // Default 3km
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	const mapStyle = colorScheme === 'dark' ? darkMapStyle : lightMapStyle

	useEffect(() => {
		getCurrentLocation()
	}, [])

	const getCurrentLocation = async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync()
			if (status !== 'granted') {
				Alert.alert(t('neighborhood.permission_denied'), t('neighborhood.permission_message'))
				// Use default location
				await updateLocationInfo(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude)
				setIsLoading(false)
				return
			}

			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			})

			const { latitude, longitude } = location.coords

			// Update user location with address info
			await updateLocationInfo(latitude, longitude)

			// Animate to user location
			mapRef.current?.animateToRegion({
				latitude,
				longitude,
				latitudeDelta: calculateDelta(radius),
				longitudeDelta: calculateDelta(radius),
			})

			setIsLoading(false)
		} catch (error) {
			console.error('Error getting location:', error)
			// Use default location on error
			await updateLocationInfo(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude)
			setIsLoading(false)
		}
	}

	// Update location info from coordinates
	const updateLocationInfo = async (latitude: number, longitude: number) => {
		try {
			const [address] = await Location.reverseGeocodeAsync({
				latitude,
				longitude,
			})

			setUserLocation({
				latitude,
				longitude,
				neighborhood: address?.district || address?.subregion || address?.name || '',
				city: address?.city || address?.region || '',
				country: address?.country || '',
			})
		} catch (error) {
			// If reverse geocoding fails, just update coordinates
			setUserLocation({
				latitude,
				longitude,
				neighborhood: '',
				city: '',
				country: '',
			})
		}
	}

	// Calculate map delta based on radius (km)
	const calculateDelta = (radiusKm: number) => {
		// Approximate conversion: 1 degree latitude ≈ 111 km
		return (radiusKm * 2.5) / 111
	}

	const handleRadiusChange = (value: number) => {
		setRadius(value)
	}

	const handleRadiusChangeComplete = (value: number) => {
		// Animate map to show the new radius properly
		if (mapRef.current && userLocation) {
			mapRef.current.animateToRegion({
				latitude: userLocation.latitude,
				longitude: userLocation.longitude,
				latitudeDelta: calculateDelta(value),
				longitudeDelta: calculateDelta(value),
			})
		}
	}

	const handleSavePreferences = async () => {
		setIsSaving(true)
		try {
			// TODO: Save to backend/storage
			// Save userLocation and radius
			console.log('Saving preferences:', { userLocation, radius })
			await new Promise(resolve => setTimeout(resolve, 500))

			Alert.alert(t('neighborhood.success'), t('neighborhood.preferences_saved'), [
				{ text: 'OK', onPress: () => router.back() },
			])
		} catch (error) {
			Alert.alert(t('neighborhood.error'), t('neighborhood.save_error'))
		} finally {
			setIsSaving(false)
		}
	}

	const handleGoBack = () => {
		router.back()
	}

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
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('neighborhood.title')}</Text>
				<View style={styles.headerRight} />
			</View>

			{/* Map */}
			<View style={styles.mapContainer}>
				<MapView
					ref={mapRef}
					provider='google'
					style={styles.map}
					customMapStyle={mapStyle}
					initialRegion={{
						latitude: userLocation?.latitude || DEFAULT_LOCATION.latitude,
						longitude: userLocation?.longitude || DEFAULT_LOCATION.longitude,
						latitudeDelta: calculateDelta(radius),
						longitudeDelta: calculateDelta(radius),
					}}
					showsUserLocation={false}
					showsMyLocationButton={false}
					showsCompass={false}
				>
					{/* Radius Circle - fixed at user location */}
					{userLocation && (
						<Circle
							center={{
								latitude: userLocation.latitude,
								longitude: userLocation.longitude,
							}}
							radius={radius * 1000} // Convert km to meters
							strokeColor={colors.primaryColor}
							strokeWidth={2}
							fillColor={colorScheme === 'dark' ? 'rgba(2, 163, 72, 0.15)' : 'rgba(2, 163, 72, 0.1)'}
						/>
					)}

					{/* Custom Marker - fixed at user location */}
					{userLocation && (
						<Marker
							coordinate={{
								latitude: userLocation.latitude,
								longitude: userLocation.longitude,
							}}
							anchor={{ x: 0.5, y: 0.5 }}
						>
							<View style={[styles.markerOuter, { borderColor: colors.primaryColor }]}>
								<View style={[styles.markerInner, { backgroundColor: colors.primaryColor }]}>
									<MapPin size={20} color='#fff' />
								</View>
							</View>
						</Marker>
					)}
				</MapView>
			</View>

			{/* Bottom Sheet */}
			<View
				style={[
					styles.bottomSheet,
					{
						backgroundColor: colors.background,
						shadowColor: colorScheme === 'dark' ? '#000' : '#000',
					},
				]}
			>
				{/* Location Info */}
				<View style={styles.locationInfoContainer}>
					<View
						style={[
							styles.locationIconContainer,
							{ backgroundColor: colorScheme === 'dark' ? '#1C3D2E' : '#E6F4ED' },
						]}
					>
						<MapPin size={20} color={colors.primaryColor} />
					</View>
					<View style={styles.locationTextContainer}>
						<Text style={[styles.locationLabel, { color: colors.primaryColor }]}>
							{t('neighborhood.current_neighborhood')}
						</Text>
						<Text style={[styles.locationName, { color: colors.text }]}>
							{userLocation?.neighborhood || t('neighborhood.loading')}
						</Text>
						<Text style={[styles.locationCity, { color: colors.textMuted }]}>
							{userLocation?.city ? `${userLocation.city}, ${userLocation.country}` : ''}
						</Text>
					</View>
				</View>

				{/* Radius Slider */}
				<View style={styles.sliderContainer}>
					<View style={styles.sliderHeader}>
						<Text style={[styles.sliderLabel, { color: colors.text }]}>
							{t('neighborhood.search_radius')}
						</Text>
						<View style={styles.radiusValueContainer}>
							<Text style={[styles.radiusValue, { color: colors.primaryColor }]}>{radius}</Text>
							<Text style={[styles.radiusUnit, { color: colors.textMuted }]}>
								{t('neighborhood.km')}
							</Text>
						</View>
					</View>

					<Slider
						style={styles.slider}
						minimumValue={1}
						maximumValue={20}
						step={1}
						value={radius}
						onValueChange={handleRadiusChange}
						onSlidingComplete={handleRadiusChangeComplete}
						minimumTrackTintColor={colors.primaryColor}
						maximumTrackTintColor={colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA'}
						thumbTintColor={colors.primaryColor}
					/>

					<View style={styles.sliderLabels}>
						<Text style={[styles.sliderMinMax, { color: colors.textMuted }]}>
							1 {t('neighborhood.km')}
						</Text>
						<Text style={[styles.sliderMinMax, { color: colors.textMuted }]}>
							20 {t('neighborhood.km')}
						</Text>
					</View>
				</View>

				{/* Description */}
				<Text style={[styles.description, { color: colors.textMuted }]}>
					{t('neighborhood.description')}
				</Text>

				{/* Save Button */}
				<TouchableOpacity
					style={[
						styles.saveButton,
						{ backgroundColor: colors.primaryColor },
						isSaving && styles.saveButtonDisabled,
					]}
					onPress={handleSavePreferences}
					disabled={isSaving}
					activeOpacity={0.8}
				>
					<Check size={20} color='#fff' />
					<Text style={styles.saveButtonText}>
						{isSaving ? t('neighborhood.saving') : t('neighborhood.save_preferences')}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

export default ManageNeighborhoodPage

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
		borderBottomWidth: 1,
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
	mapContainer: {
		flex: 1,
		position: 'relative',
	},
	map: {
		flex: 1,
	},
	markerOuter: {
		width: 60,
		height: 60,
		borderRadius: 30,
		borderWidth: 3,
		backgroundColor: 'rgba(2, 163, 72, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	markerInner: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	bottomSheet: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 20,
		paddingTop: 24,
		paddingBottom: Platform.OS === 'ios' ? 40 : 24,
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 10,
	},
	locationInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 24,
	},
	locationIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	locationTextContainer: {
		flex: 1,
	},
	locationLabel: {
		fontSize: 11,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 2,
	},
	locationName: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 2,
	},
	locationCity: {
		fontSize: 14,
	},
	sliderContainer: {
		marginBottom: 16,
	},
	sliderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	sliderLabel: {
		fontSize: 15,
		fontWeight: '500',
	},
	radiusValueContainer: {
		flexDirection: 'row',
		alignItems: 'baseline',
	},
	radiusValue: {
		fontSize: 24,
		fontWeight: '700',
	},
	radiusUnit: {
		fontSize: 14,
		marginLeft: 4,
	},
	slider: {
		width: '100%',
		height: 40,
	},
	sliderLabels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: -4,
	},
	sliderMinMax: {
		fontSize: 12,
	},
	description: {
		fontSize: 13,
		textAlign: 'center',
		lineHeight: 18,
		marginBottom: 20,
	},
	saveButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
	},
	saveButtonDisabled: {
		opacity: 0.7,
	},
	saveButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
})
