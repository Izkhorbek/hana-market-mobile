import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useLocalSearchParams, useRouter } from 'expo-router'
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

const RegisterPage = () => {
  const router = useRouter()
  const colors = useThemeColors()
  const { t } = useTranslations()
  const params = useLocalSearchParams<{ phone?: string }>()
  const { register } = useAuthStore()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState(params.phone ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const phoneInputRef = useRef<TextInput>(null)

  const [otpCode, setOtpCode] = useState(['', '', '', ''])
  const [otpFocused, setOtpFocused] = useState(-1)
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(TextInput | null)[]>([null, null, null, null])

  useEffect(() => {
    if (!params.phone) {
      setTimeout(() => phoneInputRef.current?.focus(), 100)
    }
  }, [])

  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [step, countdown])

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
    if (digits.length <= 9) setPhoneNumber(digits)
  }

  const handleOtpInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...otpCode]
    newCode[index] = digit
    setOtpCode(newCode)
    if (digit && index < 3) otpRefs.current[index + 1]?.focus()
  }

  // Phone step: call register to trigger SMS, then show OTP
  const handleSendOtp = useCallback(async () => {
    if (phoneNumber.length !== 9 || isLoading) return
    setIsLoading(true)
    try {
      await register(`+998${phoneNumber}`)
    } catch (error: any) {
      const message: string = error?.response?.data?.errors?.[0] || error?.message || ''
      if (!message.toLowerCase().includes('already') && !message.toLowerCase().includes('exists')) {
        Alert.alert(t('auth.register.error_title'), message || t('auth.register.error_generic'))
        setIsLoading(false)
        return
      }
      // Already registered — still proceed to OTP
    }
    setIsLoading(false)
    setStep('otp')
    setCountdown(240)
    setTimeout(() => otpRefs.current[0]?.focus(), 200)
  }, [phoneNumber, isLoading, register, t])

  const handleResend = useCallback(async () => {
    if (countdown > 0 || isLoading) return
    setOtpCode(['', '', '', ''])
    setIsLoading(true)
    try {
      await register(`+998${phoneNumber}`)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
    setCountdown(240)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }, [countdown, isLoading, phoneNumber, register])

  // OTP step: verification complete, navigate to auth (login)
  const handleVerifyOtp = useCallback(() => {
    if (otpCode.join('').length !== 4) return
    router.replace('/(auth)/auth')
  }, [otpCode, router])

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone')
      setOtpCode(['', '', '', ''])
      setCountdown(0)
    } else {
      router.back()
    }
  }

  const isPhoneReady = phoneNumber.length === 9 && !isLoading
  const isOtpReady = otpCode.join('').length === 4 && !isLoading

  const stepTitle = step === 'phone' ? t('auth.register.title') : t('auth.verification.otp_title')

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <ThemedText type="title" style={styles.title}>
            {stepTitle}
          </ThemedText>

          {/* ── Step: Phone ── */}
          {step === 'phone' && (
            <View style={[styles.inputContainer, { borderColor: colors.borderColor }]}>
              <Text style={[styles.phonePrefix, { color: colors.text }]}>+998</Text>
              <TextInput
                ref={phoneInputRef}
                style={[styles.inputField, { color: colors.text }]}
                value={formatPhone(phoneNumber)}
                onChangeText={handlePhoneChange}
                placeholder={t('auth.verification.phone_placeholder')}
                placeholderTextColor={colors.subText}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
          )}

          {/* ── Step: OTP ── */}
          {step === 'otp' && (
            <>
              <View style={[styles.inputContainer, { borderColor: colors.borderColor, opacity: 0.6 }]}>
                <Text style={[styles.phonePrefix, { color: colors.text }]}>+998</Text>
                <Text style={[styles.inputField, { color: colors.text }]}>{formatPhone(phoneNumber)}</Text>
              </View>
              <Text style={[styles.otpSubtitle, { color: colors.subText }]}>
                {t('auth.verification.otp_subtitle')}
              </Text>
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3].map((i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { otpRefs.current[i] = ref }}
                    style={[
                      styles.otpBox,
                      {
                        borderColor: otpFocused === i ? colors.primaryColor : colors.borderColor,
                        color: colors.text,
                        backgroundColor: colors.card,
                      },
                    ]}
                    value={otpCode[i]}
                    onChangeText={(val) => handleOtpInput(i, val)}
                    onFocus={() => setOtpFocused(i)}
                    onBlur={() => setOtpFocused(-1)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !otpCode[i] && i > 0) {
                        otpRefs.current[i - 1]?.focus()
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0 || isLoading}
                style={styles.resendContainer}
              >
                <Text style={[styles.resendText, { color: countdown > 0 ? colors.subText : colors.primaryColor }]}>
                  {countdown > 0
                    ? `${t('auth.verification.resend_in')} ${countdown}s`
                    : t('auth.verification.resend_code')}
                </Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        {/* ── Action Button ── */}
        <View style={styles.buttonWrapper}>
          {step === 'phone' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isPhoneReady ? colors.primaryColor : colors.borderColor }]}
              onPress={handleSendOtp}
              disabled={!isPhoneReady}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: isPhoneReady ? '#fff' : colors.subText }]}>
                  {t('auth.verification.send')}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {step === 'otp' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isOtpReady ? colors.primaryColor : colors.borderColor }]}
              onPress={handleVerifyOtp}
              disabled={!isOtpReady}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: isOtpReady ? '#fff' : colors.subText }]}>
                {t('auth.verification.verify')}
              </Text>
            </TouchableOpacity>
          )}

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
  inputField: {
    fontSize: 16,
    flex: 1,
    padding: 0,
  },
  otpSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  otpBox: {
    flex: 1,
    height: 64,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 16,
  },
  buttonWrapper: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default RegisterPage