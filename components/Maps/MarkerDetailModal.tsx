import { MarkerData } from '@/components/Maps/GoogleMap'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Text } from '@/components/ui/text'
import { View } from '@/components/ui/view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { logger } from '@/utils/logger'
import * as Location from 'expo-location'
import { navigate } from 'expo-router/build/global-state/routing'
import { Navigation, X } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, StyleSheet, TouchableOpacity } from 'react-native'
import RemoteImage from '../shared/RemoteImage'

interface MarkerDetailModalProps {
  marker: MarkerData | null;
  isVisible: boolean;
  onClose: () => void;
}

export function MarkerDetailModal({ marker, isVisible, onClose }: MarkerDetailModalProps) {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)

  // Get user's current location when modal opens OR when marker changes
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
        console.error('Error getting user location:', error)
        logger.warn(error, { code: 'LOCATION_FETCH_FAILED', screen: 'MarkerDetailModal' })
      } finally {
        setIsLoadingLocation(false)
      }
    }

    // Fetch location when modal becomes visible
    if (isVisible && marker) {
      setIsLoadingLocation(true)
      getUserLocation()
    }
  }, [isVisible, marker?.id]) // Re-run when marker changes

  const handleViewDetails = (productId: number | string) => {
    if (!productId) return

    navigate(`/product/${productId}`)
    onClose()
  }

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

    // If no marker, return early
    if (!marker) {
      Alert.alert('Error', 'Marker location not available.')
      return
    }

    // Google Maps URL scheme
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${marker.latitude},${marker.longitude}`

    // Fallback URLs
    const appleMapsUrl = `http://maps.apple.com/?saddr=${userLocation.lat},${userLocation.lng}&daddr=${marker.latitude},${marker.longitude}`
    const geoUrl = `geo:${marker.latitude},${marker.longitude}`

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
      console.error('Error opening maps:', error)
      logger.warn(error, { code: 'OPEN_MAPS_FAILED', screen: 'MarkerDetailModal' })
    }
  }, [userLocation, marker, t])

  // Don't render if no marker
  if (!marker) {
    return null
  }

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.4]}
      style={{ backgroundColor: colors.background }}
      enableBackdropDismiss={true}
      disablePanGesture={false}
    >
      <View style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.muted }]}
          onPress={onClose}
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Image and Main Info */}
          <View style={styles.header}>
            <RemoteImage
              src={marker.image || undefined}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.headerText}>
              <Text variant="title" style={styles.title} numberOfLines={1}>
                {marker.title || 'Title'}
              </Text>
              <Text variant="caption" style={[styles.category, { color: colors.textMuted }]} numberOfLines={1}>
                {marker.category || 'Category'}
              </Text>
            </View>
          </View>

          {/* Category Tag and Distance */}
          <View style={styles.metaRow}>
            {marker.categoryTag && (
              <View style={[styles.tag, { backgroundColor: '#E8F5E9' }]}>
                <Text variant="caption" style={[styles.tagText, { color: '#2E7D32' }]} numberOfLines={1}  >
                  {marker.categoryTag}
                </Text>
              </View>
            )}
            {marker.distance && (
              <Text variant="caption" style={[styles.distance]} numberOfLines={1}>
                {marker.distance}
              </Text>
            )}
          </View>

          {/* Features */}
          {marker.features && marker.features.length > 0 && (
            <View style={styles.featuresContainer}>
              {marker.features.map((feature, index) => (
                <Text
                  key={index}
                  variant="body"
                  style={[styles.feature, { color: colors.primaryColor }]}
                  numberOfLines={1}
                >
                  {feature},
                </Text>
              ))}
            </View>
          )}

          {/* Buttons Container */}
          <View style={styles.buttonsContainer}>
            {/* View Details Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#2E7D32', flex: 1 }]}
              onPress={() => handleViewDetails(marker.id)}
            >
              <Text variant="body" style={styles.buttonText} numberOfLines={1}>
                {t('map.view_details')}
              </Text>
            </TouchableOpacity>

            {/* Directions Button */}
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
              <Navigation size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    backgroundColor: '#E0E0E0',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  category: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distance: {
    fontSize: 13,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  feature: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
