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
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useGasStore } from '@/modules/Gas/gas-store'
import type { GasHouseholdRow, GasHouseholdStatus, GasSessionDto, GasSessionStatus } from '@/types'
import { parseApiError } from '@/utils/apiError'
import { AxiosResponse } from 'axios'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
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
  return households.find((h) => h.status === 'pending')?.household_id ?? null
}

export default function GasManageScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const mahallaId = useGasStore((s) => s.mahallaId)
  const session = useGasStore((s) => s.session)
  const setSession = useGasStore((s) => s.setSession)

  const activeQ = useActiveGasSessionQuery({ mahallaId: mahallaId ?? 0 })
  useEffect(() => {
    if (activeQ.data) setSession(activeQ.data.data?.data ?? null)
  }, [activeQ.data, setSession])

  // Create-session form (defaults date to today; street order is left to the backend for MVP).
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')

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

  // ── Cikl (fairness) ──
  const cycle = useGasStore((s) => s.cycle)
  const setCycle = useGasStore((s) => s.setCycle)
  const cycleQ = useCurrentGasCycleQuery({ mahallaId: mahallaId ?? 0 })
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
  const detailQ = useGasSessionQuery({ id: session?.id ?? 0 })
  useEffect(() => {
    if (detailQ.data) setDetail(detailQ.data.data?.data ?? null)
  }, [detailQ.data, setDetail])

  const { mutate: markStatus, isPending: marking } = useUpdateGasHouseholdStatusMutation({ onError })
  const { mutate: setPosition } = useUpdateGasPositionMutation({ onError })

  // Mark the current household delivered/skipped, then advance to the next pending one.
  const advance = (status: 'delivered' | 'skipped') => {
    if (!session || session.current_household_id == null) return
    const currentId = session.current_household_id
    markStatus({ id: session.id, householdId: currentId, data: { status } })
    const next = nextPendingId(detail?.households ?? [], currentId)
    if (next != null) setPosition({ id: session.id, data: { current_household_id: next } })
  }

  // Jump the live position to a specific household.
  const setCurrent = (householdId: number) => {
    if (!session) return
    setPosition({ id: session.id, data: { current_household_id: householdId } })
  }

  const busy = creating || starting || pausing || completing

  const onCreate = () => {
    if (!mahallaId || !date.trim()) return
    createSession({
      mahalla_id: mahallaId,
      scheduled_date: date.trim(),
      scheduled_time: time.trim() || undefined,
      street_order: [],
      note: note.trim() || undefined,
    })
  }

  const inputStyle = [styles.input, { borderColor: colors.borderColor, color: colors.text }]

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('gas.manage_title')}</Text>
      <View style={styles.headerBtn} />
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
        {/* ── Cikl (fairness) ── */}
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
            <TextInput style={inputStyle} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.subText} />

            <Text style={[styles.label, { color: colors.subText }]}>{t('gas.time')}</Text>
            <TextInput style={inputStyle} value={time} onChangeText={setTime} placeholder="14:00" placeholderTextColor={colors.subText} />

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
                  {detail.households.map((h) => {
                    const isCurrent = h.household_id === session.current_household_id
                    return (
                      <TouchableOpacity
                        key={h.household_id}
                        onPress={() => setCurrent(h.household_id)}
                        activeOpacity={0.7}
                        style={[
                          styles.row,
                          { borderColor: isCurrent ? colors.primaryColor : colors.borderColor },
                        ]}
                      >
                        <Text style={[styles.rowNo, { color: colors.text }]}>{h.house_number}</Text>
                        <Text style={[styles.rowAddr, { color: colors.subText }]} numberOfLines={1}>
                          {h.address_label}
                        </Text>
                        <Text style={[styles.rowStatus, { color: colors.subText }]}>
                          {t(householdStatusKey(h.status))}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}

                  {session.status === 'active' && session.current_household_id != null && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionPrimary, { backgroundColor: colors.primaryColor, opacity: marking ? 0.6 : 1 }]}
                        onPress={() => advance('delivered')}
                        disabled={marking}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.primaryBtnText}>{t('gas.deliver_next')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionOutline, { borderColor: colors.borderColor }]}
                        onPress={() => advance('skipped')}
                        disabled={marking}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.outlineBtnText, { color: colors.text }]}>{t('gas.mark_skipped')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  rowNo: { fontSize: 14, fontWeight: '700', minWidth: 36 },
  rowAddr: { flex: 1, fontSize: 12 },
  rowStatus: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionPrimary: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionOutline: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
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
