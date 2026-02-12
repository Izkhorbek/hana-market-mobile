import { useAuthStore } from '@/modules/Auth/auth-store'
import { Redirect } from 'expo-router'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />
  }

  return <Redirect href="/(auth)/welcome" />
}
