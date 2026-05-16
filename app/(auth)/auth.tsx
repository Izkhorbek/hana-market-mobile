import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import CustomAlert from '@/components/ui/CustomAlert'
import { AppLimits, UZBEK_MOBILE_OPERATORS, UZBEK_MOBILE_PHONE_REGEX, UZBEK_MOBILE_PREFIX_SET, UZBEK_MOBILE_PREFIXES } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { userApi } from '@/modules/Auth/api'
import { useAuthStore } from '@/modules/Auth/auth-store'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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

const normalizePhoneInput = (text: string): string => {
  const digits = text.replace(/\D/g, '')
  return digits.startsWith('998') ? digits.slice(3) : digits
}

const canAcceptPhoneDigits = (digits: string): boolean => {
  if (digits.length > 9) return false
  if (!digits) return true
  if (digits.length === 1) {
    return UZBEK_MOBILE_PREFIXES.some((prefix) => prefix.startsWith(digits))
  }

  return UZBEK_MOBILE_PREFIX_SET.has(digits.slice(0, 2))
}

const getPhoneOperator = (digits: string): string | null => {
  if (digits.length < 2) return null
  return UZBEK_MOBILE_OPERATORS[digits.slice(0, 2)] ?? null
}

const isValidUzbekPhoneNumber = (digits: string): boolean =>
  UZBEK_MOBILE_PHONE_REGEX.test(digits)

const AuthPage = () => {
  const router = useRouter()
  const colors = useThemeColors()
  const { t } = useTranslations()
  
  const { requestOtp, verifyOtp } = useAuthStore()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const phoneInputRef = useRef<TextInput>(null)
  const lastRejectedPhoneInputRef = useRef('')

  const [showLocationAlert, setShowLocationAlert] = useState(false)
  const [otpError, setOtpError] = useState('')

  const [step, setStep] = useState<'phone' | 'otp' | 'username'>('phone')
  const [otpCode, setOtpCode] = useState(
    new Array(AppLimits.Otp.CODE_LENGTH).fill(''),
  )
  const [otpFocused, setOtpFocused] = useState(-1)
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(TextInput | null)[]>(
    new Array(AppLimits.Otp.CODE_LENGTH).fill(null),
  )

  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const usernameInputRef = useRef<TextInput>(null)

  // Focus phone input on mount
  useEffect(() => {
    setTimeout(() => phoneInputRef.current?.focus(), 100)
  }, [])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000)
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

  const triggerPhoneValidationFeedback = useCallback((rejectedDigits: string) => {
    if (lastRejectedPhoneInputRef.current === rejectedDigits) return

    lastRejectedPhoneInputRef.current = rejectedDigits
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => undefined,
    )
  }, [])

  const handlePhoneChange = (text: string) => {
    const digits = normalizePhoneInput(text)

    if (!canAcceptPhoneDigits(digits)) {
      setPhoneError(t('auth.verification.phone_invalid_operator'))
      triggerPhoneValidationFeedback(digits)
      return
    }

    lastRejectedPhoneInputRef.current = ''
    setPhoneNumber(digits)
    if (phoneError) setPhoneError('')
  }

  const handleOtpInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...otpCode]
    newCode[index] = digit
    setOtpCode(newCode)
    if (otpError) setOtpError('')
    if (digit && index < AppLimits.Otp.CODE_LENGTH - 1)
      otpRefs.current[index + 1]?.focus()
  }

  const validateUsername = (value: string) =>
    /^[a-zA-Z0-9_]{3,20}$/.test(value)

  const handleUsernameChange = (text: string) => {
    setUsername(text)
    if (text && !validateUsername(text)) {
      setUsernameError(t('alert.username_invalid'))
    } else {
      setUsernameError('')
    }
  }

  // Step 1: request an OTP. On success move to OTP step. On 403/blocked,
  // surface the server message; everything else shows a generic error.
  // There is no longer a "user not found" branch — verify-otp implicitly
  // registers a brand-new phone server-side.
  const handleSend = useCallback(async () => {
    if (!isValidUzbekPhoneNumber(phoneNumber) || isLoading) {
      if (phoneNumber.length > 0 && !isLoading) {
        setPhoneError(t('auth.verification.phone_invalid_operator'))
      }
      return
    }

    setPhoneError('')
    setIsLoading(true)
    try {
      await requestOtp(`+998${phoneNumber}`)
      setStep('otp')
      setOtpCode(new Array(AppLimits.Otp.CODE_LENGTH).fill(''))
      setOtpError('')
      setCountdown(AppLimits.Otp.RESEND_COOLDOWN_SECONDS)
      setTimeout(() => otpRefs.current[0]?.focus(), 200)
    } catch (error: any) {
      const status = error?.response?.status
      const message: string =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        ''
      if (status === 403 || message.toLowerCase().includes('block')) {
        Alert.alert(
          t('auth.verification.error_title'),
          t('auth.verification.error_generic'),
        )
        return
      }
      if (status === 429 || message.toLowerCase().includes('rate')) {
        Alert.alert(
          t('auth.verification.error_title'),
          t('auth.verification.error_generic'),
        )
        return
      }
      Alert.alert(
        t('auth.verification.error_title'),
        t('auth.verification.error_generic'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [phoneNumber, isLoading, requestOtp, t])

  const handleResend = useCallback(async () => {
    if (countdown > 0 || isLoading) return
    setOtpCode(new Array(AppLimits.Otp.CODE_LENGTH).fill(''))
    setOtpError('')
    setIsLoading(true)
    try {
      await requestOtp(`+998${phoneNumber}`)
      setCountdown(AppLimits.Otp.RESEND_COOLDOWN_SECONDS)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (error: any) {
       const message: string =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        ''
      if (message.toLowerCase().includes('block')) {
        Alert.alert(
          t('auth.verification.error_title'),
          t('auth.verification.error_generic'),
        )
        return
      }
      if (message.toLowerCase().includes('rate')) {
        Alert.alert(
          t('auth.verification.error_title'),
          t('auth.verification.error_generic'),
        )
        return
      }
      Alert.alert(
        t('auth.verification.error_title'),
        t('auth.verification.error_generic'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [countdown, isLoading, phoneNumber, requestOtp, t])

  // Step 2: verify the OTP. On success the store has a token + user. We then
  // route through username/location prompts as needed.
  const handleDone = useCallback(async () => {
    const code = otpCode.join('')
    if (code.length !== AppLimits.Otp.CODE_LENGTH || isLoading) return
    setIsLoading(true)
    try {
      await verifyOtp(`+998${phoneNumber}`, code)
      const loggedInUser = useAuthStore.getState().user
      if (
        loggedInUser &&
        (!loggedInUser.username || loggedInUser.username === 'unknown')
      ) {
        setStep('username')
        setTimeout(() => usernameInputRef.current?.focus(), 200)
        return
      }
      if (
        loggedInUser &&
        (loggedInUser.latitude == null || loggedInUser.longitude == null)
      ) {
        setShowLocationAlert(true)
        return
      }
      router.replace('/(tabs)/home')
    } catch {
      setOtpError(t('auth.verification.error_generic'))
    } finally {
      setIsLoading(false)
    }
  }, [otpCode, isLoading, phoneNumber, verifyOtp, router, t])

  // Step 3: save username then navigate home
  const handleSaveUsername = useCallback(async () => {
    if (!validateUsername(username) || isLoading) return
    setIsLoading(true)
    try {
      await userApi.updateUser({ username })
      setIsLoading(false)
      const loggedInUser = useAuthStore.getState().user
      if (
        loggedInUser &&
        (loggedInUser.latitude == null || loggedInUser.longitude == null)
      ) {
        setShowLocationAlert(true)
        return
      }
      router.replace('/(tabs)/home')
    } catch {
      setIsLoading(false)
      setUsernameError(t('auth.register.error_generic'))
    }
  }, [username, isLoading, router, t])

  const phoneOperator = getPhoneOperator(phoneNumber)
  const isSendEnabled = isValidUzbekPhoneNumber(phoneNumber) && !isLoading
  const isDoneEnabled =
    otpCode.join('').length === AppLimits.Otp.CODE_LENGTH && !isLoading
  const isUsernameReady = validateUsername(username) && !isLoading

  const handleSetupLocation = () => {
    setShowLocationAlert(false)
    router.replace('/(auth)/location-permission')
  }

  const handleSkipLocation = () => {
    setShowLocationAlert(false)
    router.replace('/(tabs)/home')
  }

  return (
    <KeyboardAvoidWrapper     
      style={{ flex: 1 }}
    >
      <ThemedView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 'username') {
                setStep('otp')
                setUsername('')
                setUsernameError('')
              } else if (step === 'otp') {
                setStep('phone')
                setOtpCode(new Array(AppLimits.Otp.CODE_LENGTH).fill(''))
                setCountdown(0)
              } else {
                router.back()
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <ThemedText type="title" style={styles.title}>
            {step === 'phone'
              ? t('auth.verification.title')
              : step === 'otp'
                ? t('auth.verification.otp_title')
                : t('auth.register.username_title')}
          </ThemedText>

          {/* Phone Input */}
          <View
            style={[styles.inputContainer, { borderColor: colors.borderColor }]}
          >
            <Text style={[styles.phonePrefix, { color: colors.text }]}>
              +998
            </Text>
            <TextInput
              testID="auth-phone-input"
              ref={phoneInputRef}
              style={[styles.phoneNumber, { color: colors.text }]}
              value={formatPhone(phoneNumber)}
              onChangeText={step === 'phone' ? handlePhoneChange : undefined}
              placeholder={t('auth.verification.phone_placeholder')}
              placeholderTextColor={colors.subText}
              keyboardType="phone-pad"
              maxLength={12}
              editable={step === 'phone'}
            />
            {step === 'phone' && phoneOperator ? (
              <Text
                testID="auth-phone-operator"
                style={[
                  styles.operatorBadge,
                  { color: colors.primaryColor },
                ]}
              >
                {`${phoneOperator} ✓`}
              </Text>
            ) : null}
          </View>
          {step === 'phone' && phoneError ? (
            <Text
              testID="auth-phone-error"
              style={[styles.errorText, { color: colors.red || '#e54343' }]}
            >
              {phoneError}
            </Text>
          ) : null}

          {/* Username Step */}
          {step === 'username' && (
            <>
              <Text style={[styles.otpSubtitle, { color: colors.subText }]}>
                {t('auth.register.username_subtitle')}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: usernameError ? '#EF4444' : colors.borderColor,
                  },
                ]}
              >
                <TextInput
                  ref={usernameInputRef}
                  style={[styles.phoneNumber, { color: colors.text }]}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder={t('alert.username_placeholder')}
                  placeholderTextColor={colors.subText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>
              {usernameError ? (
                <Text style={styles.errorText}>{usernameError}</Text>
              ) : null}
            </>
          )}

          {/* OTP Verification */}
          {step === 'otp' && (
            <>
              <Text style={[styles.otpSubtitle, { color: colors.subText }]}>
                {t('auth.verification.otp_subtitle')}
              </Text>
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3].map((i) => (
                  <TextInput
                    key={i}
                    testID={`auth-otp-${i}`}
                    ref={(ref) => {
                      otpRefs.current[i] = ref
                    }}
                    style={[
                      styles.otpBox,
                      {
                        borderColor:
                          otpFocused === i
                            ? colors.primaryColor
                            : colors.borderColor,
                        color: colors.text,
                        backgroundColor: colors.card,
                      },
                    ]}
                    value={otpCode[i]}
                    onChangeText={(val) => handleOtpInput(i, val)}
                    onFocus={() => setOtpFocused(i)}
                    onBlur={() => setOtpFocused(-1)}
                    onKeyPress={({ nativeEvent }) => {
                      if (
                        nativeEvent.key === 'Backspace' &&
                        !otpCode[i] &&
                        i > 0
                      ) {
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
              {otpError ? (
                <Text
                  style={[styles.errorText, { color: colors.red || '#e54343' }]}
                >
                  {otpError}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0 || isLoading}
                style={styles.resendContainer}
              >
                <Text
                  style={[
                    styles.resendText,
                    {
                      color:
                        countdown > 0 ? colors.subText : colors.primaryColor,
                    },
                  ]}
                >
                  {countdown > 0
                    ? `${t('auth.verification.resend_in')} ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                    : t('auth.verification.resend_code')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* Action Button — pinned above keyboard */}
        <View
          style={[
            styles.doneButtonWrapper
          ]}
        >
          {step === 'phone' && (
            <TouchableOpacity
              testID="auth-send-btn"
              style={[
                styles.doneButton,
                {
                  backgroundColor: isSendEnabled
                    ? colors.primaryColor
                    : colors.borderColor,
                },
              ]}
              onPress={handleSend}
              disabled={!isSendEnabled}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.doneButtonText,
                    { color: isSendEnabled ? '#fff' : colors.subText },
                  ]}
                >
                  {t('auth.verification.send')}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {step === 'otp' && (
            <TouchableOpacity
              testID="auth-done-btn"
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
          )}
          {step === 'username' && (
            <TouchableOpacity
              style={[
                styles.doneButton,
                {
                  backgroundColor: isUsernameReady
                    ? colors.primaryColor
                    : colors.borderColor,
                },
              ]}
              onPress={handleSaveUsername}
              disabled={!isUsernameReady}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.doneButtonText,
                    { color: isUsernameReady ? '#fff' : colors.subText },
                  ]}
                >
                  {t('auth.register.button')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>

      <CustomAlert
        visible={showLocationAlert}
        type="warning"
        title={t('alert.location_required_title')}
        message={t('alert.location_required_message')}
        primaryButtonText={t('alert.setup_location')}
        secondaryButtonText={t('alert.skip')}
        onPrimaryPress={handleSetupLocation}
        onSecondaryPress={handleSkipLocation}
        onDismiss={handleSkipLocation}
      />
    </KeyboardAvoidWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
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
  operatorBadge: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
  },
  otpSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  doneButtonWrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
