import { useAuthStore } from '@/modules/Auth/auth-store'
import { useTranslations } from '@/hooks/use-translation'
import { Redirect } from 'expo-router'
import React, { useEffect } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isGuest = useAuthStore((s) => s.isGuest)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const sessionExpiredOnStart = useAuthStore((s) => s.sessionExpiredOnStart)
  const clearSessionExpiredOnStart = useAuthStore((s) => s.clearSessionExpiredOnStart)
  const { t } = useTranslations()

  useEffect(() => {
    if (!isHydrated || !sessionExpiredOnStart) return
    clearSessionExpiredOnStart()
    Alert.alert(
      t('alert.session_expired_title'),
      t('alert.session_expired_message'),
      [{ text: t('common.ok') }],
    )
  }, [isHydrated, sessionExpiredOnStart, clearSessionExpiredOnStart, t])

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Authenticated users and guests both land on the tabs; only a fresh /
  // logged-out user (neither) sees the welcome screen.
  if (isAuthenticated || isGuest) {
    return <Redirect href="/(tabs)/home" />
  }

  return <Redirect href="/(auth)/welcome" />
}
