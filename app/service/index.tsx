import { useInfiniteServicesQuery } from '@/api/hooks'
import { AppLimits } from '@/constants/appLimits'
import { EServiceCategory } from '@/constants/enums'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import type { ApiResponse, PaginatedResponse, ServiceListItemDto } from '@/types'
import { AxiosResponse } from 'axios'
import { type Href, router } from 'expo-router'
import { ArrowLeft, Phone, Plus, Wrench } from 'lucide-react-native'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
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
    refetch,
  } = useInfiniteServicesQuery({
    params: {
      user_lat: userLat,
      user_long: userLng,
      page_size: AppLimits.Pagination.DEFAULT_PAGE_SIZE,
      category: selectedCategory,
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
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderColor }]}
        activeOpacity={0.7}
        onPress={() => router.push(`/service/${item.id}` as Href)}
      >
        <View style={[styles.iconBubble, { backgroundColor: colors.tabIconBackground }]}>
          <Wrench size={22} color={colors.tabIconSelected} strokeWidth={1.8} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title ?? ''}
          </Text>
          {!!item.category_name && (
            <Text style={[styles.cardCategory, { color: colors.subText }]} numberOfLines={1}>
              {item.category_name}
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={[styles.price, { color: colors.primaryColor }]}>
              {item.price ?? t('service.negotiable')}
            </Text>
            {!!item.distance && (
              <Text style={[styles.meta, { color: colors.subText }]}> · {item.distance}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.primaryColor }]}
          onPress={() => handleCall(item.phone_number)}
          hitSlop={8}
          activeOpacity={0.85}
        >
          <Phone size={16} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [colors, handleCall, t],
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

      {/* Category filter chips */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORY_CHIPS.map((c) => {
            const active = selectedCategory === c.value
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
  chipsWrap: {
    paddingVertical: 10,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardCategory: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
