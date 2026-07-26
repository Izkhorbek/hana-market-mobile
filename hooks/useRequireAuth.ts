import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { router } from 'expo-router'
import { useCallback } from 'react'
import { Alert } from 'react-native'

/**
 * Gate a one-off action behind authentication.
 *
 * For a logged-in user the action runs immediately. For a guest it shows a
 * "login required" alert that routes to the auth flow. Use this for discrete
 * actions (create post, report, favorite); for a whole screen that guests may
 * not use, render `<GuestPrompt/>` instead.
 */
export function useRequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { t } = useTranslations()

  return useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action()
        return
      }
      Alert.alert(
        t('guest.login_required_title'),
        t('guest.login_required_message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('guest.login_button'),
            onPress: () => router.push('/(auth)/auth'),
          },
        ],
      )
    },
    [isAuthenticated, t],
  )
}
