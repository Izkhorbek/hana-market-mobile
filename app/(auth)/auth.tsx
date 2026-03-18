import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import CustomAlert from '@/components/ui/CustomAlert'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { userApi } from '@/modules/Auth/api'
import { useAuthStore } from '@/modules/Auth/auth-store'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'

const AuthPage = () => {
  const router = useRouter()
  const colors = useThemeColors()
  const { t } = useTranslations()

  const { register, login, user } = useAuthStore()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const phoneInputRef = useRef<TextInput>(null)

  // Location alert state
  const [showLocationAlert, setShowLocationAlert] = useState(false)

  // Username modal state
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)

  // Store reference to logged-in user for checking after alerts
  const [pendingNavigation, setPendingNavigation] = useState(false)

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

      // Get the updated user from the store
      const loggedInUser = useAuthStore.getState().user

      // Check if user needs to set up username (first-time login)
      if (loggedInUser && !loggedInUser.username) {
        setShowUsernameModal(true)
        return
      }

      // Check if user needs to set up location
      if (loggedInUser && (loggedInUser.latitude == null || loggedInUser.longitude == null)) {
        setShowLocationAlert(true)
        return
      }

      // All set, navigate to home
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

          // Get the updated user from the store
          const loggedInUser = useAuthStore.getState().user

          // Check if user needs to set up username (first-time login)
          if (loggedInUser && !loggedInUser.username) {
            setShowUsernameModal(true)
            return
          }

          // Check if user needs to set up location
          if (loggedInUser && (loggedInUser.latitude == null || loggedInUser.longitude == null)) {
            setShowLocationAlert(true)
            return
          }

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

  // Username validation
  const validateUsername = (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(value)
  }

  const handleUsernameChange = (text: string) => {
    setUsername(text)
    if (text && !validateUsername(text)) {
      setUsernameError(t('alert.username_invalid'))
    } else {
      setUsernameError('')
    }
  }

  const handleUsernameSubmit = async () => {
    if (!validateUsername(username)) {
      setUsernameError(t('alert.username_invalid'))
      return
    }

    setIsUpdatingUsername(true)
    try {
      await userApi.updateUser({ username })

      // Update local user state
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        useAuthStore.setState({
          user: { ...currentUser, username }
        })
      }

      setShowUsernameModal(false)

      // Check if location is needed after username is set
      const updatedUser = useAuthStore.getState().user
      if (updatedUser && (updatedUser.latitude == null || updatedUser.longitude == null)) {
        setShowLocationAlert(true)
      } else {
        router.replace('/(tabs)/home')
      }
    } catch (error: any) {
      const message = error?.response?.data?.errors?.[0] ||
        error?.message ||
        t('auth.verification.error_generic')
      setUsernameError(message)
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const handleSkipUsername = () => {
    setShowUsernameModal(false)

    // Check if location is needed
    const currentUser = useAuthStore.getState().user
    if (currentUser && (currentUser.latitude == null || currentUser.longitude == null)) {
      setShowLocationAlert(true)
    } else {
      router.replace('/(tabs)/home')
    }
  }

  const handleSetupLocation = () => {
    setShowLocationAlert(false)
    router.replace('/(auth)/location-permission')
  }

  const handleSkipLocation = () => {
    setShowLocationAlert(false)
    router.replace('/(tabs)/home')
  }

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

      {/* Location Required Alert */}
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

      {/* Username Modal */}
      <Modal
        visible={showUsernameModal}
        transparent
        animationType="fade"
        onRequestClose={handleSkipUsername}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {t('alert.username_required_title')}
            </ThemedText>
            <ThemedText style={styles.modalMessage}>
              {t('alert.username_required_message')}
            </ThemedText>

            <View style={[styles.usernameInputContainer, { borderColor: usernameError ? '#EF4444' : colors.borderColor }]}>
              <TextInput
                style={[styles.usernameInput, { color: colors.text }]}
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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton, { borderColor: colors.borderColor }]}
                onPress={handleSkipUsername}
                disabled={isUpdatingUsername}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  {t('alert.skip')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.primaryButton,
                  { backgroundColor: validateUsername(username) ? colors.primaryColor : colors.borderColor }
                ]}
                onPress={handleUsernameSubmit}
                disabled={!validateUsername(username) || isUpdatingUsername}
              >
                {isUpdatingUsername ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: validateUsername(username) ? '#fff' : colors.subText }]}>
                    {t('alert.continue')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Username Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  usernameInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  usernameInput: {
    fontSize: 16,
    padding: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})

export default AuthPage