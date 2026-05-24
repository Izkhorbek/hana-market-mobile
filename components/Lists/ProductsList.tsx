import { useInfiniteProductsQuery } from '@/api/hooks'
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

const DEFAULT_LAT = 41.311081
const DEFAULT_LNG = 69.240562
const PAGE_SIZE = 20

interface ProductsListProps {
  selectedFilter: string
  onFilterChange: (key: string) => void
}

const ProductsList: React.FC<ProductsListProps> = ({ selectedFilter, onFilterChange }) => {
  const { t } = useTranslations()
  const colors = useThemeColors()
  const user = useAuthStore((s) => s.user)

  const userLat = user?.latitude ?? DEFAULT_LAT
  const userLng = user?.longitude ?? DEFAULT_LNG
  const productType = FILTER_TO_PRODUCT_TYPE[selectedFilter]

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isError,
    refetch,
  } = useInfiniteProductsQuery({
    params: {
      user_lat: userLat,
      user_long: userLng,
      page_size: PAGE_SIZE,
      product_type: productType,
    },
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

  const ListEmpty = isInitialLoading ? null : (
    <View style={styles.centerBox}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t('home.empty_state')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.subText ?? colors.textMuted }]}>
        {t('home.empty_state_sub')}
      </Text>
    </View>
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
  const handleOnDotsPress = useCallback((_id: number) => {
  }, [])

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
    return (
      <View style={styles.centerBox}>
        {ListHeader}
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {t('home.error')}
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
