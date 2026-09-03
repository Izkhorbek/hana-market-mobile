import MapModal from '@/components/MapModal'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { MapPin, X } from 'lucide-react-native'
import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

/** A place chosen on the map for one post — sent as explicit coordinates. */
export interface PickedLocation {
  latitude: number
  longitude: number
  address?: string
}

interface PostLocationPickerProps {
  /** null = post under the owner's saved profile address (the default). */
  value: PickedLocation | null
  onChange: (value: PickedLocation | null) => void
}

/**
 * Where a new post is pinned. Left alone it sends nothing and the backend uses
 * the owner's profile address (`location_source: 'profile'`, mahalla tagged);
 * picking a place on the map makes it `'custom'` and drops the mahalla tag.
 */
const PostLocationPicker: React.FC<PostLocationPickerProps> = ({ value, onChange }) => {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const user = useAuthStore((s) => s.user)
  const [mapVisible, setMapVisible] = useState(false)

  const profileAddress = user?.address_name?.trim()
  const hasProfileCoords = !!user?.latitude && !!user?.longitude

  const title = value ? t('post.location_custom') : t('post.location_profile')
  const subtitle = value
    ? value.address || `${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`
    : profileAddress || t('post.location_no_profile')

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{t('post.location_title')}</Text>

      <View style={[styles.card, { borderColor: colors.borderColor }]}>
        <MapPin size={18} color={value ? colors.primaryColor : colors.subText} strokeWidth={2} />

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subText }]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        {value ? (
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={10} style={styles.clearBtn}>
            <X size={18} color={colors.subText} />
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.pickBtn, { borderColor: colors.primaryColor }]}
        onPress={() => setMapVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.pickBtnText, { color: colors.primaryColor }]}>
          {value ? t('post.location_change') : t('post.location_pick')}
        </Text>
      </TouchableOpacity>

      <MapModal
        visible={mapVisible}
        mode='SELECT'
        initialLocation={
          value ??
          (hasProfileCoords
            ? { latitude: user!.latitude as number, longitude: user!.longitude as number }
            : undefined)
        }
        onClose={() => setMapVisible(false)}
        onLocationSelect={(location) => onChange(location)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  clearBtn: {
    padding: 2,
  },
  pickBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pickBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
})

export default PostLocationPicker
