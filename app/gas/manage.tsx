import {
  useActiveGasSessionQuery,
  useCancelGasSessionMutation,
  useCompleteGasSessionMutation,
  useCreateGasSessionMutation,
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
import type { GasHouseholdRow, GasHouseholdStatus, GasSessionDto, GasSessionStatus } from '@/types'
import { parseApiError } from '@/utils/apiError'
import { AxiosResponse } from 'axios'
import { format } from 'date-fns'
import { type Href, router } from 'expo-router'
import { ArrowLeft, Check, History, X } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

/**
 * Gas distribution manager — SIMPLE model: just Sessions. Fairness (continue
 * from where it stopped + serve previously-skipped first) is handled by the
 * backend automatically when a new session is created — there is no "cycle" here.
 */
export default function GasManageScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const mahallaId = useGasStore((s) => s.mahallaId)
  const session = useGasStore((s) => s.session)
  const setSession = useGasStore((s) => s.setSession)
  const detail = useGasStore((s) => s.detail)
  const setDetail = useGasStore((s) => s.setDetail)

  const sessionActive = session?.status === 'active'

  // Live session (poll while the screen is open — interim realtime until SignalR).
  const activeQ = useActiveGasSessionQuery({
    mahallaId: mahallaId ?? 0,
    querySettings: { refetchOnMount: 'always', refetchInterval: mahallaId ? 30000 : false },
  })
  useEffect(() => {
    if (activeQ.data) setSession(activeQ.data.data?.data ?? null)
  }, [activeQ.data, setSession])

  const detailQ = useGasSessionQuery({
    id: session?.id ?? 0,
    querySettings: { refetchOnMount: 'always', refetchInterval: sessionActive ? 15000 : false },
  })
  useEffect(() => {
    if (detailQ.data) setDetail(detailQ.data.data?.data ?? null)
  }, [detailQ.data, setDetail])

  // Create-session form.
  const [dateVal, setDateVal] = useState<Date | undefined>(() => new Date())
  const [timeHour, setTimeHour] = useState<number | null>(null)
  const [timeMinute, setTimeMinute] = useState(0)
  const [note, setNote] = useState('')

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

  // Uzbek "d-MMMM, yyyy" from a yyyy-MM-dd string (parsed manually to avoid TZ shift).
  const months = t('date_picker.months', { returnObjects: true }) as string[]
  const formatUzDate = (isoDate: string) => {
    const [y, m, d] = isoDate.split('-').map(Number)
    if (!y || !m || !d) return isoDate
    return `${d}-${months[m - 1] ?? m}, ${y}`
  }

  // Any lifecycle/create success returns the fresh session; mirror it into the store.
  const applyResult = (res: AxiosResponse<{ data?: GasSessionDto }>) => {
    const s = res.data?.data
    if (s) setSession(s)
  }
  const onError = (e: any) => Alert.alert(t('post.error'), parseApiError(e, t('post.error')))

  const { mutate: createSession, isPending: creating } = useCreateGasSessionMutation({ onSuccess: applyResult, onError })
  const { mutate: startSession, isPending: starting } = useStartGasSessionMutation({ onSuccess: applyResult, onError })
  const { mutate: pauseSession, isPending: pausing } = usePauseGasSessionMutation({ onSuccess: applyResult, onError })
  const { mutate: completeSession, isPending: completing } = useCompleteGasSessionMutation({ onSuccess: applyResult, onError })
  const { mutate: cancelSession, isPending: cancelling } = useCancelGasSessionMutation({
    onSuccess: () => setSession(null),
    onError,
  })
  const { mutate: markStatus, isPending: marking } = useUpdateGasHouseholdStatusMutation({ onError })
  const { mutate: setPosition } = useUpdateGasPositionMutation({ onError })

  const busy = creating || starting || pausing || completing || cancelling

  // Create a session from the picked date/time.
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

  // Cancel the current (planned/paused) session.
  const onCancelSession = () => {
    if (!session) return
    Alert.alert(t('gas.confirm_title'), t('gas.confirm_cancel_session_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => cancelSession(session.id) },
    ])
  }

  // Mark a household delivered/skipped; if it's the current one, advance the position.
  const markHousehold = (householdId: number, status: 'delivered' | 'skipped') => {
    if (!session) return
    markStatus({ id: session.id, householdId, data: { status } })
    if (householdId === session.current_household_id) {
      const next = nextPendingId(detail?.households ?? [], householdId)
      if (next != null) setPosition({ id: session.id, data: { current_household_id: next } })
    }
  }

  // Confirm before marking a house skipped (it affects fairness/next turn).
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

  const inputStyle = [styles.input, { borderColor: colors.borderColor, color: colors.text }]

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
      <TouchableOpacity onPress={() => router.push('/gas/history' as Href)} hitSlop={10} style={styles.headerBtn}>
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
        {!session ? (
          // ── No session: open one ──
          <View style={styles.block}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>{t('gas.create_session')}</Text>

            <Text style={[styles.label, { color: colors.subText }]}>{t('gas.date')}</Text>
            <View style={styles.chipRow}>
              <Chip label={t('gas.today')} selected={isSameDay(dateVal, startOfToday)} onPress={() => setDateVal(startOfToday)} />
              <Chip label={t('gas.tomorrow')} selected={isSameDay(dateVal, tomorrow)} onPress={() => setDateVal(tomorrow)} />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourRow} keyboardShouldPersistTaps="handled">
              {HOURS.map((h) => (
                <Chip key={h} label={pad2(h)} selected={timeHour === h} onPress={() => setTimeHour(timeHour === h ? null : h)} />
              ))}
            </ScrollView>
            {timeHour != null && (
              <View style={styles.chipRow}>
                {MINUTES.map((m) => (
                  <Chip key={m} label={`:${pad2(m)}`} selected={timeMinute === m} onPress={() => setTimeMinute(m)} />
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
          // ── Session exists: banner + lifecycle + runner ──
          <View style={styles.block}>
            {session.status === 'planned' ? (
              <View style={styles.plannedBanner}>
                <Text style={styles.bannerTop}>● {t('gas.planned_distribution')}</Text>
                <Text style={styles.bannerLoc}>
                  {session.scheduled_date ? formatUzDate(session.scheduled_date) : '—'}
                  {!!session.scheduled_time && ` · ${session.scheduled_time}`}
                </Text>
              </View>
            ) : (
              <Text style={[styles.statusLine, { color: colors.text }]}>
                {session.scheduled_date}
                {!!session.scheduled_time && ` · ${session.scheduled_time}`}
                {`  ·  ${t(sessionStatusKey(session.status))}`}
              </Text>
            )}

            <View style={styles.lifecycle}>
              {(session.status === 'planned' || session.status === 'paused') && (
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primaryColor, opacity: busy ? 0.6 : 1 }]} onPress={() => startSession(session.id)} disabled={busy} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>{session.status === 'paused' ? t('gas.resume') : t('gas.start')}</Text>
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
              {(session.status === 'planned' || session.status === 'paused') && (
                <TouchableOpacity style={[styles.outlineBtn, { borderColor: '#E6B0B0' }]} onPress={onCancelSession} disabled={busy} activeOpacity={0.85}>
                  <Text style={[styles.outlineBtnText, { color: '#B4232A' }]}>{t('gas.cancel_session')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Live queue + runner controls */}
            {(session.status === 'active' || session.status === 'paused') && !!detail?.households.length && (
              <View style={styles.queueBlock}>
                <Text style={[styles.queueLabel, { color: colors.subText }]}>{t('gas.queue')}</Text>
                <Text style={[styles.queueHint, { color: colors.subText }]}>{t('gas.fairness_note')}</Text>
                {detail.households.map((h) => {
                  const isCurrent = h.household_id === session.current_household_id
                  const actionable = session.status === 'active' && (h.status === 'pending' || h.status === 'current')
                  return (
                    <View key={h.household_id} style={[styles.row, { borderColor: isCurrent ? colors.primaryColor : colors.borderColor }]}>
                      <TouchableOpacity style={styles.rowMain} onPress={() => setCurrent(h.household_id)} activeOpacity={0.7}>
                        <Text style={[styles.rowNo, { color: colors.text }]}>{h.house_number}</Text>
                        <Text style={[styles.rowAddr, { color: colors.subText }]} numberOfLines={1}>{h.address_label}</Text>
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
                        <Text style={[styles.rowStatus, { color: colors.subText }]}>{t(householdStatusKey(h.status))}</Text>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>
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
  plannedBanner: { backgroundColor: '#F59E0B', borderRadius: 16, padding: 14, marginBottom: 4 },
  bannerTop: { color: '#fff', fontSize: 12, fontWeight: '600', opacity: 0.95 },
  bannerLoc: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6, letterSpacing: -0.3 },
  statusLine: { fontSize: 15, fontWeight: '700' },
  lifecycle: { gap: 0 },
  queueBlock: { marginTop: 20, gap: 7 },
  queueLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  queueHint: { fontSize: 11, marginBottom: 2 },
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
  rowActions: { flexDirection: 'row', gap: 6 },
  rowActBtn: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  rowActSkip: { borderWidth: 1 },
})
