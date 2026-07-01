import { useProductMapMarkersQuery } from '@/api/hooks'
import GoogleMap, { MarkerData } from '@/components/Maps/GoogleMap'
import { MarkerDetailModal } from '@/components/Maps/MarkerDetailModal'
import MapPageHeader from '@/components/headers/MapPageHeader'
import { AppLimits } from '@/constants/appLimits'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import type { ProductMapMarkerDto } from '@/types'
import { resolveSizedImageUrl } from '@/utils/imageUrl'
import { useLocalSearchParams } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

// The map uses the dedicated lightweight endpoint GET /api/product/map-markers
// (NOT /api/product/all). It's a single capped request (NOT list pagination) of
// the nearest listings — the server sorts by distance, the client caps at
// AppLimits.MAP.MARKER_LIMIT. Marker pins render from this minimal DTO; the
// bottom sheet enriches the *selected* marker with full detail lazily.

const MapPage = () => {

  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    markerTitle?: string;
  }>()

  const {t} = useTranslations()
  
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Get user location from auth store
  const user = useAuthStore((s) => s.user)
  const userLat = user?.latitude ?? AppLimits.DefaultCoordinates.TASHKENT_LATITUDE
  const userLng = user?.longitude ?? AppLimits.DefaultCoordinates.TASHKENT_LONGITUDE

  // Parse URL params for highlighted location
  const latitudeParam = Number(params.latitude)
  const longitudeParam = Number(params.longitude)
  const hasLocationParams = Number.isFinite(latitudeParam) && Number.isFinite(longitudeParam)

  // Fetch lightweight markers for the map: a single capped request of the
  // NEAREST listings (server sorts by distance), not list-style pagination.
  // Sends the user's saved search radius when set (axios drops the param when
  // undefined, letting the backend apply its own default); status=active keeps
  // sold/reserved listings off the map.
  const { data, isLoading } = useProductMapMarkersQuery({
    params: {
      user_lat: userLat,
      user_long: userLng,
      radius_km: user?.search_radius_km ?? undefined,
      status: AppLimits.ProductStatus.active,
      limit: AppLimits.MAP.MARKER_LIMIT,
    },
  })

  // Create highlighted marker from URL params
  const highlightedMarker: MarkerData | null = useMemo(() => {
    return hasLocationParams    
      ? { 
        id: 'target-location',
        latitude: latitudeParam,
        longitude: longitudeParam,
        title: params.markerTitle || 'Selected location',
        description: 'Opened from product detail',
      }
      : null
  }, [hasLocationParams, latitudeParam, longitudeParam, params.markerTitle])

  // Transform lightweight DTOs to markers. Only fields present on
  // ProductMapMarkerDto are used here; the bottom sheet fills in the richer
  // fields (category name, negotiable / posted-ago, free flag) lazily from full
  // product detail when a marker is tapped.
  const productMarkers: MarkerData[] = useMemo(() => {
    const items: ProductMapMarkerDto[] = data?.data?.data ?? []

    return items
      .filter((item) => item.latitude && item.longitude) // Only include items with valid coordinates
      .map((item) => ({
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.title || 'Product',
        // Sized variant — the URL is only fetched when the bottom sheet renders
        // this marker's image (RemoteImage), never for all pins at once.
        image: resolveSizedImageUrl(item.main_image_url, { width: 260, height: 260, quality: 65 }) || undefined,
        category: item.product_type_name || 'Product',
        categoryTag: item.is_free ? t('post.free') : item.price || undefined,
        distance: item.distance || undefined,
        features: [
          item.is_negotiable ? t('post.can_deal') : '',
          item.created_ago || '',
        ].filter(Boolean),
      }))
  }, [data, t])

  // Combine highlighted marker with product markers
  const allMarkers = useMemo(() => {
    if (highlightedMarker) {
      return [highlightedMarker, ...productMarkers.filter((m) => m.id !== 'target-location')]
    }
    return productMarkers
  }, [highlightedMarker, productMarkers])

  const handleMarkerPress = (marker: MarkerData) => {
    setSelectedMarker(marker)
    setIsModalVisible(true)
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
    setSelectedMarker(null)
  }

  return (
    <View style={styles.container}>
      <MapPageHeader />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#02A348" />
        </View>
      )}

      <GoogleMap
        markers={allMarkers}
        initialRegion={
          hasLocationParams
            ? {
              latitude: latitudeParam,
              longitude: longitudeParam,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }
            : {
              latitude: userLat,
              longitude: userLng,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }
        }
        autoLocate={!hasLocationParams}
        showControls={true}
        onMarkerPress={handleMarkerPress}
      />

      <MarkerDetailModal
        marker={selectedMarker}
        isVisible={isModalVisible}
        onClose={handleCloseModal}
      />
    </View>
  )
}

export default MapPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
})