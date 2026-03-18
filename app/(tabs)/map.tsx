import { useProductsQuery } from '@/api/hooks';
import GoogleMap, { MarkerData } from '@/components/Maps/GoogleMap';
import { MarkerDetailModal } from '@/components/Maps/MarkerDetailModal';
import MapPageHeader from '@/components/headers/MapPageHeader';
import { useTranslations } from '@/hooks/use-translation';
import { useAuthStore } from '@/modules/Auth/auth-store';
import { resolveImageUrl } from '@/utils/imageUrl';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// Default coordinates (Tashkent)
const DEFAULT_LAT = 41.311081;
const DEFAULT_LNG = 69.240562;
const MAP_PAGE_SIZE = 200;

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

  console.log('MapPage rendered with params:');

  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    markerTitle?: string;
  }>();

  const { t } = useTranslations()
  const { locale } = useTranslations();

  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Get user location from auth store
  const user = useAuthStore((s) => s.user);
  const userLat = user?.latitude ?? DEFAULT_LAT;
  const userLng = user?.longitude ?? DEFAULT_LNG;

  // Parse URL params for highlighted location
  const latitudeParam = Number(params.latitude);
  const longitudeParam = Number(params.longitude);
  const hasLocationParams = Number.isFinite(latitudeParam) && Number.isFinite(longitudeParam);

  // Fetch products for map
  const { data, isLoading, isError } = useProductsQuery({
    params: {
      user_lat: userLat,
      user_long: userLng,
      page_size: 20,
      current_page: 1,
    },
  });

  console.log('MapPage products data:', data);

  // Create highlighted marker from URL params
  const highlightedMarker: MarkerData | null = hasLocationParams
    ? {
      id: 'target-location',
      latitude: latitudeParam,
      longitude: longitudeParam,
      title: params.markerTitle || 'Selected location',
      description: 'Opened from product detail',
    }
    : null;

  // Transform products to markers
  const productMarkers: MarkerData[] = useMemo(() => {
    const items: MapProductItem[] = data?.data?.data?.items ?? [];

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
        categoryTag: item.is_free ? t("post.free") : item.price || undefined,
        distance: item.distance || undefined,
        features: [
          item.is_negotiable ? t("post.can_deal") : "",
          item.created_ago || '',
        ].filter(Boolean),
      }));
  }, [data, locale]);

  console.log('MapPage productMarkers:', productMarkers);

  // Combine highlighted marker with product markers
  const allMarkers = useMemo(() => {
    if (highlightedMarker) {
      return [highlightedMarker, ...productMarkers.filter((m) => m.id !== 'target-location')];
    }
    return productMarkers;
  }, [highlightedMarker, productMarkers]);

  const handleMarkerPress = (marker: MarkerData) => {
    setSelectedMarker(marker);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedMarker(null);
  };

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
        onMapPress={(coordinate) => console.log('Map pressed:', coordinate)}
      />

      <MarkerDetailModal
        marker={selectedMarker}
        isVisible={isModalVisible}
        onClose={handleCloseModal}
      />
    </View>
  );
};

export default MapPage;

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
});