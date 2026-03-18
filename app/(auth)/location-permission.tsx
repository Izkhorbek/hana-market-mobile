import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const LocationPermissionPage = () => {
  const router = useRouter()
  const colors = useThemeColors()
  const { t } = useTranslations()
  const updateLocation = useAuthStore((s) => s.updateLocation)
  const setLocationGranted = useAuthStore((s) => s.setLocationGranted)

  const [isLoading, setIsLoading] = useState(false)

  const handleAllowLocation = async () => {
    setIsLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert(
          t('auth.location.permission_denied_title'),
          t('auth.location.permission_denied_message'),
        )
        setIsLoading(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      await updateLocation(location.coords.latitude, location.coords.longitude)
      router.replace('/(tabs)/home')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('auth.location.error_generic')
      Alert.alert(t('auth.location.error_title'), message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    setLocationGranted(false)
    router.replace('/(tabs)/home')
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryColor + '20' }]}>
          <Ionicons name="location" size={48} color={colors.primaryColor} />
        </View>

        {/* Title */}
        <ThemedText type="title" style={styles.title}>
          {t('auth.location.title')}
        </ThemedText>

        {/* Description */}
        <Text style={[styles.description, { color: colors.subText }]}>
          {t('auth.location.description')}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.allowButton, { backgroundColor: colors.primaryColor }]}
          onPress={handleAllowLocation}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.allowButtonText}>
              {t('auth.location.allow_button')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipButtonText, { color: colors.subText }]}>
            {t('auth.location.skip_button')}
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  allowButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
})

export default LocationPermissionPage
