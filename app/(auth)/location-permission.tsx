import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

/**
 * Pre-permission explanation screen (App Store Guideline 5.1.1(iv) compliant).
 *
 * - The action button uses neutral wording ("Continue") — never "Allow".
 * - There is NO "Skip" affordance that lets the user bypass the system prompt.
 * - Pressing Continue takes the user straight into the native iOS/Android
 *   permission request. The native dialog is the real decision point; this
 *   screen only explains WHY location is used.
 * - A denial is respected: the user still lands on the tabs and can browse
 *   (guests are never trapped by location). We never loop the request — if the
 *   OS no longer allows asking (permanently denied), we simply continue.
 */
const LocationPermissionPage = () => {
  const router = useRouter()
  const colors = useThemeColors()
  const { t } = useTranslations()
  const updateLocation = useAuthStore((s) => s.updateLocation)
  const setGuestLocation = useAuthStore((s) => s.setGuestLocation)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [isLoading, setIsLoading] = useState(false)
  // Guards against double-taps racing two permission requests / navigations.
  const inFlightRef = useRef(false)

  const goToApp = () => router.replace('/(tabs)/home')

  const handleContinue = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setIsLoading(true)
    try {
      // Read the current state first so we only ever invoke the native prompt
      // when the OS still allows asking. This prevents re-prompting a user who
      // already made a decision (Apple: do not repeatedly request permission).
      const current = await Location.getForegroundPermissionsAsync()
      let status = current.status

      if (status !== 'granted' && current.canAskAgain) {
        // The native iOS/Android permission dialog is presented here — this is
        // the actual decision point the user reaches after pressing Continue.
        const requested = await Location.requestForegroundPermissionsAsync()
        status = requested.status
      }

      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
          // Guests can't persist location on the backend (auth-only endpoint) —
          // store it client-side. Logged-in users save it to their profile.
          if (isAuthenticated) {
            await updateLocation(
              location.coords.latitude,
              location.coords.longitude,
            )
          } else {
            setGuestLocation(
              location.coords.latitude,
              location.coords.longitude,
            )
          }
        } catch {
          // A GPS read failure must not trap the user on onboarding — the
          // in-app empty states (with "Open Settings") handle location later.
        }
      }

      // Whether granted or denied, the user proceeds into the app. A denial
      // simply means a non-location-personalised feed (default region), never
      // a dead end — this is what keeps guest browsing accessible.
      goToApp()
    } finally {
      setIsLoading(false)
      inFlightRef.current = false
    }
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

        {/* Why we use location */}
        <Text style={[styles.description, { color: colors.subText }]}>
          {t('auth.location.description')}
        </Text>

        {/* Sets the expectation that the OS dialog is the next, real step. */}
        <Text style={[styles.systemNote, { color: colors.subText }]}>
          {t('auth.location.system_note')}
        </Text>
      </View>

      {/* Single neutral action — proceeds directly to the native prompt. */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          testID="location-continue"
          style={[styles.continueButton, { backgroundColor: colors.primaryColor }]}
          onPress={handleContinue}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>
              {t('auth.location.continue_button')}
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
  systemNote: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.85,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})

export default LocationPermissionPage
