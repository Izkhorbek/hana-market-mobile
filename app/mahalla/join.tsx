import { useJoinMahallaMutation, useMahallaListQuery } from '@/api/hooks'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useGasStore } from '@/modules/Gas/gas-store'
import type { MahallaDto } from '@/types'
import { parseApiError } from '@/utils/apiError'
import { router } from 'expo-router'
import { ArrowLeft, Check } from 'lucide-react-native'
import React, { useState } from 'react'
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

export default function MahallaJoinScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const setMahallaId = useGasStore((s) => s.setMahallaId)

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MahallaDto | null>(null)
  const [houseNumber, setHouseNumber] = useState('')
  const [street, setStreet] = useState('')

  const trimmed = search.trim()
  const listQ = useMahallaListQuery({
    params: { search: trimmed },
    querySettings: { enabled: trimmed.length >= 2 },
  })
  const results: MahallaDto[] = listQ.data?.data?.data ?? []

  // Join, then seed the gas store's mahallaId so hyperlocal features light up.
  const { mutate: join, isPending } = useJoinMahallaMutation({
    onSuccess: (res) => {
      const member = res.data?.data
      if (member) setMahallaId(member.mahalla_id)
      router.back()
    },
    onError: (e: any) => Alert.alert(t('post.error'), parseApiError(e, t('post.error'))),
  })

  const canJoin = !!selected && houseNumber.trim().length > 0

  const onJoin = () => {
    if (!selected || !houseNumber.trim()) return
    join({
      mahalla_id: selected.id,
      house_number: houseNumber.trim(),
      street_name: street.trim() || undefined,
    })
  }

  const inputStyle = [styles.input, { borderColor: colors.borderColor, color: colors.text }]

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('mahalla.join_title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidWrapper style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            style={inputStyle}
            value={search}
            onChangeText={setSearch}
            placeholder={t('mahalla.search_placeholder')}
            placeholderTextColor={colors.subText}
          />

          {listQ.isFetching && trimmed.length >= 2 && (
            <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
          )}

          {trimmed.length >= 2 && !listQ.isFetching && results.length === 0 && (
            <Text style={[styles.noResults, { color: colors.subText }]}>{t('mahalla.no_results')}</Text>
          )}

          {results.map((m) => {
            const isSel = selected?.id === m.id
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.row,
                  { borderColor: isSel ? colors.primaryColor : colors.borderColor },
                ]}
                onPress={() => setSelected(m)}
                activeOpacity={0.7}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.rowName, { color: colors.text }]}>{m.name}</Text>
                  <Text style={[styles.rowSub, { color: colors.subText }]}>
                    {m.district}, {m.region}
                  </Text>
                </View>
                {isSel && <Check size={18} color={colors.primaryColor} />}
              </TouchableOpacity>
            )
          })}

          {selected && (
            <View style={styles.houseBlock}>
              <Text style={[styles.label, { color: colors.subText }]}>{t('mahalla.house_number')}</Text>
              <TextInput
                style={inputStyle}
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder={t('mahalla.house_number_placeholder')}
                placeholderTextColor={colors.subText}
              />
              <Text style={[styles.label, { color: colors.subText }]}>{t('mahalla.street')}</Text>
              <TextInput
                style={inputStyle}
                value={street}
                onChangeText={setStreet}
                placeholder={t('mahalla.street_placeholder')}
                placeholderTextColor={colors.subText}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.joinBtn,
              { backgroundColor: colors.primaryColor, opacity: canJoin && !isPending ? 1 : 0.5 },
            ]}
            onPress={onJoin}
            disabled={!canJoin || isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>{t('mahalla.join_button')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidWrapper>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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
  content: { padding: 16, gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  loader: { paddingVertical: 16 },
  noResults: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowText: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  houseBlock: { marginTop: 8, gap: 6 },
  label: { fontSize: 13, fontWeight: '500', marginTop: 6 },
  footer: { paddingHorizontal: 16, paddingVertical: 12 },
  joinBtn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
