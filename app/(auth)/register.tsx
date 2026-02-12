import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const RegisterPage = () => {
  const router = useRouter()
  const colors = useThemeColors()
  const { t } = useTranslations()
  const params = useLocalSearchParams<{ phone?: string }>()
  const register = useAuthStore((s) => s.register)

  const [phoneNumber] = useState(params.phone ?? '')
  const [isLoading, setIsLoading] = useState(false)

  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 7)
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
  }

  const handleRegister = useCallback(async () => {
    if (!phoneNumber || phoneNumber.length < 9) return

    setIsLoading(true)
    try {
      const fullPhone = `+998${phoneNumber}`
      await register(fullPhone)
      router.replace('/(auth)/location-permission')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('auth.register.error_generic')
      Alert.alert(t('auth.register.error_title'), message)
    } finally {
      setIsLoading(false)
    }
  }, [phoneNumber, register, router, t])

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topSection}>
        {/* Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Title */}
        <ThemedText type="title" style={styles.title}>
          {t('auth.register.title')}
        </ThemedText>

        {/* Description */}
        <Text style={[styles.description, { color: colors.subText }]}>
          {t('auth.register.description')}
        </Text>

        {/* Phone Display */}
        <View style={[styles.phoneContainer, { borderColor: colors.borderColor }]}>
          <Text style={[styles.phonePrefix, { color: colors.text }]}>+998</Text>
          <Text style={[styles.phoneNumber, { color: colors.text }]}>
            {formatPhone(phoneNumber)}
          </Text>
        </View>
      </View>

      {/* Register Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.registerButton,
            {
              backgroundColor:
                phoneNumber.length >= 9 ? colors.primaryColor : colors.borderColor,
            },
          ]}
          onPress={handleRegister}
          disabled={isLoading || phoneNumber.length < 9}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[
                styles.registerButtonText,
                { color: phoneNumber.length >= 9 ? '#fff' : colors.subText },
              ]}
            >
              {t('auth.register.button')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
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
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  phoneNumber: {
    fontSize: 16,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  registerButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default RegisterPage
