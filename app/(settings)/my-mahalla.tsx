import { useMyMahallaQuery } from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { MahallaRole } from '@/types'
import { type Href, router } from 'expo-router'
import { ArrowLeft, BadgeCheck, Clock, Home, MapPin, Users } from 'lucide-react-native'
import React from 'react'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// One-line: map a mahalla role to its i18n label key.
const roleLabelKey = (r: MahallaRole) =>
  ({
    resident: 'mahalla.role_resident',
    mahalla_admin: 'mahalla.role_mahalla_admin',
    distributor: 'mahalla.role_distributor',
    mahalla_rais: 'mahalla.role_mahalla_rais',
  })[r]

export default function MyMahallaScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const q = useMyMahallaQuery({ querySettings: { refetchOnMount: 'always' } })
  const member = q.data?.data?.data ?? null

  const openJoin = () => router.push('/mahalla/join' as Href)

  // Joining a DIFFERENT mahalla now MOVES the user (§9): role resets to resident
  // and re-verification is required. Warn elevated members before they switch.
  const goJoin = () => {
    const elevated = !!member && member.role !== 'resident'
    if (elevated) {
      Alert.alert(t('mahalla.switch_warning_title'), t('mahalla.switch_warning_message'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('mahalla.change_mahalla'), style: 'destructive', onPress: openJoin },
      ])
      return
    }
    openJoin()
  }

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('mahalla.my_mahalla_title')}</Text>
      <View style={styles.headerBtn} />
    </View>
  )

  if (q.isFetching && !q.data) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
      </ThemedView>
    )
  }

  // ── Not a member yet → prompt to select a mahalla ─────────────────────────
  if (!member) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.center}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryColor + '18' }]}>
            <MapPin size={40} color={colors.primaryColor} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('mahalla.not_joined_title')}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.subText }]}>
            {t('mahalla.not_joined_desc')}
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primaryColor }]}
            onPress={goJoin}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{t('mahalla.select_mahalla')}</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    )
  }

  // ── Member → show membership card ──────────────────────────────────────────
  const m = member.mahalla
  const locality = [m.district, m.region].filter(Boolean).join(', ')

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderColor }]}>
          <View style={[styles.iconBubble, { backgroundColor: colors.primaryColor + '18' }]}>
            <Users size={26} color={colors.primaryColor} strokeWidth={1.8} />
          </View>
          <Text style={[styles.mahallaName, { color: colors.text }]}>{m.name}</Text>
          {!!locality && (
            <Text style={[styles.locality, { color: colors.subText }]}>{locality}</Text>
          )}

          {/* Role */}
          <View style={[styles.infoRow, { borderTopColor: colors.borderColor }]}>
            <Text style={[styles.infoLabel, { color: colors.subText }]}>{t('mahalla.member_role')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {t(roleLabelKey(member.role))}
            </Text>
          </View>

          {/* Verification status */}
          <View style={[styles.infoRow, { borderTopColor: colors.borderColor }]}>
            <Text style={[styles.infoLabel, { color: colors.subText }]}>{t('mahalla.member_status')}</Text>
            <View style={styles.statusWrap}>
              {member.is_verified ? (
                <>
                  <BadgeCheck size={16} color={colors.primaryColor} />
                  <Text style={[styles.infoValue, { color: colors.primaryColor }]}>
                    {t('mahalla.verified')}
                  </Text>
                </>
              ) : (
                <>
                  <Clock size={16} color={colors.textMuted} />
                  <Text style={[styles.infoValue, { color: colors.textMuted }]}>
                    {t('mahalla.pending')}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Household — shown once the backend embeds it in /my. */}
        {member.household && (
          <View style={[styles.hhCard, { backgroundColor: colors.background, borderColor: colors.borderColor }]}>
            <View style={styles.hhHead}>
              <Home size={18} color={colors.primaryColor} />
              <Text style={[styles.hhTitle, { color: colors.text }]}>
                {t('mahalla.household_title')}
              </Text>
              {member.household.is_verified && (
                <BadgeCheck size={16} color={colors.primaryColor} style={styles.hhCheck} />
              )}
            </View>
            <View style={[styles.infoRow, { borderTopColor: colors.borderColor }]}>
              <Text style={[styles.infoLabel, { color: colors.subText }]}>
                {t('mahalla.house_number')}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {member.household.house_number}
              </Text>
            </View>
            {!!member.household.address_label && (
              <View style={[styles.infoRow, { borderTopColor: colors.borderColor }]}>
                <Text style={[styles.infoLabel, { color: colors.subText }]}>
                  {t('mahalla.address')}
                </Text>
                <Text style={[styles.infoValue, styles.hhAddr, { color: colors.text }]} numberOfLines={2}>
                  {member.household.address_label}
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: colors.borderColor }]}
          onPress={goJoin}
          activeOpacity={0.7}
        >
          <Text style={[styles.outlineBtnText, { color: colors.primaryColor }]}>
            {t('mahalla.change_mahalla')}
          </Text>
        </TouchableOpacity>
      </View>
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
  loader: { paddingVertical: 40 },
  content: { padding: 16, gap: 14 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mahallaName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  locality: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    marginTop: 14,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hhCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
  },
  hhHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hhTitle: { fontSize: 15, fontWeight: '700' },
  hhCheck: { marginLeft: 'auto' },
  hhAddr: { flex: 1, textAlign: 'right', marginLeft: 16 },
  outlineBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: 15, fontWeight: '600' },
  // Empty state
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  primaryBtn: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
