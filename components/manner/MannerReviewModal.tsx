import { useCreateMannerReviewMutation } from '@/api/hooks/useManner'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { CreateMannerReviewRequest } from '@/types'
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

const SHEET_HEIGHT = 640
const COMMENT_MAX_LENGTH = 500

type TagKey =
  | 'isPolite'
  | 'isFastResponse'
  | 'isOnTime'
  | 'isFairPrice'
  | 'isNoShow'
  | 'isRude'
  | 'isSpam'

const POSITIVE_TAGS: { key: TagKey; labelKey: string }[] = [
  { key: 'isPolite', labelKey: 'mannerReview.tag_polite' },
  { key: 'isFastResponse', labelKey: 'mannerReview.tag_fast_response' },
  { key: 'isOnTime', labelKey: 'mannerReview.tag_on_time' },
  { key: 'isFairPrice', labelKey: 'mannerReview.tag_fair_price' },
]

const NEGATIVE_TAGS: { key: TagKey; labelKey: string }[] = [
  { key: 'isNoShow', labelKey: 'mannerReview.tag_no_show' },
  { key: 'isRude', labelKey: 'mannerReview.tag_rude' },
  { key: 'isSpam', labelKey: 'mannerReview.tag_spam' },
]

interface MannerReviewModalProps {
  visible: boolean
  chatRoomId: number | null
  targetUserId: number | null
  onClose: () => void
}

const MannerReviewModalComponent: React.FC<MannerReviewModalProps> = ({
  visible,
  chatRoomId,
  targetUserId,
  onClose,
}) => {
  const { t } = useTranslations()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const [internalVisible, setInternalVisible] = useState(false)

  const [rating, setRating] = useState<number>(0)
  const [tags, setTags] = useState<Record<TagKey, boolean>>({
    isPolite: false,
    isFastResponse: false,
    isOnTime: false,
    isFairPrice: false,
    isNoShow: false,
    isRude: false,
    isSpam: false,
  })
  const [comment, setComment] = useState('')

  const { mutate: createReview, isPending } = useCreateMannerReviewMutation()

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (visible && chatRoomId && targetUserId) {
      setRating(0)
      setTags({
        isPolite: false,
        isFastResponse: false,
        isOnTime: false,
        isFairPrice: false,
        isNoShow: false,
        isRude: false,
        isSpam: false,
      })
      setComment('')
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
  }, [visible, chatRoomId, targetUserId])

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
    if (isPending) return
    closeSheet(onClose)
  }, [isPending, closeSheet, onClose])

  const toggleTag = useCallback(
    (key: TagKey) => {
      if (isPending) return
      setTags((prev) => ({ ...prev, [key]: !prev[key] }))
    },
    [isPending],
  )

  const handleSubmit = useCallback(() => {
    if (isPending) return
    if (!chatRoomId || !targetUserId) return

    if (rating < 1 || rating > 5) {
      Alert.alert(t('alert.error_title'), t('mannerReview.error_rating_required'))
      return
    }

    const payload: CreateMannerReviewRequest = {
      chatRoomId,
      targetUserId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      ...tags,
      ...(comment.trim().length > 0 ? { comment: comment.trim() } : {}),
    }

    createReview(payload, {
      onSuccess: () => {
        if (!isMountedRef.current) return
        closeSheet(() => {
          if (!isMountedRef.current) return
          onClose()
          Alert.alert(t('mannerReview.success_title'), t('mannerReview.success_message'))
        })
      },
      onError: (error: any) => {
        if (!isMountedRef.current) return
        const status: number | undefined = error?.response?.status
        let message: string

        if (status === 409) {
          message = t('mannerReview.error_duplicate')
        } else if (status === 403) {
          message = t('mannerReview.error_forbidden')
        } else if (status === 401) {
          message = t('mannerReview.error_unauthorized')
        } else if (status === 400) {
          // Eligibility / validation — prefer the backend's friendly message.
          message = parseApiError(error, t('mannerReview.error_not_eligible'))
        } else if (status !== undefined && status >= 500) {
          message = t('mannerReview.error_server')
        } else if (!error?.response) {
          message = t('mannerReview.error_network')
        } else {
          message = parseApiError(error, t('mannerReview.error_generic'))
        }

        Alert.alert(t('alert.error_title'), message)
      },
    })
  }, [isPending, chatRoomId, targetUserId, rating, tags, comment, createReview, closeSheet, onClose, t])

  const renderTag = (item: { key: TagKey; labelKey: string }, negative: boolean) => {
    const selected = tags[item.key]
    const activeColor = negative ? '#DC2626' : colors.primaryColor
    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.chip,
          {
            borderColor: selected ? activeColor : colors.borderColor,
            backgroundColor: selected ? activeColor : 'transparent',
          },
        ]}
        onPress={() => toggleTag(item.key)}
        activeOpacity={0.8}
        disabled={isPending}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
      >
        <Text
          style={[
            styles.chipText,
            { color: selected ? '#fff' : colors.text },
          ]}
        >
          {t(item.labelKey)}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />

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
        <View style={styles.dragHandle}>
          <View style={[styles.handleBar, { backgroundColor: colors.borderColor }]} />
        </View>

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {t('mannerReview.title')}
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
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            {t('mannerReview.subtitle')}
          </Text>

          {/* Rating 1–5 */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {t('mannerReview.rating_label')}
          </Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= rating
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => !isPending && setRating(value)}
                  activeOpacity={0.7}
                  disabled={isPending}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`${value}`}
                >
                  <Feather
                    name="star"
                    size={34}
                    color={active ? '#F59E0B' : colors.borderColor}
                    style={styles.star}
                  />
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Positive tags */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {t('mannerReview.positive_label')}
          </Text>
          <View style={styles.chipWrap}>
            {POSITIVE_TAGS.map((item) => renderTag(item, false))}
          </View>

          {/* Negative tags */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {t('mannerReview.negative_label')}
          </Text>
          <View style={styles.chipWrap}>
            {NEGATIVE_TAGS.map((item) => renderTag(item, true))}
          </View>

          {/* Comment */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {t('mannerReview.comment_label')}
          </Text>
          <View
            style={[
              styles.textAreaWrapper,
              { borderColor: colors.borderColor, backgroundColor: colors.card },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder={t('mannerReview.comment_placeholder')}
              placeholderTextColor={colors.subText}
              multiline
              maxLength={COMMENT_MAX_LENGTH}
              value={comment}
              onChangeText={setComment}
              editable={!isPending}
              textAlignVertical="top"
              accessibilityLabel={t('mannerReview.comment_label')}
            />
            <Text style={[styles.charCount, { color: colors.subText }]}>
              {comment.length}/{COMMENT_MAX_LENGTH}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: rating >= 1 ? colors.primaryColor : colors.borderColor,
                opacity: isPending ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={isPending || rating < 1}
            accessibilityRole="button"
            accessibilityState={{ disabled: isPending || rating < 1 }}
          >
            {isPending ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <Text style={styles.submitText}>{t('mannerReview.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {Platform.OS === 'ios' && <View style={styles.iosBottom} />}
      </Animated.View>
    </Modal>
  )
}

const MannerReviewModal = memo(MannerReviewModalComponent)
export default MannerReviewModal

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
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
  scrollContent: {
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  star: {
    marginRight: 2,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 90,
    marginBottom: 4,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 62,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
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
  iosBottom: {
    height: 12,
  },
})
