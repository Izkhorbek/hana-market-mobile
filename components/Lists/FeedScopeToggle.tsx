import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { FeedScope } from '@/types'
import { MapPin, Users } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface FeedScopeToggleProps {
  /** The scope actually being shown — read it from `applied_scope`, not the request. */
  value: FeedScope
  onChange: (scope: FeedScope) => void
}

/**
 * Radius feed vs. the caller's own mahalla. Guests and users with no membership
 * get a 400 on an explicit `scope=mahalla`, so the list that owns this toggle
 * flips it back and offers the join flow instead of showing an error screen.
 */
const FeedScopeToggle: React.FC<FeedScopeToggleProps> = ({ value, onChange }) => {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const options: { scope: FeedScope; labelKey: string; Icon: typeof MapPin }[] = [
    { scope: 'radius', labelKey: 'home.scope_nearby', Icon: MapPin },
    { scope: 'mahalla', labelKey: 'home.scope_mahalla', Icon: Users },
  ]

  return (
    <View style={styles.row}>
      {options.map(({ scope, labelKey, Icon }) => {
        const active = value === scope
        return (
          <TouchableOpacity
            key={scope}
            style={[
              styles.chip,
              active
                ? { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }
                : { backgroundColor: colors.background, borderColor: colors.borderColor },
            ]}
            onPress={() => onChange(scope)}
            activeOpacity={0.8}
          >
            <Icon size={14} color={active ? '#fff' : colors.subText} strokeWidth={2} />
            <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
              {t(labelKey)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
})

export default FeedScopeToggle
