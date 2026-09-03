import { useInfiniteServicesQuery } from '@/api/hooks'
import FeedScopeToggle from '@/components/Lists/FeedScopeToggle'
import ServiceCard from '@/components/shared/Cards/ServiceCard'
import { AppLimits } from '@/constants/appLimits'
import { EServiceCategory } from '@/constants/enums'
import { ALL_SERVICES_VISUAL, getServiceCategoryVisual } from '@/constants/serviceCategories'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import type { ApiResponse, FeedScope, PaginatedResponse, ServiceListItemDto } from '@/types'
import { AxiosResponse } from 'axios'
import { type Href, router } from 'expo-router'
import { ArrowLeft, Plus } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// Category filter chips ("Barchasi" + each service category).
const CATEGORY_CHIPS: { value?: EServiceCategory; labelKey: string }[] = [
  { value: undefined, labelKey: 'service.all' },
  { value: EServiceCategory.PLUMBER, labelKey: 'service.plumber' },
  { value: EServiceCategory.ELECTRICIAN, labelKey: 'service.electrician' },
  { value: EServiceCategory.REPAIR, labelKey: 'service.repair' },
  { value: EServiceCategory.CLEANING, labelKey: 'service.cleaning' },
  { value: EServiceCategory.MOVING, labelKey: 'service.moving' },
  { value: EServiceCategory.TUTOR, labelKey: 'service.tutor' },
  { value: EServiceCategory.GARDENER, labelKey: 'service.gardener' },
  { value: EServiceCategory.APPLIANCE, labelKey: 'service.appliance' },
  { value: EServiceCategory.BEAUTY, labelKey: 'service.beauty' },
  { value: EServiceCategory.OTHER, labelKey: 'service.other' },
]

export default function ServiceListScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const [selectedCategory, setSelectedCategory] = useState<EServiceCategory | undefined>(undefined)
  // Omitted for 'radius', so the default request stays exactly as it was.
  const [scope, setScope] = useState<FeedScope>('radius')

  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isGuest = useAuthStore((s) => s.isGuest)
  const guestLatitude = useAuthStore((s) => s.guestLatitude)
  const guestLongitude = useAuthStore((s) => s.guestLongitude)

  // Same location precedence as the product feed.
  const userLat =
    user?.latitude ?? guestLatitude ?? AppLimits.DefaultCoordinates.TASHKENT_LATITUDE
  const userLng =
    user?.longitude ?? guestLongitude ?? AppLimits.DefaultCoordinates.TASHKENT_LONGITUDE

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isError,
    error,
    refetch,
  } = useInfiniteServicesQuery({
    params: {
      user_lat: userLat,
      user_long: userLng,
      page_size: AppLimits.Pagination.DEFAULT_PAGE_SIZE,
      category: selectedCategory,
      scope: scope === 'mahalla' ? 'mahalla' : undefined,
    },
    querySettings: { enabled: isHydrated && (isAuthenticated || isGuest) },
  })

  const loadMoreInFlightRef = useRef(false)

  const services: ServiceListItemDto[] = useMemo(
    () =>
      data?.pages.flatMap(
        (p: AxiosResponse<ApiResponse<PaginatedResponse<ServiceListItemDto>>>) =>
          p.data?.data?.items ?? [],
      ) ?? [],
    [data],
  )

  const isInitialLoading = isFetching && services.length === 0

  // Label the toggle from what the server served, not from the request.
  const appliedScope: FeedScope = data?.pages?.[0]?.data?.data?.applied_scope ?? scope

  // An explicit scope=mahalla 400s for a guest or a member-less user: fall
  // back to the radius feed and offer the join flow.
  useEffect(() => {
    if (scope !== 'mahalla' || !isError) return
    if ((error as { response?: { status?: number } })?.response?.status !== 400) return
    setScope('radius')
    Alert.alert(t('home.scope_no_mahalla_title'), t('home.scope_no_mahalla_message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('home.scope_no_mahalla_action'),
        onPress: () => router.push('/mahalla/join' as Href),
      },
    ])
  }, [scope, isError, error, t])

  const handleCall = useCallback((phone: string | null) => {
    if (phone) Linking.openURL(`tel:${phone}`)
  }, [])

  const handleEndReached = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || loadMoreInFlightRef.current) return
    loadMoreInFlightRef.current = true
    try {
      await fetchNextPage()
    } finally {
      loadMoreInFlightRef.current = false
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const renderItem = useCallback(
    ({ item }: { item: ServiceListItemDto }) => (
      <ServiceCard
        title={item.title ?? ''}
        category={item.category}
        category_name={item.category_name ?? ''}
        main_image_url={item.main_image_url ?? ''}
        price={item.price ?? ''}
        price_type_name={item.price_type_name ?? undefined}
        moljal={item.moljal ?? ''}
        mahalla_name={item.mahalla_name}
        distance={item.distance ?? ''}
        created_ago={item.created_ago ?? ''}
        onPress={() => router.push(`/service/${item.id}` as Href)}
        onCallPress={() => handleCall(item.phone_number)}
      />
    ),
    [handleCall],
  )

  const keyExtractor = useCallback((item: ServiceListItemDto) => item.id.toString(), [])

  const ListEmpty = isInitialLoading ? (
    <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
  ) : (
    <View style={styles.emptyBox}>
      <Text style={[styles.emptyText, { color: colors.subText }]}>{t('service.no_services')}</Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: colors.primaryColor }]}
        onPress={() => router.push('/create-service' as Href)}
        activeOpacity={0.85}
      >
        <Text style={styles.emptyBtnText}>{t('service.post_service')}</Text>
      </TouchableOpacity>
    </View>
  )

  const ListFooter = isFetchingNextPage ? (
    <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
  ) : null

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('mahalla.services_title')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/create-service' as Href)}
          hitSlop={10}
          style={styles.headerBtn}
        >
          <Plus size={22} color={colors.primaryColor} />
        </TouchableOpacity>
      </View>

      {/* Guests have no mahalla, so the toggle would only ever 400 for them. */}
      {isAuthenticated && (
        <View style={styles.scopeWrap}>
          <FeedScopeToggle value={appliedScope} onChange={setScope} />
        </View>
      )}

      {/* Category filter chips */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORY_CHIPS.map((c) => {
            const active = selectedCategory === c.value
            const visual = c.value == null ? ALL_SERVICES_VISUAL : getServiceCategoryVisual(c.value)
            const { Icon } = visual
            return (
              <TouchableOpacity
                key={c.labelKey}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }
                    : { backgroundColor: colors.background, borderColor: colors.borderColor },
                ]}
                onPress={() => setSelectedCategory(c.value)}
                activeOpacity={0.8}
              >
                <Icon size={15} color={active ? '#fff' : visual.color} strokeWidth={2} />
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                  {t(c.labelKey)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={services}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.list}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshing={isFetching && !isFetchingNextPage}
        onRefresh={() => refetch()}
      />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  scopeWrap: {
    paddingTop: 10,
  },
  chipsWrap: {
    paddingVertical: 10,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  loader: {
    paddingVertical: 24,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
