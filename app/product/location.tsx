import GoogleMap, { MarkerData } from '@/components/Maps/GoogleMap'
import MapPageHeader from '@/components/headers/MapPageHeader'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { logger } from '@/utils/logger'
import * as Location from 'expo-location'
import { useLocalSearchParams } from 'expo-router'
import { MapPin, Navigation } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ProductLocationPage() {
    const { latitude, longitude, title, moljal } = useLocalSearchParams<{
        latitude: string
        longitude: string
        title: string
        moljal: string
    }>()

    console.log('Received location params:', { latitude, longitude, title, moljal })
    const colors = useThemeColors()
    const { t } = useTranslations()
    const insets = useSafeAreaInsets()

    const lat = Number(latitude)
    const lng = Number(longitude)
    const locationLabel = moljal || title || t('product_detail.meeting_location')

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [isLoadingLocation, setIsLoadingLocation] = useState(true)

    // Get user's current location
    useEffect(() => {
        const getUserLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync()
                if (status !== 'granted') {
                    setIsLoadingLocation(false)
                    return
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                })

                setUserLocation({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                })
            } catch (error) {
                logger.error('Error getting user location:', error)
            } finally {
                setIsLoadingLocation(false)
            }
        }

        getUserLocation()
    }, [])

    const markers: MarkerData[] = useMemo(
        () => [
            {
                id: 'product-location',
                latitude: lat,
                longitude: lng,
                title: locationLabel,
            },
        ],
        [lat, lng, locationLabel],
    )

    const handleOpenDirections = useCallback(async () => {
        // If no user location, show alert
        if (!userLocation) {
            Alert.alert(
                t('navigation.location_permission') || 'Location Required',
                t('navigation.location_needed') || 'Unable to get your location. Please enable location services.',
                [{ text: 'OK' }],
            )
            return
        }

        // Google Maps URL scheme
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`

        // Fallback URLs
        const appleMapsUrl = `http://maps.apple.com/?saddr=${userLocation.lat},${userLocation.lng}&daddr=${lat},${lng}`
        const geoUrl = `geo:${lat},${lng}`

        try {
            // Try Google Maps first
            const googleMapsSupported = await Linking.canOpenURL(googleMapsUrl)
            if (googleMapsSupported) {
                await Linking.openURL(googleMapsUrl)
                return
            }

            // Try Apple Maps
            const appleMapsSupported = await Linking.canOpenURL(appleMapsUrl)
            if (appleMapsSupported) {
                await Linking.openURL(appleMapsUrl)
                return
            }

            // Try generic geo URL
            const geoSupported = await Linking.canOpenURL(geoUrl)
            if (geoSupported) {
                await Linking.openURL(geoUrl)
                return
            }

            // If nothing works
            Alert.alert(
                t('navigation.no_maps') || 'No Maps App',
                t('navigation.install_maps') || 'Please install Google Maps or Apple Maps to view directions.',
                [{ text: 'OK' }],
            )
        } catch (error) {
            Alert.alert(
                t('navigation.error') || 'Error',
                t('navigation.error_opening_maps') || 'Could not open maps application.',
                [{ text: 'OK' }],
            )
            logger.error('Error opening maps:', error)
        }
    }, [userLocation, lat, lng, t])

    return (
        <View style={styles.container}>
            {/* Full-screen map */}
            <GoogleMap
                markers={markers}
                initialRegion={{
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                showUserLocation
                showControls={false}
                autoLocate={false}
            />

            {/* Floating header on top of the map */}
            <MapPageHeader title={t('product_detail.meeting_location')} />

            {/* Bottom info card and directions button */}
            <View
                style={[
                    styles.infoCard,
                    {
                        backgroundColor: colors.background,
                        borderColor: colors.borderColor,
                        bottom: insets.bottom + 16,
                    },
                ]}
            >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.iconWrap, { backgroundColor: colors.primaryColor + '1A' }]}>
                        <MapPin size={18} color={colors.primaryColor} />
                    </View>
                    <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={2}>
                        {locationLabel}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.directionsButton,
                        {
                            backgroundColor: colors.primaryColor,
                        },
                    ]}
                    onPress={handleOpenDirections}
                    disabled={isLoadingLocation}
                >
                    <Navigation size={18} color='#fff' />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    infoCard: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 6,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
    },
    directionsButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
})
