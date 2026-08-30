import { AppLimits } from '@/constants/appLimits'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { logger } from '@/utils/logger'
import Slider from '@react-native-community/slider'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { ArrowLeft, Check, Home, MapPin, Navigation } from 'lucide-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Circle, Marker } from 'react-native-maps'
import { googleMapStyle } from '../../components/Maps/googleMapStyle'

interface LocationData {
	latitude: number
	longitude: number
	neighborhood?: string
	city: string
	country: string
}

// Calculate distance between two coordinates in km (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
	const R = 6371 // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLon = ((lon2 - lon1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
		Math.cos((lat2 * Math.PI) / 180) *
		Math.sin(dLon / 2) *
		Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

const ManageNeighborhoodPage = () => {

	const { t } = useTranslations()
	const colors = useThemeColors()
	const colorScheme = useColorScheme()
	const mapRef = useRef<MapView>(null)
	const storeUser = useAuthStore((s) => s.user)

	// Get stored location from auth store or fallback to Tashkent
	const defaultStoredLocation = {
		latitude: storeUser?.latitude ?? AppLimits.DefaultCoordinates.TASHKENT_LATITUDE,
		longitude: storeUser?.longitude ?? AppLimits.DefaultCoordinates.TASHKENT_LONGITUDE,
	}

	// Stored location from auth store (user's saved/preferred location)
	const [storedLocation, setStoredLocation] = useState<LocationData | null>(null)
	// Current GPS location (device's actual position)
	const [gpsLocation, setGpsLocation] = useState<LocationData | null>(null)
	// Ref to track GPS location for callbacks
	const gpsLocationRef = useRef<LocationData | null>(null)

	const [radius, setRadius] = useState(storeUser?.search_radius_km ?? AppLimits.Location.DEFAULT_RADIUS_KM)
	const [, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	const mapStyle = colorScheme === 'dark' ? googleMapStyle.darkMapStyle : googleMapStyle.lightMapStyle

	// Check if locations are different (more than 0.5km apart)
	const locationsAreDifferent = storedLocation && gpsLocation
		? calculateDistance(
			storedLocation.latitude,
			storedLocation.longitude,
			gpsLocation.latitude,
			gpsLocation.longitude
		) > 0.5
		: false

	// Keep ref in sync with GPS location state
	useEffect(() => {
		gpsLocationRef.current = gpsLocation
	}, [gpsLocation])

	useEffect(() => {
		initializeLocations()
	}, [])

	const initializeLocations = async () => {
		setIsLoading(true)

		// 1. Load stored location from auth store
		const loadedLocation = await loadStoredLocation()

		// 2. Get current GPS location (pass loaded location to avoid stale closure)
		await getCurrentGPSLocation(loadedLocation)

		setIsLoading(false)
	}

	const loadStoredLocation = async (): Promise<LocationData> => {
		const { latitude, longitude } = defaultStoredLocation

		try {
			const [address] = await Location.reverseGeocodeAsync({ latitude, longitude })

			const data: LocationData = {
				latitude,
				longitude,
				neighborhood: address?.district || address?.subregion || address?.name || '',
				city: address?.city || address?.region || '',
				country: address?.country || '',
			}
			setStoredLocation(data)
			return data
		} catch {
			const data: LocationData = { latitude, longitude, neighborhood: '', city: '', country: '' }
			setStoredLocation(data)
			return data
		}
	}

	const getCurrentGPSLocation = async (fallback?: LocationData | null) => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync()
			if (status !== 'granted') {
				// If permission denied, use stored location as GPS location
				setGpsLocation(fallback ?? null)
				return
			}

			const servicesEnabled = await Location.hasServicesEnabledAsync()
			if (!servicesEnabled) {
				Alert.alert(t('neighborhood.permission_denied'), t('neighborhood.permission_message'))
				setGpsLocation(fallback ?? null)
				return
			}

			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			})

			const { latitude, longitude } = location.coords

			const [address] = await Location.reverseGeocodeAsync({ latitude, longitude })

			setGpsLocation({
				latitude,
				longitude,
				neighborhood: address?.district || address?.subregion || address?.name || '',
				city: address?.city || address?.region || '',
				country: address?.country || '',
			})

			// Animate to GPS location (where circle will be drawn)
			mapRef.current?.animateToRegion({
				latitude,
				longitude,
				latitudeDelta: calculateDelta(radius),
				longitudeDelta: calculateDelta(radius),
			})


		} catch (error) {
			logger.error('GPS_LOCATION_FAILED', error, { screen: 'NeighborhoodManage' })
			setGpsLocation(fallback ?? null)
		}
	}

	// Calculate map delta based on radius (km)
	const calculateDelta = (radiusKm: number) => {
		return (radiusKm * 2.5) / 111
	}

	const handleRadiusChange = (value: number) => {
		setRadius(value)
	}

	const handleRadiusChangeComplete = useCallback((value: number) => {
		const currentGps = gpsLocationRef.current

		if (mapRef.current && currentGps) {
			mapRef.current.animateToRegion({
				latitude: currentGps.latitude,
				longitude: currentGps.longitude,
				latitudeDelta: calculateDelta(value),
				longitudeDelta: calculateDelta(value),
			})
		}
	}, [])

	const handleSavePreferences = async () => {
		// Save using GPS location (current device location), not stored location
		if (!gpsLocation) {
			Alert.alert(t('neighborhood.error'), t('neighborhood.no_location'))
			return
		}

		setIsSaving(true)
		try {
			const addressName = [gpsLocation.neighborhood, gpsLocation.city, gpsLocation.country]
				.filter(Boolean)
				.join(', ')

			// Save GPS location as new user location
			await useAuthStore.getState().updateLocation(
				gpsLocation.latitude,
				gpsLocation.longitude,
				radius,
				addressName
			)

			Alert.alert(t('neighborhood.success'), t('neighborhood.preferences_saved'), [
				{ text: 'OK', onPress: () => router.back() },
			])
		} catch (error) {
			logger.error('NEIGHBORHOOD_SAVE_FAILED', error, { screen: 'NeighborhoodManage' })
			Alert.alert(t('neighborhood.error'), t('neighborhood.save_error'))
		} finally {
			setIsSaving(false)
		}
	}

	const handleGoBack = () => {
		router.back()
	}

	const handleLocateMe = async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync()
			if (status !== 'granted') {
				Alert.alert(t('neighborhood.permission_denied'), t('neighborhood.permission_message'))
				return
			}

			const servicesEnabled = await Location.hasServicesEnabledAsync()
			if (!servicesEnabled) {
				Alert.alert(t('neighborhood.permission_denied'), t('neighborhood.permission_message'))
				return
			}

			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			})

			const { latitude, longitude } = location.coords

			// Update GPS location with reverse geocoding
			const [address] = await Location.reverseGeocodeAsync({ latitude, longitude })

			setGpsLocation({
				latitude,
				longitude,
				neighborhood: address?.district || address?.subregion || address?.name || '',
				city: address?.city || address?.region || '',
				country: address?.country || '',
			})

			// Animate to current GPS location
			mapRef.current?.animateToRegion({
				latitude,
				longitude,
				latitudeDelta: calculateDelta(radius),
				longitudeDelta: calculateDelta(radius),
			})
		} catch (error) {
			logger.warn(error, { code: 'LOCATION_FETCH_FAILED', screen: 'NeighborhoodManage' })
			Alert.alert(t('neighborhood.error'), t('neighborhood.location_error'))
		}
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
						latitude: gpsLocation?.latitude || defaultStoredLocation.latitude,
						longitude: gpsLocation?.longitude || defaultStoredLocation.longitude,
						latitudeDelta: calculateDelta(radius),
						longitudeDelta: calculateDelta(radius),
					}}
					showsUserLocation={true}
					showsMyLocationButton={false}
					showsCompass={false}
				>
					{/* Radius Circle - centered at GPS location (current device position) */}
					{radius && (
						<Circle
							center={{
								latitude: gpsLocation?.latitude || defaultStoredLocation.latitude,
								longitude: gpsLocation?.longitude || defaultStoredLocation.longitude,
							}}
							radius={radius * 1000}
							strokeColor={colors.primaryColor}
							strokeWidth={2}
							fillColor={colorScheme === 'dark' ? 'rgba(2, 163, 72, 0.15)' : 'rgba(2, 163, 72, 0.1)'}
						/>
					)}

					{/* Stored Location Marker (user's saved location - green) */}
					{storedLocation && (
						<Marker
							coordinate={{
								latitude: storedLocation.latitude,
								longitude: storedLocation.longitude,
							}}
							anchor={{ x: 0.5, y: 0.5 }}
							tracksViewChanges={false}
						>
							<View style={[styles.markerOuter, { borderColor: colors.primaryColor }]}>
								{/* <View style={[styles.markerInner, { backgroundColor: colors.primaryColor }]}> */}
									{/* <MapPin size={20} color='#fff' /> */}
								{/* </View> */}
							</View>
						</Marker>
					)}

					{/* GPS Location Marker (current device position - blue) */}
					{/* {gpsLocation && (
						<Marker
							coordinate={{
								latitude: gpsLocation.latitude,
								longitude: gpsLocation.longitude,
							}}
							anchor={{ x: 0.5, y: 0.5 }}
						>
							<View style={[styles.markerOuter, { borderColor: '#3B82F6' }]}>
								<View style={[styles.markerInner, { backgroundColor: '#3B82F6' }]}>
									<Navigation size={18} color='#fff' />
								</View>
							</View>
						</Marker>
					)} */}
				</MapView>

				{/* Home button to locate current position */}
				<TouchableOpacity
					style={[styles.locateButton, { backgroundColor: colors.card }]}
					onPress={handleLocateMe}
					activeOpacity={0.8}
				>
					<Home size={24} color={colors.primaryColor} />
				</TouchableOpacity>
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
				{/* Location Info - Show both if different */}
				{locationsAreDifferent ? (
					<>
						{/* Stored Location (green) */}
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
									{t('neighborhood.stored_location')}
								</Text>
								<Text style={[styles.locationName, { color: colors.text }]}>
									{storedLocation?.neighborhood || t('neighborhood.loading')}
								</Text>
								<Text style={[styles.locationCity, { color: colors.textMuted }]}>
									{storedLocation?.city ? `${storedLocation.city}, ${storedLocation.country}` : ''}
								</Text>
							</View>
						</View>

						{/* Current GPS Location (blue) */}
						<View style={[styles.locationInfoContainer, { marginBottom: 16 }]}>
							<View
								style={[
									styles.locationIconContainer,
									{ backgroundColor: colorScheme === 'dark' ? '#1C2E3D' : '#E6EFFA' },
								]}
							>
								<Navigation size={20} color='#3B82F6' />
							</View>
							<View style={styles.locationTextContainer}>
								<Text style={[styles.locationLabel, { color: '#3B82F6' }]}>
									{t('neighborhood.current_gps_location')}
								</Text>
								<Text style={[styles.locationName, { color: colors.text }]}>
									{gpsLocation?.neighborhood || t('neighborhood.loading')}
								</Text>
								<Text style={[styles.locationCity, { color: colors.textMuted }]}>
									{gpsLocation?.city ? `${gpsLocation.city}, ${gpsLocation.country}` : ''}
								</Text>
							</View>
						</View>
					</>
				) : (
					/* Single location display when both are same */
					<View style={styles.locationInfoContainer}>
						<View
							style={[
								styles.locationIconContainer,
								{ backgroundColor: colorScheme === 'dark' ? '#1C2E3D' : '#E6EFFA' },
							]}
						>
							<Navigation size={20} color='#3B82F6' />
						</View>
						<View style={styles.locationTextContainer}>
							<Text style={[styles.locationLabel, { color: '#3B82F6' }]}>
								{t('neighborhood.current_gps_location')}
							</Text>
							<Text style={[styles.locationName, { color: colors.text }]}>
								{gpsLocation?.neighborhood || t('neighborhood.loading')}
							</Text>
							<Text style={[styles.locationCity, { color: colors.textMuted }]}>
								{gpsLocation?.city ? `${gpsLocation.city}, ${gpsLocation.country}` : ''}
							</Text>
						</View>
					</View>
				)}

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
						minimumValue={AppLimits.Location.MIN_RADIUS_KM}
						maximumValue={AppLimits.Location.MAX_RADIUS_KM}
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
							{AppLimits.Location.MIN_RADIUS_KM} {t('neighborhood.km')}
						</Text>
						<Text style={[styles.sliderMinMax, { color: colors.textMuted }]}>
							{AppLimits.Location.MAX_RADIUS_KM} {t('neighborhood.km')}
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
		paddingBottom: 10,
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
	locateButton: {
		position: 'absolute',
		right: 16,
		bottom: 16,
		width: 48,
		height: 48,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
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
