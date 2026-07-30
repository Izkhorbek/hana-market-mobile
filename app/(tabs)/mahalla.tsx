import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { type Href, router } from 'expo-router'
import { ChevronRight, Fuel, Megaphone, PackageSearch, Wrench } from 'lucide-react-native'
import React from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type HubItem = {
  key: string
  titleKey: string
  subtitleKey: string
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
  iconBg: string
  iconColor: string
  onPress: () => void
  comingSoon?: boolean
}

export default function MahallaScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const comingSoon = () =>
    Alert.alert(t('mahalla.coming_soon'), t('mahalla.coming_soon_message'))

  const items: HubItem[] = [
    {
      key: 'gas',
      titleKey: 'mahalla.gas_title',
      subtitleKey: 'mahalla.gas_subtitle',
      Icon: Fuel,
      iconBg: '#FDECE4',
      iconColor: '#E8663A',
      onPress: comingSoon,
      comingSoon: true,
    },
    {
      key: 'services',
      titleKey: 'mahalla.services_title',
      subtitleKey: 'mahalla.services_subtitle',
      Icon: Wrench,
      iconBg: colors.tabIconBackground,
      iconColor: colors.tabIconSelected,
      // Typed routes for this new screen regenerate on the next `expo start`;
      // cast the href until then.
      onPress: () => router.push('/create-service' as Href),
    },
    {
      key: 'announcements',
      titleKey: 'mahalla.announcements_title',
      subtitleKey: 'mahalla.announcements_subtitle',
      Icon: Megaphone,
      iconBg: '#E8F0FE',
      iconColor: '#3B82C4',
      onPress: comingSoon,
      comingSoon: true,
    },
    {
      key: 'lostfound',
      titleKey: 'mahalla.lostfound_title',
      subtitleKey: 'mahalla.lostfound_subtitle',
      Icon: PackageSearch,
      iconBg: '#E7F5EE',
      iconColor: '#4FA07A',
      onPress: comingSoon,
      comingSoon: true,
    },
  ]

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('mahalla.title')}</Text>
      <Text style={[styles.subtitle, { color: colors.subText }]}>{t('mahalla.subtitle')}</Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const { Icon } = item
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderColor }]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={[styles.iconBubble, { backgroundColor: item.iconBg }]}>
                <Icon size={24} color={item.iconColor} strokeWidth={1.8} />
              </View>
              <View style={styles.cardText}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t(item.titleKey)}</Text>
                  {item.comingSoon && (
                    <View style={[styles.badge, { backgroundColor: colors.borderColor }]}>
                      <Text style={[styles.badgeText, { color: colors.subText }]}>
                        {t('mahalla.coming_soon')}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardSubtitle, { color: colors.subText }]}>
                  {t(item.subtitleKey)}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.icon} strokeWidth={2} />
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
})
