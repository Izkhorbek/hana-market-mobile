import { useMahallaDistributorsQuery, useMyMahallaQuery } from '@/api/hooks'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { MahallaDistributorDto } from '@/types'
import { type Href, router } from 'expo-router'
import { ArrowLeft, Phone, UserRound } from 'lucide-react-native'
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

export default function MahallaDistributorsScreen() {
  const colors = useThemeColors()
  const { t } = useTranslations()

  const myMahallaQ = useMyMahallaQuery()
  const mahallaId = myMahallaQ.data?.data?.data?.mahalla_id ?? 0

  const distQ = useMahallaDistributorsQuery({ mahallaId })
  const distributors: MahallaDistributorDto[] = distQ.data?.data?.data ?? []

  const handleCall = useCallback((phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`)
  }, [])

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

  const renderItem = ({ item }: { item: MahallaDistributorDto }) => (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.borderColor }]}>
      <View style={[styles.iconBubble, { backgroundColor: colors.tabIconBackground }]}>
        <UserRound size={22} color={colors.tabIconSelected} strokeWidth={1.8} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.cardPhone, { color: colors.subText }]}>{item.phone}</Text>
      </View>
      <TouchableOpacity
        style={[styles.callBtn, { backgroundColor: colors.primaryColor }]}
        onPress={() => handleCall(item.phone)}
        hitSlop={8}
        activeOpacity={0.85}
      >
        <Phone size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  )

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}
      <FlatList
        data={distributors}
        keyExtractor={(d) => d.user_id.toString()}
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
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  cardPhone: { fontSize: 13 },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  muted: { fontSize: 14, textAlign: 'center' },
  emptyText: { paddingTop: 60 },
  loader: { paddingVertical: 40 },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
