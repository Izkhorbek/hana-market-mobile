import RemoteImage from '@/components/shared/RemoteImage'
import type { EServiceCategory } from '@/constants/enums'
import { getServiceCategoryVisual } from '@/constants/serviceCategories'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import React, { memo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface MyServiceCardProps {
  id: string
  title: string
  category?: EServiceCategory
  category_name: string
  image: string
  price: string
  price_type_name?: string
  created_ago: string
  onPress?: () => void
  onMenuPress?: () => void
}

/**
 * One row in "my services" — the provider's own view of a service they posted.
 *
 * Mirrors MyListingCard, minus the view/like counters: the service list DTO has
 * no engagement fields, and a service is contacted by phone rather than opened.
 */
const MyServiceCardComponent: React.FC<MyServiceCardProps> = ({
  title,
  category,
  category_name,
  image,
  price,
  price_type_name,
  created_ago,
  onPress,
  onMenuPress,
}) => {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const visual = getServiceCategoryVisual(category)
  const { Icon: CategoryIcon } = visual

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Photo, or the category's own tile when there is none */}
      {image ? (
        <RemoteImage src={image} style={styles.image} resizeMode='cover' />
      ) : (
        <View style={[styles.image, styles.categoryTile, { backgroundColor: visual.bg }]}>
          <CategoryIcon size={30} color={visual.color} strokeWidth={1.6} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {title}
          </Text>
          <TouchableOpacity
            onPress={onMenuPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name='dots-vertical' size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {!!category_name && (
          <View style={styles.categoryRow}>
            <CategoryIcon size={13} color={visual.color} strokeWidth={2} />
            <Text style={[styles.category, { color: colors.textMuted }]} numberOfLines={1}>
              {category_name}
            </Text>
          </View>
        )}

        <Text style={[styles.price, { color: colors.text }]} numberOfLines={1}>
          {price || t('service.negotiable')}
          {!!price_type_name && (
            <Text style={[styles.priceType, { color: colors.textMuted }]}>
              {' · '}
              {price_type_name}
            </Text>
          )}
        </Text>

        {!!created_ago && (
          <Text style={[styles.time, { color: colors.textMuted }]}>{created_ago}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const MyServiceCard = memo(MyServiceCardComponent)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  categoryTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  category: {
    flex: 1,
    fontSize: 13,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  priceType: {
    fontSize: 12,
    fontWeight: '400',
  },
  time: {
    fontSize: 12,
  },
})

export default MyServiceCard
