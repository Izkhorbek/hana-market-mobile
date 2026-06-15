import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import Feather from '@expo/vector-icons/Feather'
import React, { memo } from 'react'
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SuccessPostModalProps {
  visible: boolean
  /** Created product id, if the API returned one. When null, the "View listing" action is hidden. */
  productId: number | null
  /** Called for "Go home / Close" — should run the screen's existing post-success navigation. */
  onClose: () => void
  /** Called for "View listing" with the product id. Only invoked when productId is present. */
  onViewListing?: (productId: number) => void
}

const SuccessPostModalComponent: React.FC<SuccessPostModalProps> = ({
  visible,
  productId,
  onClose,
  onViewListing,
}) => {
  const { t } = useTranslations()
  const colors = useThemeColors()

  const canView = productId != null && productId > 0 && !!onViewListing

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryColor }]}>
            <Feather name="check" size={34} color="#fff" strokeWidth={3} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('guidance.success.title')}
          </Text>
          <Text style={[styles.message, { color: colors.subText }]}>
            {t('guidance.success.message')}
          </Text>

          <View style={styles.buttons}>
            {canView && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primaryColor }]}
                onPress={() => onViewListing!(productId as number)}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>{t('guidance.success.view_listing')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                canView ? styles.secondaryButton : styles.primaryButton,
                canView
                  ? { borderColor: colors.borderColor }
                  : { backgroundColor: colors.primaryColor },
              ]}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text
                style={canView ? [styles.secondaryButtonText, { color: colors.text }] : styles.primaryButtonText}
              >
                {t('guidance.success.go_home')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const SuccessPostModal = memo(SuccessPostModalComponent)
export default SuccessPostModal

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
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3 },
  message: { fontSize: 15, lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  buttons: { width: '100%', gap: 10 },
  primaryButton: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
})
