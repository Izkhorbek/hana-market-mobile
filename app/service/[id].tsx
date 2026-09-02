import { useServiceQuery } from '@/api/hooks'
import ProductImageGallery from '@/components/ProductDetail/ProductImageGallery'
import { getServiceCategoryVisual } from '@/constants/serviceCategories'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { ApiResponse, SingleServiceDto } from '@/types'
import { AxiosResponse } from 'axios'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Clock, MapPin, Phone } from 'lucide-react-native'
import React from 'react'
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const colors = useThemeColors()
  const { t } = useTranslations()
  // The hero runs edge to edge; its height follows the screen width (4:3).
  const { width } = useWindowDimensions()
  const heroHeight = Math.round(width * 0.75)

  const numericId = Number(id)
  const { data, isLoading, isError } = useServiceQuery({ id: numericId })

  const service: SingleServiceDto | undefined = (
    data as AxiosResponse<ApiResponse<SingleServiceDto>> | undefined
  )?.data?.data

  const handleCall = () => {
    if (service?.phone_number) Linking.openURL(`tel:${service.phone_number}`)
  }

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
        {t('mahalla.services_title')}
      </Text>
      <View style={styles.headerBtn} />
    </View>
  )

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
      </ThemedView>
    )
  }

  if (isError || !service) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.subText }]}>{t('post.error')}</Text>
        </View>
      </ThemedView>
    )
  }

  // RemoteImage inside the gallery resolves the server-relative paths
  // (e.g. "/service_images/x.jpg") to absolute URLs, same as the product feed.
  const galleryImages = (service.images ?? []).slice(1).map((image_url) => ({ image_url }))
  const hasImages = (service.images?.length ?? 0) > 0

  // No photo → the category's own icon carries the header instead.
  const visual = getServiceCategoryVisual(service.category)
  const { Icon: CategoryIcon } = visual

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {hasImages ? (
          <View style={{ width, height: heroHeight }}>
            <ProductImageGallery
              mainImage={service.images[0]}
              images={galleryImages}
              overlayBottom={10}
            />
          </View>
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              { width, height: Math.round(heroHeight * 0.6), backgroundColor: visual.bg },
            ]}
          >
            <CategoryIcon size={56} color={visual.color} strokeWidth={1.5} />
          </View>
        )}

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>{service.title}</Text>

          <View style={styles.chipRow}>
            {!!service.category_name && (
              <View style={[styles.chip, { backgroundColor: visual.bg }]}>
                <CategoryIcon size={14} color={visual.color} strokeWidth={2} />
                <Text style={[styles.chipText, { color: visual.color }]}>
                  {service.category_name}
                </Text>
              </View>
            )}
            <Text style={[styles.price, { color: colors.primaryColor }]}>
              {service.price ?? t('service.negotiable')}
              {!!service.price_type_name && (
                <Text style={[styles.priceType, { color: colors.subText }]}>
                  {' '}
                  · {service.price_type_name}
                </Text>
              )}
            </Text>
          </View>

          <View style={styles.metaList}>
            {!!service.distance && (
              <View style={styles.metaItem}>
                <MapPin size={16} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>
                  {service.distance}
                  {!!service.moljal && ` · ${service.moljal}`}
                </Text>
              </View>
            )}
            {!!service.availability && (
              <View style={styles.metaItem}>
                <Clock size={16} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>{service.availability}</Text>
              </View>
            )}
          </View>

          {!!service.description && (
            <Text style={[styles.description, { color: colors.text }]}>{service.description}</Text>
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom Call button */}
      <View style={[styles.footer, { borderTopColor: colors.borderColor }]}>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.primaryColor }]}
          onPress={handleCall}
          activeOpacity={0.85}
          disabled={!service.phone_number}
        >
          <Phone size={18} color="#fff" />
          <Text style={styles.callBtnText}>{t('service.call')}</Text>
        </TouchableOpacity>
      </View>
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
    flex: 1,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  priceType: {
    fontSize: 12,
    fontWeight: '400',
  },
  metaList: {
    marginTop: 16,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  callBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    paddingVertical: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
  },
})
