import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const AuthPage = () => {
  const router = useRouter()
  const colors = useThemeColors()
  const { t } = useTranslations()

  const { register, login } = useAuthStore()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const phoneInputRef = useRef<TextInput>(null)

  // Focus phone input on mount
  useEffect(() => {
    setTimeout(() => phoneInputRef.current?.focus(), 100)
  }, [])

  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 7)
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
  }

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '')
    if (digits.length <= 9) {
      setPhoneNumber(digits)
    }
  }

  const handleDone = useCallback(async () => {
    if (phoneNumber.length !== 9 || isLoading) return

    setIsLoading(true)
    try {
      const fullPhone = `+998${phoneNumber}`
      await login(fullPhone)
      router.replace('/(tabs)/home')
    } catch (error: any) {
      const message = error?.response?.data?.errors?.[0] ||
        error?.message ||
        t('auth.verification.error_generic')

      if (
        message.toLowerCase().includes('already') ||
        message.toLowerCase().includes('exists')
      ) {
        try {
          await login(`+998${phoneNumber}`)
          router.replace('/(tabs)/home')
          return
        } catch (loginError) {
          console.error('Auto-login failed:', loginError)
        }
      }

      Alert.alert(t('auth.verification.error_title'), message)
    } finally {
      setIsLoading(false)
    }
  }, [phoneNumber, isLoading, login, router, t])

  const isDoneEnabled = phoneNumber.length === 9 && !isLoading

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <ThemedText type="title" style={styles.title}>
            {t('auth.verification.title')}
          </ThemedText>

          {/* Phone Input */}
          <View style={[styles.inputContainer, { borderColor: colors.borderColor }]}>
            <Text style={[styles.phonePrefix, { color: colors.text }]}>+998</Text>
            <TextInput
              ref={phoneInputRef}
              style={[styles.phoneNumber, { color: colors.text }]}
              value={formatPhone(phoneNumber)}
              onChangeText={handlePhoneChange}
              placeholder={t('auth.verification.phone_placeholder')}
              placeholderTextColor={colors.subText}
              keyboardType="phone-pad"
              maxLength={12} // Adjusted for spaces in formatted phone
            />
          </View>

          {/* OTP Section Disabled Temporarily */}
          {/* 
          <View style={[styles.inputContainer, { borderColor: colors.borderColor }]}>
            <TextInput
              // ... code input logic ...
            />
             ... timer ... 
          </View>
           ... resend button ... 
          */}
        </View>

        {/* Done Button */}
        <View style={styles.doneButtonWrapper}>
          <TouchableOpacity
            style={[
              styles.doneButton,
              {
                backgroundColor: isDoneEnabled
                  ? colors.primaryColor
                  : colors.borderColor,
              },
            ]}
            onPress={handleDone}
            disabled={!isDoneEnabled}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.doneButtonText,
                  { color: isDoneEnabled ? '#fff' : colors.subText },
                ]}
              >
                {t('auth.verification.done')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  phoneNumber: {
    fontSize: 16,
    flex: 1,
    padding: 0, // Reset default padding
  },
  // OTP Styles (unused temporarily)
  codeText: {
    fontSize: 16,
    flex: 1,
    padding: 0,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  resendButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  doneButtonWrapper: {
    paddingHorizontal: 24,
    marginBottom: 40, // Increased to keep it above keyboard if possible or just at bottom
  },
  doneButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default AuthPage