import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import {
  guidanceStorage,
  listingGuideKeyFor,
  type ListingGuideType,
} from '@/services/storage/guidanceStorage'
import Feather from '@expo/vector-icons/Feather'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SHEET_HEIGHT = 560

const TIP_KEYS = [
  'guidance.listing.tip_clear_bright',
  'guidance.listing.tip_centered',
  'guidance.listing.tip_first_best',
  'guidance.listing.tip_real_image',
  'guidance.listing.tip_clear_title',
  'guidance.listing.tip_useful_description',
]

interface ListingGuideModalProps {
  /** Which listing type this guide is for (controls the once-per-type flag). */
  type: ListingGuideType
  /**
   * When true, the guide is shown once for this `type` (if not seen before).
   * Re-renders / toggles while already shown do not re-open it.
   */
  active: boolean
}

const ListingGuideModalComponent: React.FC<ListingGuideModalProps> = ({ type, active }) => {
  const { t } = useTranslations()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const [internalVisible, setInternalVisible] = useState(false)

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Guard so the modal opens at most once per (type) per mount, regardless of re-renders.
  const handledTypeRef = useRef<ListingGuideType | null>(null)

  const open = useCallback(() => {
    slideAnim.setValue(SHEET_HEIGHT)
    setInternalVisible(true)
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start()
  }, [slideAnim])

  useEffect(() => {
    if (!active) return
    if (handledTypeRef.current === type) return
    handledTypeRef.current = type

    let cancelled = false
    const key = listingGuideKeyFor(type)
    guidanceStorage.hasSeen(key).then((seen) => {
      if (cancelled || !isMountedRef.current) return
      if (!seen) open()
    })

    return () => {
      cancelled = true
    }
  }, [active, type, open])

  const closeSheet = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (!isMountedRef.current) return
      setInternalVisible(false)
      slideAnim.setValue(SHEET_HEIGHT)
    })
    // Persist the seen flag (best-effort; never blocks).
    void guidanceStorage.markSeen(listingGuideKeyFor(type))
  }, [slideAnim, type])

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeSheet}
    >
      <Pressable style={styles.backdrop} onPress={closeSheet} />

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

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('guidance.listing.title')}
          </Text>
          <TouchableOpacity
            onPress={closeSheet}
            hitSlop={12}
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
          >
            <Feather name="x" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {TIP_KEYS.map((key) => (
            <View key={key} style={styles.tipRow}>
              <View style={[styles.bullet, { backgroundColor: colors.primaryColor }]}>
                <Feather name="check" size={13} color="#fff" />
              </View>
              <Text style={[styles.tipText, { color: colors.text }]}>{t(key)}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primaryColor }]}
            onPress={closeSheet}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{t('guidance.understood')}</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'ios' && <View style={styles.iosBottom} />}
      </Animated.View>
    </Modal>
  )
}

const ListingGuideModal = memo(ListingGuideModalComponent)
export default ListingGuideModal

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
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
  dragHandle: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handleBar: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  title: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, flex: 1, paddingRight: 12 },
  scrollContent: { paddingBottom: 12, paddingTop: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  tipText: { fontSize: 15, lineHeight: 21, flex: 1 },
  footer: { paddingTop: 8, paddingBottom: 4 },
  primaryButton: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  iosBottom: { height: 12 },
})
