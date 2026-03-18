import { HEADER_HEIGHT } from '@/constants/appLimits';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslations } from '@/hooks/use-translation';
import { Bell, Bookmark, SlidersHorizontal } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

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
  const { t } = useTranslations();
  const colors = useThemeColors();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.borderColor,
        },
      ]}
    >
      <ThemedText style={[styles.title, { color: colors.blackIcon }]}>
        {t('chat.title')}
      </ThemedText>

      <ThemedView style={styles.iconsContainer}>
        <TouchableOpacity onPress={onFilterPress} style={styles.iconButton}>
          <SlidersHorizontal size={24} color={colors.blackIcon} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onBookmarkPress} style={styles.iconButton}>
          <Bookmark size={24} color={colors.blackIcon} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
          <Bell size={24} color={colors.blackIcon} strokeWidth={2} />
          {hasNotifications && <ThemedView style={styles.notificationDot} />}
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

export default ChatPageHeader;

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
});
