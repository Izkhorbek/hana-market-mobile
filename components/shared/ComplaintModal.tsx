import { useCreateComplaintMutation } from '@/api/hooks/useComplaint'
import { EComplaintType } from '@/constants/enums'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { parseApiError } from '@/utils/apiError'
import Feather from '@expo/vector-icons/Feather'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ── Constants ─────────────────────────────────────────────────────────────────
const SHEET_HEIGHT = 580
const DESCRIPTION_MAX_LENGTH = 500

// ── Complaint type options (order matches EComplaintType declaration) ─────────
const COMPLAINT_TYPE_OPTIONS: { value: EComplaintType; labelKey: string }[] = [
  { value: EComplaintType.SPAM, labelKey: 'complaint.types.spam' },
  { value: EComplaintType.INAPPROPRIATE, labelKey: 'complaint.types.inappropriate' },
  { value: EComplaintType.FRAUD, labelKey: 'complaint.types.fraud' },
  { value: EComplaintType.OTHER, labelKey: 'complaint.types.other' },
]

// ── Props ─────────────────────────────────────────────────────────────────────
interface ComplaintModalProps {
  /** Controls whether the modal should be presented */
  visible: boolean
  /** The product being reported. Pass null when reporting a user instead. */
  productId: number | null
  /**
   * The user being reported (e.g. from a chat or seller page). Pass null/omit
   * when reporting a product. Exactly one of productId / userId should be set.
   */
  userId?: number | null
  /** Called when the modal should be dismissed (after animation completes) */
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
const ComplaintModalComponent: React.FC<ComplaintModalProps> = ({
  visible,
  productId,
  userId = null,
  onClose,
}) => {
  const { t } = useTranslations()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()

  // ── Animation ─────────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current
  // Internal RN Modal visibility – controlled by animation lifecycle, NOT
  // directly by the `visible` prop, to allow the close animation to complete
  // before the Modal actually unmounts.
  const [internalVisible, setInternalVisible] = useState(false)

  // ── Form state ────────────────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<EComplaintType | null>(null)
  const [description, setDescription] = useState('')

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate: createComplaint, isPending } = useCreateComplaintMutation()

  // ── Mount guard (prevents setState on unmounted component) ────────────────
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ── Open trigger ─────────────────────────────────────────────────────────
  // Reacts only to the modal becoming visible; closing is handled internally
  // so we avoid triggering a second close animation after submission.
  useEffect(() => {
    if (visible && (productId !== null || userId !== null)) {
      // Reset form for each new report session
      setSelectedType(null)
      setDescription('')
      // Ensure the sheet starts from below the screen
      slideAnim.setValue(SHEET_HEIGHT)
      setInternalVisible(true)
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, productId, userId])

  // ── Close sheet (with animation) ──────────────────────────────────────────
  const closeSheet = useCallback(
    (onDone?: () => void) => {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        if (!isMountedRef.current) return
        setInternalVisible(false)
        slideAnim.setValue(SHEET_HEIGHT)
        onDone?.()
      })
    },
    [slideAnim],
  )

  const handleClose = useCallback(() => {
    // Block dismissal while a request is in-flight
    if (isPending) return
    closeSheet(onClose)
  }, [isPending, closeSheet, onClose])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (isPending) return
    if (!productId && !userId) return

    if (!selectedType) {
      Alert.alert(t('alert.error_title'), t('complaint.error_no_reason'))
      return
    }

    const trimmedDescription = description.trim()

    createComplaint(
      {
        // Report a product OR a user — the backend accepts either target.
        ...(productId ? { reported_product_id: productId } : {}),
        ...(userId ? { reported_user_id: userId } : {}),
        complaint_type: selectedType,
        ...(trimmedDescription.length > 0 ? { description: trimmedDescription } : {}),
      },
      {
        onSuccess: () => {
          if (!isMountedRef.current) return
          closeSheet(() => {
            if (!isMountedRef.current) return
            onClose()
            // Show success feedback after modal is fully dismissed
            Alert.alert(t('complaint.success_title'), t('complaint.success_message'))
          })
        },
        onError: (error: any) => {
          if (!isMountedRef.current) return
          const status: number | undefined = error?.response?.status
          let message: string

          if (status === 401) {
            message = t('complaint.error_unauthorized')
          } else if (status !== undefined && status >= 500) {
            message = t('complaint.error_server')
          } else if (!error?.response) {
            // No response object → network / timeout error
            message = t('complaint.error_network')
          } else {
            message = parseApiError(error, t('complaint.error_generic'))
          }

          Alert.alert(t('alert.error_title'), message)
        },
      },
    )
  }, [
    isPending,
    productId,
    userId,
    selectedType,
    description,
    createComplaint,
    closeSheet,
    onClose,
    t,
  ])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop – blocks interaction behind the sheet */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* ── Drag handle ────────────────────────────────────────────────── */}
        <View style={styles.dragHandle}>
          <View style={[styles.handleBar, { backgroundColor: colors.borderColor }]} />
        </View>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {t('complaint.title')}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={12}
            disabled={isPending}
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
          >
            <Feather name="x" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Subtitle ─────────────────────────────────────────────────── */}
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            {t('complaint.subtitle')}
          </Text>

          {/* ── Complaint type list ───────────────────────────────────────── */}
          <View
            style={[
              styles.typeListContainer,
              { borderColor: colors.borderColor },
            ]}
          >
            {COMPLAINT_TYPE_OPTIONS.map((item, index) => {
              const isSelected = selectedType === item.value
              const isLast = index === COMPLAINT_TYPE_OPTIONS.length - 1

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.typeRow,
                    !isLast && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.borderColor,
                    },
                  ]}
                  onPress={() => setSelectedType(item.value)}
                  activeOpacity={0.7}
                  disabled={isPending}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                >
                  {/* Radio indicator */}
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: isSelected
                          ? colors.primaryColor
                          : colors.borderColor,
                        backgroundColor: isSelected
                          ? colors.primaryColor
                          : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>

                  <Text
                    style={[
                      styles.typeLabel,
                      {
                        color: isSelected ? colors.primaryColor : colors.text,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {t(item.labelKey)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* ── Description (optional) ───────────────────────────────────── */}
          <Text style={[styles.descLabel, { color: colors.text }]}>
            {t('complaint.description_label')}
          </Text>
          <View
            style={[
              styles.textAreaWrapper,
              {
                borderColor: colors.borderColor,
                backgroundColor: colors.card,
              },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder={t('complaint.description_placeholder')}
              placeholderTextColor={colors.subText}
              multiline
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={description}
              onChangeText={setDescription}
              editable={!isPending}
              textAlignVertical="top"
              accessibilityLabel={t('complaint.description_label')}
            />
            <Text style={[styles.charCount, { color: colors.subText }]}>
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </Text>
          </View>
        </ScrollView>

        {/* ── Submit button ─────────────────────────────────────────────── */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: selectedType
                  ? colors.primaryColor
                  : colors.borderColor,
                opacity: isPending ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={isPending || !selectedType}
            accessibilityRole="button"
            accessibilityState={{ disabled: isPending || !selectedType }}
          >
            {isPending ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <Text style={styles.submitText}>{t('complaint.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* iOS home indicator spacing */}
        {Platform.OS === 'ios' && <View style={styles.iosBottom} />}
      </Animated.View>
    </Modal>
  )
}

const ComplaintModal = memo(ComplaintModalComponent)
export default ComplaintModal

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
  },

  // Drag handle
  dragHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // Header
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Scroll content
  scrollContent: {
    paddingBottom: 12,
  },

  // Subtitle
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },

  // Type list
  typeListContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },

  // Radio button
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Type label
  typeLabel: {
    fontSize: 15,
    flex: 1,
  },

  // Description
  descLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 100,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 72,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },

  // Submit
  submitContainer: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // iOS safe-area padding
  iosBottom: {
    height: 12,
  },
})
