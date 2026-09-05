import { useServiceQuery } from '@/api/hooks'
import EditServiceForm from '@/components/Forms/EditServiceForm'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import { ThemedView } from '@/components/themed-view'
import ThemedScrollView from '@/components/themed-scrollview'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { SingleServiceDto } from '@/types'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

/** Edit one of the provider's own services. */
const EditServiceScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const colors = useThemeColors()
  const { t } = useTranslations()

  const numericId = Number(id)
  const { data, isLoading, isError } = useServiceQuery({ id: numericId })
  const service: SingleServiceDto | undefined = data?.data?.data

  const Header = (
    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
        {t('my_services.edit_title')}
      </Text>
      <View style={styles.headerBtn} />
    </View>
  )

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <ActivityIndicator style={styles.loader} color={colors.primaryColor} />
      </ThemedView>
    )
  }

  if (isError || !service) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.subText }]}>{t('post.error')}</Text>
        </View>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}
      <KeyboardAvoidWrapper style={styles.container}>
        <ThemedScrollView style={styles.container} keyboardShouldPersistTaps='handled'>
          <EditServiceForm service={service} />
        </ThemedScrollView>
      </KeyboardAvoidWrapper>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  loader: {
    paddingVertical: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
})

export default EditServiceScreen
