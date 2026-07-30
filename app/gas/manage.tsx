import {
  useActiveGasSessionQuery,
  useCompleteGasSessionMutation,
  useCreateGasSessionMutation,
  usePauseGasSessionMutation,
  useStartGasSessionMutation,
} from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useGasStore } from '@/modules/Gas/gas-store'
import type { GasSessionDto, GasSessionStatus } from '@/types'
import { parseApiError } from '@/utils/apiError'
import { AxiosResponse } from 'axios'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
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

// One-line: map a session status to its i18n label key.
const sessionStatusKey = (s: GasSessionStatus) =>
  `gas.session_${s}` as
    | 'gas.session_planned'
    | 'gas.session_active'
    | 'gas.session_paused'
    | 'gas.session_completed'
    | 'gas.session_cancelled'

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
  primaryBtn: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  outlineBtn: { height: 50, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  outlineBtnText: { fontSize: 15, fontWeight: '600' },
  sessionCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  sessionDate: { fontSize: 15, fontWeight: '700' },
  sessionStatus: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  lifecycle: { gap: 0 },
})
