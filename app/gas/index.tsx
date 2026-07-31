import {
  useActiveGasSessionQuery,
  useConfirmGasReceiptMutation,
  useGasRealtime,
  useGasSessionQuery,
  useMyGasStatusQuery,
  useMyMahallaQuery,
} from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useGasStore } from '@/modules/Gas/gas-store'
import type { GasHouseholdRow, GasHouseholdStatus } from '@/types'
import { type Href, router } from 'expo-router'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react-native'
import React, { useEffect } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// One-line: map a household status to its i18n label key.
const statusLabelKey = (s: GasHouseholdStatus) =>
  ({
    pending: 'gas.status_pending',
    current: 'gas.status_current',
    delivered: 'gas.status_delivered',
    skipped: 'gas.status_skipped',
  })[s]

export default function GasTrackerScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const mahallaId = useGasStore((s) => s.mahallaId)
  const session = useGasStore((s) => s.session)
  const detail = useGasStore((s) => s.detail)
  const myStatus = useGasStore((s) => s.myStatus)
  const setSession = useGasStore((s) => s.setSession)
  const setDetail = useGasStore((s) => s.setDetail)
  const setMyStatus = useGasStore((s) => s.setMyStatus)
  const setMahallaId = useGasStore((s) => s.setMahallaId)
  const setRole = useGasStore((s) => s.setRole)
  const role = useGasStore((s) => s.role)
  const isManager = role === 'mahalla_admin' || role === 'mahalla_rais' || role === 'distributor'

  // Seed mahallaId + role from the user's membership (client state isn't persisted).
  const myMahallaQ = useMyMahallaQuery()
  useEffect(() => {
    const member = myMahallaQ.data?.data?.data
    if (member) {
      setMahallaId(member.mahalla_id)
      setRole(member.role)
    }
  }, [myMahallaQ.data, setMahallaId, setRole])

  // Live realtime patches for this mahalla.
  useGasRealtime(mahallaId)

  // Seed the store from REST: active session, then its detail + my status.
  const activeQ = useActiveGasSessionQuery({ mahallaId: mahallaId ?? 0 })
  useEffect(() => {
    if (activeQ.data) setSession(activeQ.data.data?.data ?? null)
  }, [activeQ.data, setSession])

  const sessionId = session?.id ?? 0
  const detailQ = useGasSessionQuery({ id: sessionId })
  useEffect(() => {
    if (detailQ.data) setDetail(detailQ.data.data?.data ?? null)
  }, [detailQ.data, setDetail])

  const myStatusQ = useMyGasStatusQuery({ id: sessionId })
  useEffect(() => {
    if (myStatusQ.data) setMyStatus(myStatusQ.data.data?.data ?? null)
  }, [myStatusQ.data, setMyStatus])

  const { mutate: confirmReceipt, isPending: confirming } = useConfirmGasReceiptMutation()

  const onConfirm = (received: boolean) => {
    if (!session || !myStatus) return
    confirmReceipt({ id: session.id, householdId: myStatus.household_id, data: { received } })
  }

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('gas.title')}</Text>
      {isManager ? (
        <TouchableOpacity
          onPress={() => router.push('/gas/manage' as Href)}
          hitSlop={10}
          style={styles.headerBtn}
        >
          <SlidersHorizontal size={20} color={colors.primaryColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  )

  // ── Empty states ──
  if (!mahallaId) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.subText }]}>{t('gas.no_mahalla')}</Text>
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

  if (!session) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.subText }]}>{t('gas.no_session')}</Text>
        </View>
      </ThemedView>
    )
  }

  const currentHouse: GasHouseholdRow | undefined = detail?.households.find(
    (h) => h.household_id === session.current_household_id,
  )
  const progressPct =
    session.total_count > 0 ? Math.min(100, (session.delivered_count / session.total_count) * 100) : 0

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Live banner */}
        {session.status === 'active' && (
          <View style={styles.banner}>
            <Text style={styles.bannerTop}>● {t('gas.now_distributing')}</Text>
            <Text style={styles.bannerLoc}>
              {currentHouse ? currentHouse.address_label : '—'}
            </Text>
            {myStatus?.houses_ahead != null && (
              <Text style={styles.bannerEta}>
                {t('gas.eta_houses', { count: myStatus.houses_ahead })}
              </Text>
            )}
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.barLabel}>
              {t('gas.progress', { done: session.delivered_count, total: session.total_count })}
            </Text>
          </View>
        )}

        {/* Your house */}
        {myStatus && (
          <View style={[styles.mine, { borderColor: colors.primaryColor, backgroundColor: colors.background }]}>
            <Text style={[styles.mineLabel, { color: colors.subText }]}>{t('gas.your_house')}</Text>
            <Text style={[styles.mineAddr, { color: colors.text }]}>{myStatus.address_label}</Text>
            <Text style={[styles.mineStatus, { color: colors.subText }]}>
              {t(statusLabelKey(myStatus.status))}
              {myStatus.status === 'pending' &&
                myStatus.houses_ahead != null &&
                ` · ${t('gas.eta_houses', { count: myStatus.houses_ahead })}`}
            </Text>
            <View style={styles.mineBtns}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primaryColor }]}
                onPress={() => onConfirm(true)}
                disabled={confirming}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>{t('gas.received')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnOutline, { borderColor: colors.borderColor }]}
                onPress={() => onConfirm(false)}
                disabled={confirming}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnOutlineText, { color: colors.text }]}>{t('gas.not_received')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Queue */}
        {!!detail?.households.length && (
          <>
            <Text style={[styles.queueLabel, { color: colors.subText }]}>{t('gas.queue')}</Text>
            {detail.households.map((h) => (
              <View
                key={h.household_id}
                style={[
                  styles.row,
                  { borderColor: colors.borderColor },
                  h.household_id === session.current_household_id && {
                    borderColor: colors.primaryColor,
                  },
                ]}
              >
                <Text style={[styles.rowNo, { color: colors.text }]}>{h.house_number}</Text>
                <Text style={[styles.rowAddr, { color: colors.subText }]} numberOfLines={1}>
                  {h.address_label}
                </Text>
                <Text style={[styles.rowStatus, { color: colors.subText }]}>
                  {t(statusLabelKey(h.status))}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
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
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  banner: { backgroundColor: '#E8663A', borderRadius: 16, padding: 14 },
  bannerTop: { color: '#fff', fontSize: 12, fontWeight: '600', opacity: 0.95 },
  bannerLoc: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6, letterSpacing: -0.3 },
  bannerEta: { color: '#fff', fontSize: 12, opacity: 0.92, marginTop: 2 },
  bar: { height: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.35)', marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#fff', borderRadius: 99 },
  barLabel: { color: '#fff', fontSize: 11, opacity: 0.9, marginTop: 4 },

  mine: { borderWidth: 1.5, borderRadius: 14, padding: 14 },
  mineLabel: { fontSize: 11 },
  mineAddr: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  mineStatus: { fontSize: 12, marginTop: 4 },
  mineBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnOutline: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  btnOutlineText: { fontSize: 13, fontWeight: '600' },

  queueLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4 },
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
  rowStatus: { fontSize: 11 },
})
