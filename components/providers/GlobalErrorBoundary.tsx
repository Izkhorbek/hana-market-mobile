import i18n from '@/constants/localization'
import { logger } from '@/utils/logger'
import React from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Telegram support contact shown on the fallback screen.
const SUPPORT_TELEGRAM_HANDLE = '@hana_market_admin'
const SUPPORT_TELEGRAM_URL = 'https://t.me/hana_market_admin'

// Self-contained copy. The boundary sits ABOVE the providers and may render
// when something in the app (incl. i18n consumers) has thrown, so it must not
// depend on the React i18n context — we read the active language directly from
// the i18next singleton and fall back to a built-in string table.
const STRINGS = {
  uz: {
    title: 'Nimadir xato ketdi',
    message:
      'Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.',
    tryAgain: 'Qayta urinish',
    contact: 'Muammo davom etsa, Telegram orqali bog‘laning:',
  },
  ru: {
    title: 'Что-то пошло не так',
    message:
      'Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.',
    tryAgain: 'Попробовать снова',
    contact:
      'Если проблема повторяется, напишите нам в Telegram:',
  },
  en: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    tryAgain: 'Try again',
    contact: 'If the problem persists, contact us on Telegram:',
  },
} as const

const getStrings = () => {
  const lang = (i18n?.language || 'uz').split('-')[0]
  return STRINGS[lang as keyof typeof STRINGS] ?? STRINGS.uz
}

/**
 * Top-level error boundary. Catches synchronous render errors anywhere in the
 * tree, reports them to the backend telemetry endpoint, and shows a friendly,
 * localized fallback (with a Telegram support contact) so the user can recover
 * the session instead of seeing a raw technical error.
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.fatal('REACT_RENDER_ERROR', error, {
      extra: { componentStack: info.componentStack },
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleContact = () => {
    // Best-effort: never let opening the link throw from the fallback screen.
    Linking.openURL(SUPPORT_TELEGRAM_URL).catch(() => {})
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const tr = getStrings()
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{tr.title}</Text>
        <Text style={styles.message}>{tr.message}</Text>
        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>{tr.tryAgain}</Text>
        </TouchableOpacity>
        <Text style={styles.contactLabel}>{tr.contact}</Text>
        <TouchableOpacity onPress={this.handleContact} hitSlop={8}>
          <Text style={styles.contactLink}>{SUPPORT_TELEGRAM_HANDLE}</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6' },
  buttonText: { color: '#fff', fontWeight: '600' },
  contactLabel: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 28 },
  contactLink: { fontSize: 15, fontWeight: '600', color: '#3B82F6', marginTop: 6 },
})

export default GlobalErrorBoundary
