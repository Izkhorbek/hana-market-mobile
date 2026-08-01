import { useEmergencyNumbersQuery } from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { EMERGENCY_SECTIONS } from '@/constants/emergencyNumbers'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { EmergencyNumberDto } from '@/types'
import { router } from 'expo-router'
import { ArrowLeft, Phone } from 'lucide-react-native'
import React, { useCallback } from 'react'
import {
  Linking,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function MahallaEmergencyScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  // Dial a short number.
  const handleCall = useCallback((number: string) => {
    if (number) Linking.openURL(`tel:${number}`).catch(() => {})
  }, [])

  // Admin-managed list from the backend; fall back to the local seed until it loads.
  const q = useEmergencyNumbersQuery()
  const source = q.data?.data?.data?.length ? q.data.data.data : EMERGENCY_SECTIONS
  const sections = source.map((s) => ({
    emoji: s.emoji,
    title: s.title,
    data: s.items,
  }))

  const renderItem = ({ item }: { item: EmergencyNumberDto }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.background, borderColor: colors.borderColor }]}
      onPress={() => handleCall(item.number)}
      activeOpacity={0.7}
    >
      <View style={[styles.numBadge, { backgroundColor: colors.tabIconBackground }]}>
        <Text style={[styles.numText, { color: colors.tabIconSelected }]}>{item.number}</Text>
      </View>
      <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={[styles.callBtn, { backgroundColor: colors.primaryColor }]}>
        <Phone size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  )

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('mahalla.emergency_title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.number + item.name}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {section.emoji}  {section.title}
          </Text>
        )}
        ListFooterComponent={
          <Text style={[styles.note, { color: colors.subText }]}>{t('mahalla.em_note')}</Text>
        }
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  list: { padding: 16, paddingBottom: 32 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  numBadge: {
    minWidth: 52,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numText: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  rowName: { flex: 1, fontSize: 13, lineHeight: 17 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  note: { fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 15 },
})
