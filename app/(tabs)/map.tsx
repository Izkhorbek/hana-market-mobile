import { useMapProductsQuery } from '@/api/hooks'
import GoogleMap, { MarkerData } from '@/components/Maps/GoogleMap'
import { MarkerDetailModal } from '@/components/Maps/MarkerDetailModal'
import MapPageHeader from '@/components/headers/MapPageHeader'
import { AppLimits } from '@/constants/appLimits'
import { EProductSortBy } from '@/constants/enums'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { resolveImageUrl } from '@/utils/imageUrl'
import { useLocalSearchParams } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

// Marker cap for the map: a single, capped request (NOT list pagination). 100 is
// the documented server-wide page-size convention; sorted by distance so the cap
// keeps the *nearest* listings. If a radius ever holds more than this, that's the
// trigger for the backend /products/map-markers endpoint + clustering — see
// docs/map-data-loading-audit.md. Deliberately not an unbounded multi-page fetch.

// Product item from API response
interface MapProductItem {
  id: number;
  title: string | null;
  description: string | null;
  moljal: string | null;
  main_image_url: string | null;
  is_free: boolean;
  is_negotiable: boolean;
  status: string;
  likes_count: number;
  views_count: number;
  latitude: number;
  longitude: number;
  product_type: string;
  product_type_name: string;
  distance: string | null;
  created_ago: string | null;
  price: string | null;
}

const MapPage = () => {

  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    markerTitle?: string;
  }>()

  const { t } = useTranslations()
  const { locale } = useTranslations()

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

  // Fetch products for the map: one capped page of the NEAREST listings in the
  // user's radius (sorted by distance), not list-style pagination.
  const { data, isLoading } = useMapProductsQuery({
    params: {
      user_lat: userLat,
      user_long: userLng,
      page_size: AppLimits.MAP.MAX_MARKERS_PER_PAGE,
      current_page: 1,
      status: AppLimits.ProductStatus.active, // Only fetch active products for the map
      sort_by: EProductSortBy.DISTANCE,
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

  // Transform products to markers
  const productMarkers: MarkerData[] = useMemo(() => {
    const items: MapProductItem[] = data?.data?.data?.items ?? []

    return items
      .filter((item) => item.latitude && item.longitude) // Only include items with valid coordinates
      .map((item) => ({
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.title || 'Product',
        description: item.description || item.moljal || '',
        image: resolveImageUrl(item.main_image_url) || undefined,
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