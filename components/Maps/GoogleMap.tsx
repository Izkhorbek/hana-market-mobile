import { useColorScheme } from '@/hooks/use-color-scheme'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { logger } from '@/utils/logger'
import * as Location from 'expo-location'
import { Home, Minus, Plus } from 'lucide-react-native'
import React, { useCallback, useEffect, useRef } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'
import MapView, { Region } from 'react-native-maps'
import ProductMapMarker from './ProductMapMarker'

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
  // Hide all POIs (business icons, landmarks, etc.)
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ visibility: 'on' }, { color: '#263c3f' }],
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

export interface MarkerData {
  id: string | number;
  latitude: number;
  longitude: number;
  title?: string;
  image?: string;
  category?: string;
  categoryTag?: string;
  distance?: string;
  features?: string[];
}

interface GoogleMapProps {
  markers?: MarkerData[];
  initialRegion?: Region;
  showUserLocation?: boolean;
  showControls?: boolean;
  autoLocate?: boolean;
  onMarkerPress?: (marker: MarkerData) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  height?: number | string;
}

const GoogleMap = ({
  markers = [],
  initialRegion = {
    latitude: 41.3111,
    longitude: 69.2797,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  showUserLocation = true,
  showControls = true,
  autoLocate = false,
  onMarkerPress,
  onMapPress,
  height = '100%',
}: GoogleMapProps) => {

  const mapRef = useRef<MapView>(null)
  const colors = useThemeColors()
  const colorScheme = useColorScheme()

  const mapStyle = colorScheme === 'dark' ? darkMapStyle : lightMapStyle

  // Stable marker-press handler: read the latest `onMarkerPress` via a ref so
  // its identity never changes. This keeps the memoized ProductMapMarker from
  // re-rendering when the parent passes a fresh inline callback.
  const onMarkerPressRef = useRef(onMarkerPress)
  useEffect(() => {
    onMarkerPressRef.current = onMarkerPress
  }, [onMarkerPress])
  const handleMarkerPress = useCallback((marker: MarkerData) => {
    onMarkerPressRef.current?.(marker)
  }, [])

  useEffect(() => {
    initializeLocation()
  }, [])

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location services to see your position on the map.'
        )
        return
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync()
      if (!servicesEnabled) {
        Alert.alert('Location Services Disabled', 'Please turn on location services in your device settings.')
        return
      }

      // Auto-locate to user's current position if enabled and no custom initialRegion
      if (autoLocate) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500)
        }, 300)
      }
    } catch (error) {
      logger.warn(error, { code: 'LOCATION_INIT_FAILED', screen: 'GoogleMap' })
    }
  }

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        if (camera.zoom) {
          mapRef.current?.animateCamera({
            zoom: camera.zoom + 1,
          })
        }
      })
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        if (camera.zoom) {
          mapRef.current?.animateCamera({
            zoom: camera.zoom - 1,
          })
        }
      })
    }
  }

  const handleLocateMe = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow access to location to use this feature.')
        return
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync()
      if (!servicesEnabled) {
        Alert.alert('Location Services Disabled', 'Please turn on location services in your device settings.')
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })

    } catch (error) {
      logger.warn(error, { code: 'LOCATION_FETCH_FAILED', screen: 'GoogleMap' })
      Alert.alert('Error', 'Could not get your current location.')
    }
  }

  return (
    <View style={[styles.container, { height: height as any }]}>
      <MapView
        mapType="standard"
        ref={mapRef}
        provider={'google'}
        style={styles.map}
        customMapStyle={mapStyle}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        onPress={(event) => {
          if (onMapPress) {
            onMapPress(event.nativeEvent.coordinate)
          }
        }}
      >

        {markers.map((marker) => (
          <ProductMapMarker
            key={marker.id}
            marker={marker}
            color={colors.primaryColor}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Custom Controls */}
      {
        showControls && (
          <View style={styles.controlsContainer}>
            {/* Top buttons group */}
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.card }]}
              onPress={handleLocateMe}
            >
              <Home size={24} color={colors.blackIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.card }]}
              onPress={handleZoomIn}
            >
              <Plus size={24} color={colors.blackIcon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.card }]}
              onPress={handleZoomOut}
            >
              <Minus size={24} color={colors.blackIcon} />
            </TouchableOpacity>
          </View>
        )
      }
    </View >
  )
}

export default GoogleMap

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    gap: 12,
    zIndex: 2,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  locateButton: {
    marginTop: 8,
  },
  markerContainer: {
    // Explicit dimensions prevent Android from capturing the SVG at the wrong
    // size when creating the marker bitmap. Values match LocationPinIcon size=40:
    // scale = 40/75 ≈ 0.533 → width = 58*0.533 ≈ 31, height = 75*0.533 ≈ 40
    width: 31,
    height: 40,
    alignItems: 'center',
  },
  marker: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    fontSize: 18,
  },
  // Add these new styles:
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20, // Make it a perfect circle
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Important for Android visibility
  },
  clusterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})