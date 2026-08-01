import { useGasSessionQuery } from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { GasHouseholdRow, GasHouseholdStatus } from '@/types'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// One-line: badge color per household outcome (one-off accents, not theme tokens).
const STATUS_COLOR: Record<GasHouseholdStatus, string> = {
  delivered: '#16a34a',
  skipped: '#dc2626',
  current: '#d97706',
  pending: '#6b7280',
}

export default function GasSessionDetailScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const { id } = useLocalSearchParams<{ id: string }>()
  const sessionId = Number(id) || 0

  const detailQ = useGasSessionQuery({ id: sessionId })
  const detail = detailQ.data?.data?.data
  const households: GasHouseholdRow[] = detail?.households ?? []

  const delivered = households.filter((h) => h.status === 'delivered').length
  const skipped = households.filter((h) => h.status === 'skipped').length

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {detail ? detail.session.scheduled_date : t('gas.history_title')}
      </Text>
      <View style={styles.headerBtn} />
    </View>
  )

  const Summary = detail ? (
    <View style={[styles.summary, { borderColor: colors.borderColor }]}>
      <Text style={[styles.summaryText, { color: '#16a34a' }]}>
        {t('gas.status_delivered')}: {delivered}
      </Text>
      <Text style={[styles.summaryText, { color: '#dc2626' }]}>
        {t('gas.status_skipped')}: {skipped}
      </Text>
      <Text style={[styles.summaryText, { color: colors.subText }]}>
        {t('gas.history_total')}: {households.length}
      </Text>
    </View>
  ) : null

  const renderItem = ({ item }: { item: GasHouseholdRow }) => {
    const statusColor = STATUS_COLOR[item.status]
    return (
      <View style={[styles.row, { borderColor: colors.borderColor }]}>
        <Text style={[styles.rowNo, { color: colors.text }]}>{item.house_number}</Text>
        <Text style={[styles.rowAddr, { color: colors.subText }]} numberOfLines={1}>
          {item.address_label}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(`gas.status_${item.status}` as 'gas.status_delivered')}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}
      <FlatList
        data={households}
        keyExtractor={(h) => h.household_id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={Summary}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          detailQ.isFetching ? (
            <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
          ) : (
            <Text style={[styles.muted, styles.emptyText, { color: colors.subText }]}>
              {t('gas.no_sessions')}
            </Text>
          )
        }
        refreshing={detailQ.isFetching}
        onRefresh={() => detailQ.refetch()}
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
  list: { padding: 16, gap: 8, flexGrow: 1 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  summaryText: { fontSize: 13, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  rowNo: { fontSize: 14, fontWeight: '700', minWidth: 36 },
  rowAddr: { flex: 1, fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  muted: { fontSize: 14, textAlign: 'center' },
  emptyText: { paddingTop: 60 },
  loader: { paddingVertical: 40 },
})
