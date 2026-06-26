import { useInfiniteProductsQuery } from '@/api/hooks'
import MarketplaceEmptyState, { type EmptyReason } from '@/components/shared/MarketplaceEmptyState'
import { classifyGeoApiError, type ApiErrorKind } from '@/utils/apiError'
import { getCurrentLocationSafe, showLocationErrorAlert } from '@/utils/location'
import { EProductType } from '@/constants/enums'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { ApiResponse, PaginatedResponse } from '@/types'
import { AxiosResponse } from 'axios'
import { router } from 'expo-router'
import React, { useCallback, useMemo, useRef } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import ProductCard from '../shared/Cards/ProductCard'
import FilterButtons from './FilterButtons'
import { AppLimits } from '@/constants/appLimits'

// ── Shape returned by GET /api/product/all ──────────────────────────────────
interface ProductItem {
  id: number
  title: string | null
  description: string | null
  moljal: string | null
  main_image_url: string | null
  is_free: boolean
  price: string | null
  status: string | null

  // Common fields are not using now,
  // but we can use them in the future for sorting/filtering
  // -----
  // Car Type Specific
  car_brand: string | null
  car_model: string | null

  // Work Type Specific
  work_type: string | null
  work_condition: string | null
  //------

  distance: string | null
  view_count: number
  likes_count: number
  created_ago: string | null
}

// ── Filter key → product_type mapping ───────────────────────────────────────
const FILTER_TO_PRODUCT_TYPE: Record<string, EProductType | undefined> = {
  all: undefined, // No filter for "All"
  things: EProductType.THING,
  cars: EProductType.CAR,
  works: EProductType.WORK,
}

interface ProductsListProps {
  selectedFilter: string
  onFilterChange: (key: string) => void,
  onDotsPress?: (productId: number) => void
}

const ProductsList: React.FC<ProductsListProps> = ({ selectedFilter, onFilterChange, onDotsPress }) => {
  const { t } = useTranslations()
  const colors = useThemeColors()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const updateLocation = useAuthStore((s) => s.updateLocation)

  const userLat = user?.latitude ?? AppLimits.DefaultCoordinates.TASHKENT_LATITUDE
  const userLng = user?.longitude ?? AppLimits.DefaultCoordinates.TASHKENT_LONGITUDE
  const productType = FILTER_TO_PRODUCT_TYPE[selectedFilter]

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isError,
    error,
    refetch,
  } = useInfiniteProductsQuery({
    params: {
      user_lat: userLat,
      user_long: userLng,
      page_size: AppLimits.Pagination.DEFAULT_PAGE_SIZE,
      product_type: productType,
    },
    // Never fetch before the keychain-derived session is known. Running before
    // hydration races a not-yet-injected auth token → guaranteed 401.
    querySettings: { enabled: isHydrated && isAuthenticated },
  })

  const loadMoreInFlightRef = useRef(false)

  const products: ProductItem[] = useMemo(
    () =>
      data?.pages.flatMap(
        (p: AxiosResponse<ApiResponse<PaginatedResponse<any>>>) =>
          p.data?.data?.items ?? [],
      ) ?? [],
    [data],
  )

  const isInitialLoading = isFetching && products.length === 0

  // ── Sub-components ──────────────────────────────────────────────────────
  const ListHeader = (
    <FilterButtons selectedFilter={selectedFilter} onFilterChange={onFilterChange} />
  )

  // ── Contextual empty state ──────────────────────────────────────────────
  // Pick the reason from the signals the Home list has (location + category).
  // Search-specific reasons (NO_SEARCH_RESULTS / FILTER_TOO_STRICT) live on the
  // search screen; NEW_REGION needs a backend signal we don't have here yet.
  const hasLocation = user?.latitude != null && user?.longitude != null
  const emptyReason: EmptyReason = !hasLocation
    ? 'NO_LOCATION'
    : selectedFilter !== 'all'
      ? 'NO_CATEGORY_PRODUCTS'
      : 'NO_NEARBY_PRODUCTS'

  // Enable location via the existing safe permission/GPS flow, then persist it
  // through the existing updateLocation action (no new API, no fetch refactor).
  const handleEnableLocation = useCallback(async () => {
    const result = await getCurrentLocationSafe()
    if (!result.ok) {
      showLocationErrorAlert(result, t)
      return
    }
    try {
      await updateLocation(result.coords.latitude, result.coords.longitude)
      // Updating user.latitude/longitude changes the query params → the list
      // refetches automatically; refetch() covers the same-coords case.
      refetch()
    } catch {
      // updateLocation failures are transient/network — leave the empty state.
    }
  }, [updateLocation, refetch, t])

  const ListEmpty = isInitialLoading ? null : (
    <MarketplaceEmptyState
      reason={emptyReason}
      isLoggedIn={isAuthenticated}
      onEnableLocation={handleEnableLocation}
      onSelectManualLocation={() => router.push('/(settings)/manage')}
      onExpandRadius={() => router.push('/(settings)/manage')}
      onCreateListing={() => router.push('/(post)/create')}
      onBrowseCategories={() => router.push('/categories')}
    />
  )

  const ListFooter = isFetchingNextPage ? (
    <ActivityIndicator style={styles.footerLoader} color={colors.primaryColor} />
  ) : null

  // ── Callbacks (must be declared before any early returns) ───────────────
  // Clicking on a product card navigates to the product details page
  const handleOnPress = useCallback((id: number) => {
    router.push(`/product/${id}`)
  }, [])

  // Dots button is for future features like edit/delete/report
  const handleOnDotsPress = useCallback((productId: number) => {
    if (onDotsPress) {
      onDotsPress(productId)
    }
  }, [onDotsPress])

  const renderItem = useCallback(({ item }: { item: ProductItem }) => (
    <ProductCard
      title={item.title ?? ''}
      description={item.description ?? ''}
      distance={item.distance ?? ''}
      status={item.status ?? ''}
      main_image_url={item.main_image_url ?? ''}
      created_ago={item.created_ago ?? ''}
      moljal={item.moljal ?? ''}
      is_free={item.is_free}
      price={item.price ?? ''}
      likes_count={item.likes_count ?? 0}
      view_count={item.view_count ?? 0}
      onPress={() => handleOnPress(item.id)}
      onDotsPress={() => handleOnDotsPress(item.id)}
    />
  ), [handleOnDotsPress, handleOnPress])

  const keyExtractor = useCallback((item: ProductItem) => item.id.toString(), [])

  const handleEndReached = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || loadMoreInFlightRef.current) {
      return
    }
    loadMoreInFlightRef.current = true
    try {
      await fetchNextPage()
    } finally {
      loadMoreInFlightRef.current = false
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // ── Error state ─────────────────────────────────────────────────────────
  if (isError) {
    // Map the real failure cause to its message instead of always blaming the
    // user's location/address (see docs/home-error-message-fix-report.md).
    const errorMessageKey: Record<ApiErrorKind, string> = {
      auth: 'home.error_auth',
      network: 'home.error_network',
      server: 'home.error_server',
      location: 'home.error_location',
      unknown: 'home.error_generic',
    }
    const kind = classifyGeoApiError(error)
    return (
      <View style={styles.centerBox}>
        {ListHeader}
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {t('home.error')}{'\n'}
          {t(errorMessageKey[kind])}
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primaryColor }]}
          onPress={() => refetch()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>{t('home.retry')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      style={styles.container}
      data={products}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      renderItem={renderItem}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      removeClippedSubviews
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      updateCellsBatchingPeriod={50}
      windowSize={7}
      // Pull-to-refresh
      refreshing={isFetching && !isFetchingNextPage}
      onRefresh={() => refetch()}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 16,
  },
})

export default ProductsList
