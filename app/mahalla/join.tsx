import {
  useDistrictsQuery,
  useJoinMahallaMutation,
  useMahallaListQuery,
  useRegionsQuery,
} from '@/api/hooks'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useGasStore } from '@/modules/Gas/gas-store'
import type { DistrictDto, MahallaDto, RegionDto } from '@/types'
import { parseApiError } from '@/utils/apiError'
import { router } from 'expo-router'
import { ArrowLeft, Check, ChevronRight } from 'lucide-react-native'
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

type Step = 'region' | 'district' | 'mahalla'

export default function MahallaJoinScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const setMahallaId = useGasStore((s) => s.setMahallaId)

  const [step, setStep] = useState<Step>('region')
  const [region, setRegion] = useState<RegionDto | null>(null)
  const [district, setDistrict] = useState<DistrictDto | null>(null)
  const [selected, setSelected] = useState<MahallaDto | null>(null)
  const [search, setSearch] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [street, setStreet] = useState('')

  // Cascade queries — each enabled only once its parent is chosen.
  const regionsQ = useRegionsQuery()
  const regions: RegionDto[] = regionsQ.data?.data?.data ?? []

  const districtsQ = useDistrictsQuery({ regionId: region?.id ?? 0 })
  const districts: DistrictDto[] = districtsQ.data?.data?.data ?? []

  const trimmed = search.trim()
  const mahallaQ = useMahallaListQuery({
    params: { district_id: district?.id, search: trimmed || undefined },
    querySettings: { enabled: !!district?.id },
  })
  const mahallas: MahallaDto[] = mahallaQ.data?.data?.data ?? []

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

  // ── Step navigation ────────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 'mahalla') {
      setStep('district')
      setSelected(null)
      setSearch('')
    } else if (step === 'district') {
      setStep('region')
      setDistrict(null)
    } else {
      router.back()
    }
  }

  const pickRegion = (r: RegionDto) => {
    setRegion(r)
    setDistrict(null)
    setSelected(null)
    setStep('district')
  }
  const pickDistrict = (d: DistrictDto) => {
    setDistrict(d)
    setSelected(null)
    setSearch('')
    setStep('mahalla')
  }

  const inputStyle = [styles.input, { borderColor: colors.borderColor, color: colors.text }]

  const title =
    step === 'region'
      ? t('mahalla.select_region')
      : step === 'district'
        ? t('mahalla.select_district')
        : t('mahalla.select_mahalla')

  // ── Breadcrumb (tap a crumb to jump back to that step) ──────────────────────
  const Breadcrumb = (region || district) && (
    <View style={styles.crumbs}>
      {region && (
        <TouchableOpacity
          onPress={() => {
            setStep('region')
            setDistrict(null)
            setSelected(null)
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.crumb, { color: colors.primaryColor }]} numberOfLines={1}>
            {region.name}
          </Text>
        </TouchableOpacity>
      )}
      {district && (
        <>
          <ChevronRight size={14} color={colors.subText} />
          <TouchableOpacity
            onPress={() => {
              setStep('district')
              setSelected(null)
              setSearch('')
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.crumb, { color: colors.primaryColor }]} numberOfLines={1}>
              {district.name}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )

  const Row = ({
    label,
    sub,
    selectedRow,
    onPress,
  }: {
    label: string
    sub?: string
    selectedRow?: boolean
    onPress: () => void
  }) => (
    <TouchableOpacity
      style={[styles.row, { borderColor: selectedRow ? colors.primaryColor : colors.borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowName, { color: colors.text }]}>{label}</Text>
        {!!sub && <Text style={[styles.rowSub, { color: colors.subText }]}>{sub}</Text>}
      </View>
      {selectedRow ? (
        <Check size={18} color={colors.primaryColor} />
      ) : (
        <ChevronRight size={18} color={colors.subText} />
      )}
    </TouchableOpacity>
  )

  const Loader = <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
  const Empty = (msg: string) => (
    <Text style={[styles.noResults, { color: colors.subText }]}>{msg}</Text>
  )

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={goBack} hitSlop={10} style={styles.headerBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidWrapper style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {Breadcrumb}

          {/* ── Step 1: Region ─────────────────────────────────────────────── */}
          {step === 'region' &&
            (regionsQ.isFetching && regions.length === 0
              ? Loader
              : regions.length === 0
                ? Empty(t('mahalla.no_results'))
                : regions.map((r) => (
                    <Row key={r.id} label={r.name} onPress={() => pickRegion(r)} />
                  )))}

          {/* ── Step 2: District ───────────────────────────────────────────── */}
          {step === 'district' &&
            (districtsQ.isFetching && districts.length === 0
              ? Loader
              : districts.length === 0
                ? Empty(t('mahalla.no_districts'))
                : districts.map((d) => (
                    <Row key={d.id} label={d.name} onPress={() => pickDistrict(d)} />
                  )))}

          {/* ── Step 3: Mahalla (with optional in-district search) ──────────── */}
          {step === 'mahalla' && (
            <>
              <TextInput
                style={inputStyle}
                value={search}
                onChangeText={setSearch}
                placeholder={t('mahalla.search_placeholder')}
                placeholderTextColor={colors.subText}
              />

              {mahallaQ.isFetching && mahallas.length === 0 && Loader}
              {!mahallaQ.isFetching && mahallas.length === 0 && Empty(t('mahalla.no_mahallas'))}

              {mahallas.map((m) => (
                <Row
                  key={m.id}
                  label={m.name}
                  selectedRow={selected?.id === m.id}
                  onPress={() => setSelected(m)}
                />
              ))}

              {selected && (
                <View style={styles.houseBlock}>
                  <Text style={[styles.label, { color: colors.subText }]}>
                    {t('mahalla.house_number')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                    placeholder={t('mahalla.house_number_placeholder')}
                    placeholderTextColor={colors.subText}
                  />
                  <Text style={[styles.label, { color: colors.subText }]}>
                    {t('mahalla.street')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    value={street}
                    onChangeText={setStreet}
                    placeholder={t('mahalla.street_placeholder')}
                    placeholderTextColor={colors.subText}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Join button only on the mahalla step, once a mahalla is chosen. */}
        {step === 'mahalla' && selected && (
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
        )}
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
  crumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  crumb: { fontSize: 13, fontWeight: '600' },
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
