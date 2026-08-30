import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { logger } from '@/utils/logger'
import * as Location from 'expo-location'
import { Crosshair, MapPin, Navigation } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE } from 'react-native-maps'
interface MapModalProps {
  visible: boolean;
  mode: 'SELECT' | 'VIEW';
  initialLocation?: { latitude: number; longitude: number };
  onClose: () => void;
  onLocationSelect?: (location: { latitude: number; longitude: number; address?: string }) => void;
  productAddress?: string;
}

const DEFAULT_LOCATION = {
  latitude: 41.2995, // Tashkent
  longitude: 69.2401,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
}

const MapModal: React.FC<MapModalProps> = ({
  visible,
  mode,
  initialLocation,
  onClose,
  onLocationSelect,
  productAddress,
}) => {
  const { t } = useTranslations()
  const primaryColor = useColor('primaryColor')
  const textColor = useColor('text')
  const backgroundColor = useColor('background')
  const mapRef = useRef<MapView>(null)

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: initialLocation?.latitude || DEFAULT_LOCATION.latitude,
    longitude: initialLocation?.longitude || DEFAULT_LOCATION.longitude,
  })

  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      })

      // Animate to new location when it changes
      mapRef.current?.animateToRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: DEFAULT_LOCATION.latitudeDelta,
        longitudeDelta: DEFAULT_LOCATION.longitudeDelta,
      }, 1000)
    }
  }, [initialLocation])

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      return status === 'granted'
    } catch (error) {
      logger.warn(error, { code: 'LOCATION_PERMISSION_FAILED', screen: 'MapModal' })
      return false
    }
  }

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const hasPermission = await requestLocationPermission()

      if (!hasPermission) {
        Alert.alert(
          t('map.permission_denied'),
          t('map.enable_location')
        )
        setIsLoadingLocation(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }

      setSelectedLocation(newLocation)

      mapRef.current?.animateToRegion({
        ...newLocation,
        latitudeDelta: DEFAULT_LOCATION.latitudeDelta,
        longitudeDelta: DEFAULT_LOCATION.longitudeDelta,
      }, 1000)

      Alert.alert(t('map.location_selected'))
    } catch (error) {
      logger.warn(error, { code: 'LOCATION_FETCH_FAILED', screen: 'MapModal' })
      Alert.alert(
        t('common.error'),
        'Failed to get current location'
      )
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const getAddressFromCoords = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Bu expo-location metodi internetga bog'langan holda ishlaydi
      const locationResults = await Location.reverseGeocodeAsync({ latitude, longitude })

      if (locationResults.length > 0) {
        const address = locationResults[0]
        // Manzilni chiroyli formatlash
        const formattedAddress = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region
        ].filter(Boolean).join(', ') // Bo'sh bo'lmaganlarini vergul bilan birlashtirish

        return formattedAddress
      }
    } catch (error) {
      logger.warn(error, { code: 'REVERSE_GEOCODE_FAILED', screen: 'MapModal' })
    }
    return ''
  }

  const openInGoogleMaps = () => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    })
    const latLng = `${selectedLocation.latitude},${selectedLocation.longitude}`
    const label = productAddress || 'Product Location'
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    })

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert(t('common.error'), 'Could not open maps')
      })
    }
  }

  const handleConfirm = async () => {
    if (onLocationSelect) {
      setIsConfirming(true) // Loadingni yoqamiz
      try {
        // Manzil nomini olamiz
        const addressName = await getAddressFromCoords(
          selectedLocation.latitude,
          selectedLocation.longitude
        )

        // Parent komponentga hammasini qaytaramiz
        onLocationSelect({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: addressName || t('map.unknown_location') // Agar manzil topilmasa default text
        })

        onClose()
      } catch (error) {
        Alert.alert(t('common.error'), 'Failed to get address details')
      } finally {
        setIsConfirming(false)
      }
    } else {
      onClose()
    }
  }

  const handleMapPress = (event: MapPressEvent) => {
    if (mode === 'SELECT') {
      const { coordinate } = event.nativeEvent
      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      })
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor }]}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {mode === 'SELECT' ? t('map.select_location') : t('map.view_location')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: primaryColor }]}>
              {t('common.close')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: DEFAULT_LOCATION.latitudeDelta,
              longitudeDelta: DEFAULT_LOCATION.longitudeDelta,
            }}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false} // We have a custom button
          >
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              draggable={mode === 'SELECT'}
              onDragEnd={(e) => {
                if (mode === 'SELECT') {
                  setSelectedLocation(e.nativeEvent.coordinate)
                }
              }}
            />
          </MapView>

          {/* Hint Text */}
          {mode === 'SELECT' && (
            <View style={[styles.hintContainer, { backgroundColor: backgroundColor + 'E6' }]}>
              <Text style={[styles.hintText, { color: textColor }]}>
                {t('map.tap_to_select')}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { backgroundColor }]}>
          {mode === 'SELECT' ? (
            <>
              {/* Get My Location Button */}
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: primaryColor }]}
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator color={primaryColor} />
                ) : (
                  <>
                    <Crosshair size={20} color={primaryColor} />
                    <Text style={[styles.actionButtonText, { color: primaryColor }]}>
                      {t('map.get_my_location')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleConfirm}
                disabled={isConfirming} // Bosilganda disable qilish
              >
                {isConfirming ? (
                  // Loading indikatori
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MapPin size={20} color="#fff" />
                    <Text style={styles.confirmButtonText}>
                      {t('map.confirm_location')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Navigate Button */}
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={openInGoogleMaps}
              >
                <Navigation size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>
                  {t('map.navigate_to')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Coordinates Display (SELECT mode) */}
        {mode === 'SELECT' && (
          <View style={[styles.coordinatesContainer, { backgroundColor }]}>
            <Text style={[styles.coordinatesText, { color: textColor }]}>
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  hintContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  coordinatesContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    alignItems: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
})

export default MapModal
