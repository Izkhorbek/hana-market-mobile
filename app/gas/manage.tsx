import {
  useActiveGasSessionQuery,
  useCompleteGasSessionMutation,
  useCreateGasCycleMutation,
  useCreateGasSessionMutation,
  useCurrentGasCycleQuery,
  useGasSessionQuery,
  usePauseGasSessionMutation,
  useStartGasSessionMutation,
  useUpdateGasHouseholdStatusMutation,
  useUpdateGasPositionMutation,
} from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { DatePicker } from '@/components/ui/date-picker'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useGasStore } from '@/modules/Gas/gas-store'
import type {
  GasHouseholdRow,
  GasHouseholdStatus,
  GasSessionDto,
  GasSessionStatus,
} from '@/types'
import { parseApiError } from '@/utils/apiError'
import { AxiosResponse } from 'axios'
import { format } from 'date-fns'
import { type Href, router } from 'expo-router'
import { ArrowLeft, Check, History, X } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

// Session time options — tap-based (no scroll wheel). Daytime gas-delivery window.
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 06:00–22:00
const MINUTES = [0, 15, 30, 45]
const pad2 = (n: number) => String(n).padStart(2, '0')

// One-line: true when two dates fall on the same calendar day.
const isSameDay = (a?: Date, b?: Date) =>
  !!a && !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

// One-line: map a session status to its i18n label key.
const sessionStatusKey = (s: GasSessionStatus) =>
  `gas.session_${s}` as
    | 'gas.session_planned'
    | 'gas.session_active'
    | 'gas.session_paused'
    | 'gas.session_completed'
    | 'gas.session_cancelled'

// One-line: map a household status to its i18n label key.
const householdStatusKey = (s: GasHouseholdStatus) =>
  ({
    pending: 'gas.status_pending',
    current: 'gas.status_current',
    delivered: 'gas.status_delivered',
    skipped: 'gas.status_skipped',
  })[s]

// One-line: id of the next 'pending' household after the current one (wraps to first).
const nextPendingId = (households: GasHouseholdRow[], currentId: number | null): number | null => {
  const startIdx =
    currentId != null ? households.findIndex((h) => h.household_id === currentId) : -1
  for (let i = startIdx + 1; i < households.length; i++) {
    if (households[i].status === 'pending') return households[i].household_id
  }
  // Wrap fallback — exclude the current house so a stale-local 'pending' can't loop back.
  return households.find((h) => h.status === 'pending' && h.household_id !== currentId)?.household_id ?? null
}

export default function GasManageScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const mahallaId = useGasStore((s) => s.mahallaId)
  const session = useGasStore((s) => s.session)
  const setSession = useGasStore((s) => s.setSession)

  // Interim realtime (SignalR pending): poll while the runner screen is open so a
  // concurrent change (another admin, or a resident's "Oldim") isn't acted on stale.
  const sessionActive = session?.status === 'active'

  // refetchOnMount 'always' → re-entering refetches live state, not a ≤5m cache.
  const activeQ = useActiveGasSessionQuery({
    mahallaId: mahallaId ?? 0,
    querySettings: { refetchOnMount: 'always', refetchInterval: mahallaId ? 30000 : false },
  })
  useEffect(() => {
    if (activeQ.data) setSession(activeQ.data.data?.data ?? null)
  }, [activeQ.data, setSession])

  // Create-session form (defaults date to today; street order is left to the backend for MVP).
  const [dateVal, setDateVal] = useState<Date | undefined>(() => new Date())
  const [timeHour, setTimeHour] = useState<number | null>(null)
  const [timeMinute, setTimeMinute] = useState(0)
  const [note, setNote] = useState('')

  // Earliest selectable date = start of today; quick "today/tomorrow" chips use these.
  const startOfToday = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 1)
    return d
  }, [])

  // Any lifecycle/create success returns the fresh session; mirror it into the store.
  const applyResult = (res: AxiosResponse<{ data?: GasSessionDto }>) => {
    const s = res.data?.data
    if (s) setSession(s)
  }
  const onError = (e: any) => Alert.alert(t('post.error'), parseApiError(e, t('post.error')))

  const { mutate: createSession, isPending: creating } = useCreateGasSessionMutation({
    onSuccess: applyResult,
    onError,
  })
  const { mutate: startSession, isPending: starting } = useStartGasSessionMutation({
    onSuccess: applyResult,
    onError,
  })
  const { mutate: pauseSession, isPending: pausing } = usePauseGasSessionMutation({
    onSuccess: applyResult,
    onError,
  })
  const { mutate: completeSession, isPending: completing } = useCompleteGasSessionMutation({
    onSuccess: applyResult,
    onError,
  })

  // ── Davr (fairness) ──
  const cycle = useGasStore((s) => s.cycle)
  const setCycle = useGasStore((s) => s.setCycle)
  const cycleQ = useCurrentGasCycleQuery({
    mahallaId: mahallaId ?? 0,
    querySettings: { refetchOnMount: 'always' },
  })
  useEffect(() => {
    if (cycleQ.data) setCycle(cycleQ.data.data?.data ?? null)
  }, [cycleQ.data, setCycle])

  const [overrideOpen, setOverrideOpen] = useState(false)
  const [reason, setReason] = useState('')
  const { mutate: createCycle, isPending: cycleBusy } = useCreateGasCycleMutation()

  // New cycle: try normally; a 409 (current cycle unfinished) opens the override modal.
  const onNewCycle = () => {
    if (!mahallaId) return
    createCycle(
      { data: { mahalla_id: mahallaId }, force: false },
      {
        onError: (e: any) => {
          if (e?.response?.status === 409) setOverrideOpen(true)
          else onError(e)
        },
      },
    )
  }

  // Force a new cycle (breaks the current one) — needs a reason; warns all members.
  const onForceCycle = () => {
    if (!mahallaId || !reason.trim()) return
    createCycle(
      { data: { mahalla_id: mahallaId, reason: reason.trim() }, force: true },
      {
        onSuccess: () => {
          setOverrideOpen(false)
          setReason('')
        },
        onError,
      },
    )
  }

  // Live queue (households) for the running session.
  const detail = useGasStore((s) => s.detail)
  const setDetail = useGasStore((s) => s.setDetail)
  const detailQ = useGasSessionQuery({
    id: session?.id ?? 0,
    querySettings: { refetchOnMount: 'always', refetchInterval: sessionActive ? 15000 : false },
  })
  useEffect(() => {
    if (detailQ.data) setDetail(detailQ.data.data?.data ?? null)
  }, [detailQ.data, setDetail])

  const { mutate: markStatus, isPending: marking } = useUpdateGasHouseholdStatusMutation({ onError })
  const { mutate: setPosition } = useUpdateGasPositionMutation({ onError })

  // Mark ANY household delivered/skipped from its own row. If it's the current
  // one, advance the live position to the next pending house.
  const markHousehold = (householdId: number, status: 'delivered' | 'skipped') => {
    if (!session) return
    markStatus({ id: session.id, householdId, data: { status } })
    if (householdId === session.current_household_id) {
      const next = nextPendingId(detail?.households ?? [], householdId)
      if (next != null) setPosition({ id: session.id, data: { current_household_id: next } })
    }
  }

  // Skipping affects fairness (miss_count) — confirm before marking a house skipped.
  const confirmSkipHousehold = (householdId: number) => {
    Alert.alert(t('gas.confirm_title'), t('gas.confirm_skipped_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), onPress: () => markHousehold(householdId, 'skipped') },
    ])
  }

  // Jump the live position to a specific household.
  const setCurrent = (householdId: number) => {
    if (!session) return
    setPosition({ id: session.id, data: { current_household_id: householdId } })
  }

  const busy = creating || starting || pausing || completing

  // Format the picked dates into the agreed backend contract (date: yyyy-MM-dd, time: HH:mm).
  const onCreate = () => {
    if (!mahallaId || !dateVal) return
    createSession({
      mahalla_id: mahallaId,
      scheduled_date: format(dateVal, 'yyyy-MM-dd'),
      scheduled_time: timeHour != null ? `${pad2(timeHour)}:${pad2(timeMinute)}` : undefined,
      street_order: [],
      note: note.trim() || undefined,
    })
  }

  const inputStyle = [styles.input, { borderColor: colors.borderColor, color: colors.text }]

  // One-line: a small selectable pill used for date shortcuts + hour/minute slots.
  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        { borderColor: colors.borderColor },
        selected && { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? '#fff' : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  )

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('gas.manage_title')}</Text>
      <TouchableOpacity
        onPress={() => router.push('/gas/history' as Href)}
        hitSlop={10}
        style={styles.headerBtn}
      >
        <History size={20} color={colors.primaryColor} />
      </TouchableOpacity>
    </View>
  )

  if (!mahallaId) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.center}>
          <Text style={[styles.muted, { color: colors.subText }]}>{t('gas.no_mahalla')}</Text>
        </View>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ── Davr (fairness) ── */}
        <View style={[styles.cycleCard, { borderColor: colors.borderColor }]}>
          <Text style={[styles.cycleTitle, { color: colors.text }]}>
            {cycle ? t('gas.cycle_n', { n: cycle.cycle_number }) : t('gas.cycle')}
          </Text>
          {cycle ? (
            <>
              <View style={[styles.cycleBar, { backgroundColor: colors.borderColor }]}>
                <View
                  style={[
                    styles.cycleBarFill,
                    {
                      backgroundColor: colors.primaryColor,
                      width: `${
                        cycle.total_count > 0
                          ? Math.min(100, ((cycle.delivered_count + cycle.skipped_count) / cycle.total_count) * 100)
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.cycleMeta, { color: colors.subText }]}>
                {cycle.delivered_count + cycle.skipped_count} / {cycle.total_count}
                {`  ·  ${t('gas.status_delivered')}: ${cycle.delivered_count}`}
                {`  ·  ${t('gas.status_skipped')}: ${cycle.skipped_count}`}
              </Text>
            </>
          ) : (
            <Text style={[styles.cycleMeta, { color: colors.subText }]}>{t('gas.no_cycle')}</Text>
          )}
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.borderColor, marginTop: 12 }]}
            onPress={onNewCycle}
            disabled={cycleBusy}
            activeOpacity={0.85}
          >
            <Text style={[styles.outlineBtnText, { color: colors.text }]}>{t('gas.new_cycle')}</Text>
          </TouchableOpacity>
        </View>

        {!session ? (
          // ── No session: create one ──
          <View style={styles.block}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>{t('gas.create_session')}</Text>

            <Text style={[styles.label, { color: colors.subText }]}>{t('gas.date')}</Text>
            <View style={styles.chipRow}>
              <Chip
                label={t('gas.today')}
                selected={isSameDay(dateVal, startOfToday)}
                onPress={() => setDateVal(startOfToday)}
              />
              <Chip
                label={t('gas.tomorrow')}
                selected={isSameDay(dateVal, tomorrow)}
                onPress={() => setDateVal(tomorrow)}
              />
            </View>
            <DatePicker
              mode="date"
              value={dateVal}
              onChange={setDateVal}
              minimumDate={startOfToday}
              placeholder={t('gas.date_placeholder')}
              style={styles.picker}
            />

            <Text style={[styles.label, { color: colors.subText }]}>{t('gas.time')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourRow}
              keyboardShouldPersistTaps="handled"
            >
              {HOURS.map((h) => (
                <Chip
                  key={h}
                  label={pad2(h)}
                  selected={timeHour === h}
                  onPress={() => setTimeHour(timeHour === h ? null : h)}
                />
              ))}
            </ScrollView>
            {timeHour != null && (
              <View style={styles.chipRow}>
                {MINUTES.map((m) => (
                  <Chip
                    key={m}
                    label={`:${pad2(m)}`}
                    selected={timeMinute === m}
                    onPress={() => setTimeMinute(m)}
                  />
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: colors.subText }]}>{t('gas.note')}</Text>
            <TextInput style={inputStyle} value={note} onChangeText={setNote} placeholderTextColor={colors.subText} />

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primaryColor, opacity: busy ? 0.6 : 1 }]}
              onPress={onCreate}
              disabled={busy}
              activeOpacity={0.85}
            >
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t('gas.create_session')}</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          // ── Session exists: lifecycle controls ──
          <View style={styles.block}>
            <View style={[styles.sessionCard, { borderColor: colors.borderColor }]}>
              <Text style={[styles.sessionDate, { color: colors.text }]}>
                {session.scheduled_date}
                {!!session.scheduled_time && ` · ${session.scheduled_time}`}
              </Text>
              <Text style={[styles.sessionStatus, { color: colors.primaryColor }]}>
                {t(sessionStatusKey(session.status))}
              </Text>
            </View>

            <View style={styles.lifecycle}>
              {session.status === 'planned' && (
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primaryColor, opacity: busy ? 0.6 : 1 }]} onPress={() => startSession(session.id)} disabled={busy} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>{t('gas.start')}</Text>
                </TouchableOpacity>
              )}
              {session.status === 'paused' && (
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primaryColor, opacity: busy ? 0.6 : 1 }]} onPress={() => startSession(session.id)} disabled={busy} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>{t('gas.resume')}</Text>
                </TouchableOpacity>
              )}
              {session.status === 'active' && (
                <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.borderColor }]} onPress={() => pauseSession(session.id)} disabled={busy} activeOpacity={0.85}>
                  <Text style={[styles.outlineBtnText, { color: colors.text }]}>{t('gas.pause')}</Text>
                </TouchableOpacity>
              )}
              {(session.status === 'active' || session.status === 'paused') && (
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primaryColor, opacity: busy ? 0.6 : 1 }]} onPress={() => completeSession(session.id)} disabled={busy} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>{t('gas.complete')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Live queue + runner controls */}
            {(session.status === 'active' || session.status === 'paused') &&
              !!detail?.households.length && (
                <View style={styles.queueBlock}>
                  <Text style={[styles.queueLabel, { color: colors.subText }]}>{t('gas.queue')}</Text>
                  <Text style={[styles.queueHint, { color: colors.subText }]}>{t('gas.queue_hint')}</Text>
                  {detail.households.map((h) => {
                    const isCurrent = h.household_id === session.current_household_id
                    const actionable =
                      session.status === 'active' && (h.status === 'pending' || h.status === 'current')
                    return (
                      <View
                        key={h.household_id}
                        style={[
                          styles.row,
                          { borderColor: isCurrent ? colors.primaryColor : colors.borderColor },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.rowMain}
                          onPress={() => setCurrent(h.household_id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rowNo, { color: colors.text }]}>{h.house_number}</Text>
                          <Text style={[styles.rowAddr, { color: colors.subText }]} numberOfLines={1}>
                            {h.address_label}
                          </Text>
                        </TouchableOpacity>
                        {actionable ? (
                          <View style={styles.rowActions}>
                            <TouchableOpacity
                              onPress={() => markHousehold(h.household_id, 'delivered')}
                              disabled={marking}
                              hitSlop={6}
                              activeOpacity={0.85}
                              style={[styles.rowActBtn, { backgroundColor: colors.primaryColor }]}
                            >
                              <Check size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => confirmSkipHousehold(h.household_id)}
                              disabled={marking}
                              hitSlop={6}
                              activeOpacity={0.85}
                              style={[styles.rowActBtn, styles.rowActSkip, { borderColor: colors.borderColor }]}
                            >
                              <X size={16} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={[styles.rowStatus, { color: colors.subText }]}>
                            {t(householdStatusKey(h.status))}
                          </Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
          </View>
        )}
      </ScrollView>

      {/* Override — force a new cycle (breaks the current one) */}
      <Modal
        visible={overrideOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOverrideOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('gas.cycle_blocked_title')}</Text>
            <Text style={[styles.modalMsg, { color: colors.subText }]}>{t('gas.cycle_blocked_msg')}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.borderColor, color: colors.text, marginTop: 12 }]}
              value={reason}
              onChangeText={setReason}
              placeholder={t('gas.override_reason_placeholder')}
              placeholderTextColor={colors.subText}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: colors.borderColor, flex: 1, marginTop: 0 }]}
                onPress={() => {
                  setOverrideOpen(false)
                  setReason('')
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.outlineBtnText, { color: colors.text }]}>{t('gas.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: '#D45B5B', flex: 1, marginTop: 0, opacity: !reason.trim() || cycleBusy ? 0.5 : 1 },
                ]}
                onPress={onForceCycle}
                disabled={!reason.trim() || cycleBusy}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{t('gas.force_start')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { fontSize: 14, textAlign: 'center' },
  block: { gap: 8 },
  blockTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '500', marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  picker: { marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  hourRow: { flexDirection: 'row', gap: 8, marginTop: 6, paddingRight: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, minWidth: 46, alignItems: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  primaryBtn: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  outlineBtn: { height: 50, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  outlineBtnText: { fontSize: 15, fontWeight: '600' },
  sessionCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  sessionDate: { fontSize: 15, fontWeight: '700' },
  sessionStatus: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  lifecycle: { gap: 0 },
  queueBlock: { marginTop: 20, gap: 7 },
  queueLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowNo: { fontSize: 14, fontWeight: '700', minWidth: 36 },
  rowAddr: { flex: 1, fontSize: 12 },
  rowStatus: { fontSize: 11 },
  queueHint: { fontSize: 11, marginBottom: 2 },
  rowActions: { flexDirection: 'row', gap: 6 },
  rowActBtn: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  rowActSkip: { borderWidth: 1 },
  cycleCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 },
  cycleTitle: { fontSize: 16, fontWeight: '700' },
  cycleBar: { height: 8, borderRadius: 99, marginTop: 10, overflow: 'hidden' },
  cycleBarFill: { height: '100%', borderRadius: 99 },
  cycleMeta: { fontSize: 12, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderRadius: 16, padding: 18 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalMsg: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
})
