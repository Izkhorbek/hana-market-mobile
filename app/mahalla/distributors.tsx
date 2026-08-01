import { useMahallaDistributorsQuery, useMyMahallaQuery } from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { DistributorCompanyStatus, MahallaDistributorDto } from '@/types'
import { type Href, router } from 'expo-router'
import { ArrowLeft, Building2, Phone } from 'lucide-react-native'
import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// One-line: badge color per state-registry status (one-off accents, not theme tokens).
const STATUS_COLOR: Record<DistributorCompanyStatus, string> = {
  active: '#16a34a',
  liquidating: '#dc2626',
  suspended: '#6b7280',
}

export default function MahallaDistributorsScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const myMahallaQ = useMyMahallaQuery()
  const mahallaId = myMahallaQ.data?.data?.data?.mahalla_id ?? 0

  const distQ = useMahallaDistributorsQuery({ mahallaId })
  const distributors: MahallaDistributorDto[] = distQ.data?.data?.data ?? []

  // Open the phone dialer with the distributor's public number.
  const handleCall = useCallback((phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`)
  }, [])

  // One labelled official-info row; renders nothing when the value is empty.
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null
    return (
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: colors.subText }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    )
  }

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('mahalla.distributors_title')}</Text>
      <View style={styles.headerBtn} />
    </View>
  )

  // No mahalla membership yet → prompt to join.
  if (!mahallaId && !myMahallaQ.isFetching) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.center}>
          <Text style={[styles.muted, { color: colors.subText }]}>{t('gas.no_mahalla')}</Text>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.primaryColor }]}
            onPress={() => router.push('/mahalla/join' as Href)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>{t('mahalla.select_mahalla')}</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    )
  }

  const renderItem = ({ item }: { item: MahallaDistributorDto }) => {
    const statusColor = STATUS_COLOR[item.company_status]
    const vatValue = item.is_vat_payer
      ? item.vat_certificate_no
        ? `${t('mahalla.dist_vat_yes')} · ${t('mahalla.dist_vat_certificate')} ${item.vat_certificate_no}`
        : t('mahalla.dist_vat_yes')
      : t('mahalla.dist_vat_no')
    const registration =
      item.registered_at && item.registry_number
        ? `${item.registered_at} · ${item.registry_number}`
        : item.registered_at || item.registry_number || null

    return (
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderColor }]}>
        {/* Header: company + status */}
        <View style={styles.cardHead}>
          <View style={[styles.iconBubble, { backgroundColor: colors.tabIconBackground }]}>
            <Building2 size={22} color={colors.tabIconSelected} strokeWidth={1.8} />
          </View>
          <View style={styles.cardHeadBody}>
            <Text style={[styles.cardName, { color: colors.text }]}>{item.company_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {t(`mahalla.dist_status_${item.company_status}` as 'mahalla.dist_status_active')}
              </Text>
            </View>
          </View>
        </View>

        {!!item.director_name && (
          <Text style={[styles.director, { color: colors.subText }]}>
            {t('mahalla.dist_director')}: <Text style={{ color: colors.text }}>{item.director_name}</Text>
          </Text>
        )}

        {/* Call */}
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.primaryColor }]}
          onPress={() => handleCall(item.phone)}
          activeOpacity={0.85}
        >
          <Phone size={16} color="#fff" />
          <Text style={styles.callBtnText}>{item.phone}</Text>
        </TouchableOpacity>

        {/* Official / legal details */}
        <View style={[styles.officialBlock, { borderTopColor: colors.borderColor }]}>
          <Text style={[styles.officialTitle, { color: colors.subText }]}>
            {t('mahalla.dist_official_info')}
          </Text>
          <InfoRow label={t('mahalla.dist_tin')} value={item.tin} />
          <InfoRow label={t('mahalla.dist_legal_address')} value={item.legal_address} />
          <InfoRow label={t('mahalla.dist_oked')} value={item.oked} />
          <InfoRow label={t('mahalla.dist_vat')} value={vatValue} />
          <InfoRow label={t('mahalla.dist_registered_at')} value={registration} />
        </View>
      </View>
    )
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}
      <FlatList
        data={distributors}
        keyExtractor={(d) => d.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          distQ.isFetching ? (
            <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
          ) : (
            <Text style={[styles.muted, styles.emptyText, { color: colors.subText }]}>
              {t('mahalla.no_distributors')}
            </Text>
          )
        }
        refreshing={distQ.isFetching}
        onRefresh={() => distQ.refetch()}
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
  list: { padding: 16, gap: 14, flexGrow: 1 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeadBody: { flex: 1, gap: 6 },
  cardName: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  director: { fontSize: 13 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  callBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  officialBlock: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 8 },
  officialTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoLabel: { fontSize: 13, flex: 0.9 },
  infoValue: { fontSize: 13, fontWeight: '500', flex: 1.1, textAlign: 'right' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  muted: { fontSize: 14, textAlign: 'center' },
  emptyText: { paddingTop: 60 },
  loader: { paddingVertical: 40 },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
