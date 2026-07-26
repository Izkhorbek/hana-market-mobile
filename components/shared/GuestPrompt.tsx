import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router } from 'expo-router'
import { LogIn, type LucideIcon } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface GuestPromptProps {
  /** Overrides the default `guest.cta_title` copy. */
  title?: string
  /** Overrides the default `guest.cta_message` copy. */
  message?: string
  /** Overrides the default lucide icon. */
  Icon?: LucideIcon
}

/**
 * Full-screen "log in to continue" call-to-action shown on tabs a guest can't
 * use (chat, profile). The button routes into the auth flow; a successful
 * login clears guest mode and the real screen renders.
 */
const GuestPrompt: React.FC<GuestPromptProps> = ({ title, message, Icon = LogIn }) => {
  const colors = useThemeColors()
  const { t } = useTranslations()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryColor + '20' }]}>
        <Icon size={40} color={colors.primaryColor} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {title ?? t('guest.cta_title')}
      </Text>
      <Text style={[styles.message, { color: colors.subText }]}>
        {message ?? t('guest.cta_message')}
      </Text>

      <TouchableOpacity
        testID="guest-prompt-login"
        style={[styles.button, { backgroundColor: colors.primaryColor }]}
        activeOpacity={0.85}
        onPress={() => router.push('/(auth)/auth')}
      >
        <Text style={styles.buttonText}>{t('guest.login_button')}</Text>
      </TouchableOpacity>
    </View>
  )
}

export default GuestPrompt

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})
