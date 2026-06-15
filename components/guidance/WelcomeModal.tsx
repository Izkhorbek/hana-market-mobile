import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { GUIDANCE_KEYS, guidanceStorage } from '@/services/storage/guidanceStorage'
import Feather from '@expo/vector-icons/Feather'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface WelcomeModalProps {
  /**
   * Gate for WHEN the welcome may appear (e.g. only after the home screen has
   * settled and no critical modal is open). Defaults to true. The "show once"
   * logic still runs only a single time per mount regardless of toggling.
   */
  active?: boolean
}

const WelcomeModalComponent: React.FC<WelcomeModalProps> = ({ active = true }) => {
  const { t } = useTranslations()
  const colors = useThemeColors()
  const user = useAuthStore((s) => s.user)

  const [visible, setVisible] = useState(false)

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Open at most once per mount.
  const handledRef = useRef(false)
  useEffect(() => {
    if (!active || handledRef.current) return
    handledRef.current = true

    let cancelled = false
    guidanceStorage.hasSeen(GUIDANCE_KEYS.homeWelcome).then((seen) => {
      if (cancelled || !isMountedRef.current) return
      if (!seen) setVisible(true)
    })

    return () => {
      cancelled = true
    }
  }, [active])

  const handleClose = useCallback(() => {
    setVisible(false)
    void guidanceStorage.markSeen(GUIDANCE_KEYS.homeWelcome)
  }, [])

  const displayName = (user?.username?.trim() || user?.phone_number?.trim() || '').toString()

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryColor }]}>
            <Feather name="smile" size={32} color="#fff" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {displayName
              ? t('guidance.welcome.title', { name: displayName })
              : t('guidance.welcome.title_no_name')}
          </Text>
          <Text style={[styles.message, { color: colors.subText }]}>
            {t('guidance.welcome.message')}
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primaryColor }]}
            onPress={handleClose}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{t('guidance.understood')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const WelcomeModal = memo(WelcomeModalComponent)
export default WelcomeModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3 },
  message: { fontSize: 15, lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
})
