import { useAcceptTermsMutation, usePrivacyQuery, useTermsQuery } from '@/api/hooks'
// eslint-disable-next-line import/no-restricted-paths -- TODO(arch): route through a hook (ARCHITECTURE.md §1)
import { userService } from '@/api/services/user.service'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import CustomAlert from '@/components/ui/CustomAlert'
import { AppLimits, UZBEK_MOBILE_OPERATORS, UZBEK_MOBILE_PHONE_REGEX, UZBEK_MOBILE_PREFIX_SET, UZBEK_MOBILE_PREFIXES } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { isDeletedAccountError, showDeletedAccountAlert } from '@/utils/deletedAccount'
import Ionicons from '@expo/vector-icons/Ionicons'
import Constants from 'expo-constants'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Check } from 'lucide-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
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
  const setTermsAccepted = useAuthStore((s) => s.setTermsAccepted)

  // Current Terms/Privacy versions (public, cached) — sent to the backend to
  // record acceptance against the exact version the user agreed to.
  const { data: termsRes } = useTermsQuery()
  const { data: privacyRes } = usePrivacyQuery()
  const { mutate: acceptTerms } = useAcceptTermsMutation()
  const termsVersion = termsRes?.data?.data?.version
  const privacyVersion = privacyRes?.data?.data?.version

  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // App Store Guideline 1.2 — the user must explicitly accept the Terms /
  // Privacy Policy before authentication can proceed. Starts UNCHECKED.
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Legal URLs come from app config (env-overridable), with safe defaults.
  const legal = (Constants.expoConfig?.extra ?? {}) as {
    termsUrl?: string
    privacyPolicyUrl?: string
  }
  const termsUrl = legal.termsUrl ?? 'https://hana.uz/terms-of-service'
  const privacyUrl = legal.privacyPolicyUrl ?? 'https://hana.uz/privacy-policy'

  const openLegal = useCallback((url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => {
      /* noop — nothing else to do if the in-app browser can't open */
    })
  }, [])
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
      // Deleted account → support-contact alert; stay on the phone step, do not
      // navigate to OTP (we already returned before setStep on the success path).
      if (isDeletedAccountError(error)) {
        showDeletedAccountAlert()
        return
      }
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
      if (isDeletedAccountError(error)) {
        showDeletedAccountAlert()
        return
      }
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
      // Record the Terms acceptance the user gave on the phone step, now that
      // an authenticated account exists to attach it to (Guideline 1.2).
      setTermsAccepted(new Date().toISOString())
      // Best-effort server-side record. Only sent when we know both versions;
      // never blocks navigation and swallows its own errors.
      if (termsVersion && privacyVersion) {
        acceptTerms(
          {
            terms_version: termsVersion,
            privacy_version: privacyVersion,
            accepted_at: new Date().toISOString(),
            app_version: Constants.expoConfig?.version ?? undefined,
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
          },
          { onError: () => { /* non-blocking; client record already set */ } },
        )
      }
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
    } catch (error) {
      // Deleted account → support-contact alert, stay on the OTP step. No auth
      // state to clear: verifyOtp throws on the 403 before any token/user is
      // written to the store, so there is nothing partially stored to wipe.
      if (isDeletedAccountError(error)) {
        showDeletedAccountAlert()
        return
      }
      setOtpError(t('auth.verification.error_generic'))
    } finally {
      setIsLoading(false)
    }
  }, [otpCode, isLoading, phoneNumber, verifyOtp, setTermsAccepted, acceptTerms, termsVersion, privacyVersion, router, t])

  // Step 3: save username then navigate home
  const handleSaveUsername = useCallback(async () => {
    if (!validateUsername(username) || isLoading) return
    setIsLoading(true)
    try {
      await userService.updateProfile({ username })
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
  // Send OTP stays disabled until the user explicitly agrees to the Terms.
  const isSendEnabled =
    isValidUzbekPhoneNumber(phoneNumber) && !isLoading && agreedToTerms
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
            <View style={styles.consentContainer}>
              <Text style={[styles.policyNote, { color: colors.subText }]}>
                {t('auth.terms.policy_note')}
              </Text>
              <TouchableOpacity
                testID="auth-terms-checkbox"
                style={styles.checkboxRow}
                onPress={() => setAgreedToTerms((v) => !v)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreedToTerms }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: agreedToTerms
                        ? colors.primaryColor
                        : colors.borderColor,
                      backgroundColor: agreedToTerms
                        ? colors.primaryColor
                        : 'transparent',
                    },
                  ]}
                >
                  {agreedToTerms && <Check size={15} color="#fff" strokeWidth={3} />}
                </View>
                <Text style={[styles.consentLabel, { color: colors.text }]}>
                  {t('auth.terms.agree_prefix')}
                  <Text
                    style={[styles.consentLink, { color: colors.primaryColor }]}
                    onPress={() => openLegal(termsUrl)}
                  >
                    {t('auth.terms.terms_link')}
                  </Text>
                  {t('auth.terms.agree_middle')}
                  <Text
                    style={[styles.consentLink, { color: colors.primaryColor }]}
                    onPress={() => openLegal(privacyUrl)}
                  >
                    {t('auth.terms.privacy_link')}
                  </Text>
                  {t('auth.terms.agree_suffix')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  consentContainer: {
    marginBottom: 14,
    gap: 10,
  },
  policyNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  consentLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  consentLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})

export default AuthPage
