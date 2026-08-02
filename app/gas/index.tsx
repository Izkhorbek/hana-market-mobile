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
import { parseApiError } from '@/utils/apiError'
import { type Href, router } from 'expo-router'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
  const cycleWarning = useGasStore((s) => s.cycleWarning)
  const clearCycleWarning = useGasStore((s) => s.clearCycleWarning)
  const reset = useGasStore((s) => s.reset)
  const isManager = role === 'mahalla_admin' || role === 'mahalla_rais' || role === 'distributor'

  // Seed mahallaId + role from the user's membership (client state isn't persisted).
  // Always refetch on entry so a re-visit never re-seeds from a stale 5m cache.
  const myMahallaQ = useMyMahallaQuery({ querySettings: { refetchOnMount: 'always' } })
  useEffect(() => {
    if (!myMahallaQ.isSuccess) return
    const member = myMahallaQ.data?.data?.data ?? null
    // Membership changed (different mahalla) or was lost → drop the previous
    // mahalla's session/detail/status so we never render another context's data.
    const storedMahallaId = useGasStore.getState().mahallaId
    if (!member || (storedMahallaId !== null && storedMahallaId !== member.mahalla_id)) {
      reset()
    }
    if (member) {
      setMahallaId(member.mahalla_id)
      setRole(member.role)
    }
  }, [myMahallaQ.isSuccess, myMahallaQ.data, setMahallaId, setRole, reset])

  // Live realtime patches for this mahalla.
  useGasRealtime(mahallaId)

  // Polling = a fallback for realtime (SignalR). The queue/position move only
  // during an ACTIVE run (fast); the "which session is current" query is polled
  // slower and ALWAYS while the screen is open — so a NEXT session created after
  // this one completes is still discovered without leaving the screen.
  const sessionActive = session?.status === 'active'

  // Seed the store from REST: active session, then its detail + my status.
  // refetchOnMount 'always' → re-entering the screen fetches the live state
  // instead of re-seeding the store from a still-fresh (≤5m) cached response.
  const activeQ = useActiveGasSessionQuery({
    mahallaId: mahallaId ?? 0,
    querySettings: { refetchOnMount: 'always', refetchInterval: mahallaId ? 30000 : false },
  })
  useEffect(() => {
    if (activeQ.data) setSession(activeQ.data.data?.data ?? null)
  }, [activeQ.data, setSession])

  const sessionId = session?.id ?? 0
  const detailQ = useGasSessionQuery({
    id: sessionId,
    querySettings: { refetchOnMount: 'always', refetchInterval: sessionActive ? 20000 : false },
  })
  useEffect(() => {
    if (detailQ.data) setDetail(detailQ.data.data?.data ?? null)
  }, [detailQ.data, setDetail])

  const myStatusQ = useMyGasStatusQuery({
    id: sessionId,
    querySettings: { refetchOnMount: 'always', refetchInterval: sessionActive ? 20000 : false },
  })
  useEffect(() => {
    if (myStatusQ.data) setMyStatus(myStatusQ.data.data?.data ?? null)
  }, [myStatusQ.data, setMyStatus])

  // Pull-to-refresh: force-refetch everything the screen shows (own spinner,
  // so the silent background polling above never flashes the refresh control).
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    // detail/my-status are keyed on a session id; skip them when there's none
    // (id 0 → the queries are disabled, but refetch() would still hit /sessions/0).
    await Promise.all([
      myMahallaQ.refetch(),
      activeQ.refetch(),
      ...(sessionId ? [detailQ.refetch(), myStatusQ.refetch()] : []),
    ])
    setRefreshing(false)
  }, [myMahallaQ, activeQ, detailQ, myStatusQ, sessionId])

  const { mutate: confirmReceipt, isPending: confirming } = useConfirmGasReceiptMutation()

  // MVP: a resident can only CONFIRM receipt ("Oldim"). Marking a house skipped
  // ("Uyda yo'q") is an admin/rais action — residents never see a skip button.
  // Optimistically reflect the confirmation, revert on failure.
  const doReceived = () => {
    if (!session || !myStatus) return
    const prev = myStatus
    setMyStatus({ ...myStatus, status: 'delivered', resident_confirmed: true })
    confirmReceipt(
      { id: session.id, householdId: myStatus.household_id, data: { received: true } },
      {
        onError: (e: any) => {
          setMyStatus(prev)
          Alert.alert(t('post.error'), parseApiError(e, t('post.error')))
        },
      },
    )
  }

  // Ask for an explicit confirmation before recording receipt.
  const onReceived = () => {
    if (!session || !myStatus) return
    Alert.alert(t('gas.confirm_title'), t('gas.confirm_received_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), onPress: doReceived },
    ])
  }

  // Uzbek "d-MMMM, yyyy" from a yyyy-MM-dd string (parsed manually to avoid TZ shift).
    const months = t('date_picker.months', { returnObjects: true }) as string[]
    const formatUzDate = (isoDate: string) => {
      const [y, m, d] = isoDate.split('-').map(Number)
      if (!y || !m || !d) return isoDate
      return `${d}-${months[m - 1] ?? m}, ${y}`
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

  // Realtime cycle-broken warning (dismissible), shown to every member.
  const CycleWarningBanner = cycleWarning ? (
    <View style={styles.warnBanner}>
      <View style={styles.warnBody}>
        <Text style={styles.warnTitle}>{t('gas.cycle_warning_title')}</Text>
        <Text style={styles.warnText}>
          {t('gas.cycle_warning_body', { count: cycleWarning.unserved_count })}
          {!!cycleWarning.reason && ` — ${cycleWarning.reason}`}
        </Text>
      </View>
      <TouchableOpacity onPress={clearCycleWarning} hitSlop={8} style={styles.warnClose}>
        <Text style={styles.warnCloseText}>✕</Text>
      </TouchableOpacity>
    </View>
  ) : null

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
        {CycleWarningBanner}
        {/* Scrollable so the resident can pull-to-refresh while waiting for a session. */}
        <ScrollView
          contentContainerStyle={styles.centerScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryColor}
              colors={[colors.primaryColor]}
            />
          }
        >
          <Text style={[styles.emptyText, { color: colors.subText }]}>{t('gas.no_session')}</Text>
        </ScrollView>
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
      {CycleWarningBanner}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryColor}
            colors={[colors.primaryColor]}
          />
        }
      >
        {/* Live banner */}
        {session.status === 'active' && (
          <View style={[styles.banner, { backgroundColor: colors.primaryColor }]}>
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

        {/* Planned banner — prominent upcoming date (Uzbek format) */}
        {(session.status === 'planned' || session.status === 'paused') && (
          <View style={styles.plannedBanner}>
            <Text style={styles.bannerTop}>● { session.status === 'planned' ? t('gas.planned_distribution') : t('gas.paused_distribution') }</Text>
            <Text style={styles.bannerLoc}>
              {session.scheduled_date ? formatUzDate(session.scheduled_date) : '—'}
              {!!session.scheduled_time && ` · ${session.scheduled_time}`}
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
            {myStatus.status === 'delivered' ? (
              <Text style={[styles.mineFinal, { color: colors.primaryColor }]}>
                {t('gas.received_confirmed')}
              </Text>
            ) : myStatus.status === 'skipped' ? (
              <Text style={[styles.mineFinal, { color: colors.subText }]}>
                {t('gas.skipped_note')}
              </Text>
            ) : myStatus.resident_confirmed ? (
              <Text style={[styles.mineFinal, { color: colors.subText }]}>
                {t('gas.answer_sent')}
              </Text>
            ) : session.status === 'active' ? (
              <TouchableOpacity
                style={[styles.btn, styles.btnFull, { backgroundColor: colors.primaryColor }]}
                onPress={onReceived}
                disabled={confirming}
                activeOpacity={0.85}
              >
                {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('gas.received')}</Text>}
              </TouchableOpacity>
            ) : session.status === 'planned' ? (
               <Text style={[styles.mineHint, { color: colors.subText }]}>
                 {t('gas.awaiting_start')}
              </Text>
            ) 
            : (
              <Text style={[styles.mineHint, { color: colors.subText }]}>
                {t('gas.awaiting_start')}
              </Text>
            )}
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
  centerScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#E6B0B0',
  },
  warnBody: { flex: 1 },
  warnTitle: { fontSize: 13, fontWeight: '700', color: '#B4232A' },
  warnText: { fontSize: 12, color: '#8A3B3B', marginTop: 2, lineHeight: 16 },
  warnClose: { paddingHorizontal: 4 },
  warnCloseText: { fontSize: 14, color: '#B4232A', fontWeight: '700' },

  banner: { backgroundColor: '#E8663A', borderRadius: 16, padding: 14 },
  bannerTop: { color: '#fff', fontSize: 12, fontWeight: '600', opacity: 0.95 },
  plannedBanner: { backgroundColor: '#F59E0B', borderRadius: 16, padding: 14, marginBottom: 12 },
  bannerLoc: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6, letterSpacing: -0.3 },
  bannerEta: { color: '#fff', fontSize: 12, opacity: 0.92, marginTop: 2 },
  bar: { height: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.35)', marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#fff', borderRadius: 99 },
  barLabel: { color: '#fff', fontSize: 11, opacity: 0.9, marginTop: 4 },

  mine: { borderWidth: 1.5, borderRadius: 14, padding: 14 },
  mineLabel: { fontSize: 11 },
  mineAddr: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  mineStatus: { fontSize: 12, marginTop: 4 },
  mineFinal: { fontSize: 13, fontWeight: '600', marginTop: 10 },
  mineHint: { fontSize: 11, marginTop: 8 },
  btn: { flex: 1, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnFull: { flex: 0, alignSelf: 'stretch', height: 46, marginTop: 12 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

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
