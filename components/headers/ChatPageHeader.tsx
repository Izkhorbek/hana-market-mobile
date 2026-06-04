import { HEADER_HEIGHT } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useResponsive } from '@/hooks/useResponsive'
import { Bell, Bookmark, SlidersHorizontal } from 'lucide-react-native'
import { useMemo } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'

interface ChatPageHeaderProps {
  onFilterPress?: () => void;
  onBookmarkPress?: () => void;
  onNotificationPress?: () => void;
  hasNotifications?: boolean;
}

const ChatPageHeader = ({
  onFilterPress,
  onBookmarkPress,
  onNotificationPress,
  hasNotifications = false,
}: ChatPageHeaderProps) => {
  const { t } = useTranslations()
  const colors = useThemeColors()
  const { ms, fs } = useResponsive()

  const responsiveStyles = useMemo(() => ({
    container: {
      paddingHorizontal: ms(20),
      paddingBottom: ms(8),
    },
    title: {
      fontSize: fs(24),
    },
    iconsContainer: {
      gap: ms(16),
    },
    iconSize: ms(24),
    iconButton: {
      padding: ms(4),
    },
    notificationDot: {
      top: ms(2),
      right: ms(2),
      width: ms(10),
      height: ms(10),
      borderRadius: ms(5),
    },
  }), [ms, fs])

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.borderColor,
        },
        responsiveStyles.container,
      ]}
    >
      <ThemedText style={[styles.title, { color: colors.primaryColor }, responsiveStyles.title]}>
        {t('chat.title')}
      </ThemedText>

      <ThemedView style={[styles.iconsContainer, responsiveStyles.iconsContainer]}>
        {/* Each icon renders only when its handler is supplied, so callers can
            omit actions that have no destination yet (e.g. no filter modal or
            notifications screen exists). Prevents dead, no-op buttons. */}
        {onFilterPress && (
          <TouchableOpacity onPress={onFilterPress} style={[styles.iconButton, responsiveStyles.iconButton]}>
            <SlidersHorizontal size={responsiveStyles.iconSize} color={colors.blackIcon} strokeWidth={2} />
          </TouchableOpacity>
        )}

        {onBookmarkPress && (
          <TouchableOpacity onPress={onBookmarkPress} style={[styles.iconButton, responsiveStyles.iconButton]}>
            <Bookmark size={responsiveStyles.iconSize} color={colors.blackIcon} strokeWidth={2} />
          </TouchableOpacity>
        )}

        {onNotificationPress && (
          <TouchableOpacity onPress={onNotificationPress} style={[styles.iconButton, responsiveStyles.iconButton]}>
            <Bell size={responsiveStyles.iconSize} color={colors.blackIcon} strokeWidth={2} />
            {hasNotifications && <ThemedView style={[styles.notificationDot, responsiveStyles.notificationDot]} />}
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  )
}

export default ChatPageHeader

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
})
