import { Colors } from '@/constants/theme'
import type { ColorValue } from 'react-native'
import { useThemeColors } from '@/hooks/use-theme-colors'
import type { LucideIcon } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'


const TabIcon = ({ Icon, focused, title, color, badgeCount }: { Icon: LucideIcon, focused: boolean, title: string, color: ColorValue, badgeCount?: number }) => {
  const colors = useThemeColors()
  const showBadge = typeof badgeCount === 'number' && badgeCount > 0
  const badgeText = showBadge ? (badgeCount! > 99 ? '99+' : String(badgeCount)) : ''
  return (
    <ThemedView style={[styles.container, focused && { ...styles.focused, backgroundColor: colors.tabIconBackground }]}>
      <View>
        <Icon size={24} color={color} />
        {showBadge && (
          <View style={styles.badge} pointerEvents="none">
            <ThemedText style={styles.badgeText}>{badgeText}</ThemedText>
          </View>
        )}
      </View>
      <ThemedText style={[styles.text, focused && { ...styles.focusedText, color: color }]}>{title}</ThemedText>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 64,
    height: 60,
    justifyContent: 'center',
    paddingTop: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '400',
  },
  focused: {
    borderRadius: 12, 
  },
  focusedText: {
    color: Colors.light.icon,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
})

export default TabIcon