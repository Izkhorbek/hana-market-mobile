import { useGasSessionsQuery } from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useGasStore } from '@/modules/Gas/gas-store'
import type { GasSessionDto, GasSessionStatus } from '@/types'
import { type Href, router } from 'expo-router'
import { ArrowLeft, ChevronRight } from 'lucide-react-native'
import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// One-line: badge color per session status (one-off accents, not theme tokens).
const STATUS_COLOR: Record<GasSessionStatus, string> = {
  planned: '#d97706',
  active: '#16a34a',
  paused: '#d97706',
  completed: '#6b7280',
  cancelled: '#dc2626',
}

export default function GasHistoryScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const mahallaId = useGasStore((s) => s.mahallaId)
  const sessionsQ = useGasSessionsQuery({ mahallaId: mahallaId ?? 0 })
  const sessions: GasSessionDto[] = sessionsQ.data?.data?.data?.items ?? []

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('gas.history_title')}</Text>
      <View style={styles.headerBtn} />
    </View>
  )

  const renderItem = ({ item }: { item: GasSessionDto }) => {
    const statusColor = STATUS_COLOR[item.status]
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderColor }]}
        onPress={() => router.push(`/gas/session/${item.id}` as Href)}
        activeOpacity={0.7}
      >
        <View style={styles.cardBody}>
          <Text style={[styles.cardDate, { color: colors.text }]}>
            {item.scheduled_date}
            {!!item.scheduled_time && ` · ${item.scheduled_time}`}
          </Text>
          <Text style={[styles.cardCounts, { color: colors.subText }]}>
            {t('gas.history_delivered', { done: item.delivered_count, total: item.total_count })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(`gas.session_${item.status}` as 'gas.session_completed')}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.subText} />
      </TouchableOpacity>
    )
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          sessionsQ.isFetching ? (
            <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
          ) : (
            <Text style={[styles.muted, styles.emptyText, { color: colors.subText }]}>
              {t('gas.no_sessions')}
            </Text>
          )
        }
        refreshing={sessionsQ.isFetching}
        onRefresh={() => sessionsQ.refetch()}
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
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardBody: { flex: 1, gap: 3 },
  cardDate: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  cardCounts: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  muted: { fontSize: 14, textAlign: 'center' },
  emptyText: { paddingTop: 60 },
  loader: { paddingVertical: 40 },
})
