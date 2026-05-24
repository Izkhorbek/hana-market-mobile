import RemoteImage from '@/components/shared/RemoteImage'
import { useColor } from '@/hooks/useColor'
import useResponsive from '@/hooks/useResponsive'
import React, { memo, useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface ChatItemData {
  id: string;
  name: string;
  message: string;
  avatar?: string;
  thumbnail?: string;
  location?: string;
  time: string;
  isOnline?: boolean;
  unreadCount?: number;
}

interface ChatListItemProps {
  chat: ChatItemData;
  onPress?: (chatId: string) => void;
}

const ChatListItemComponent = ({ chat, onPress }: ChatListItemProps) => {
  const textColor = useColor('text')
  const mutedTextColor = useColor('textMuted')
  const backgroundColor = useColor('background')
  const { ms, fs, isSmallDevice, isLargeDevice } = useResponsive()

  // Responsive sizes
  const responsiveStyles = useMemo(() => ({
    container: {
      paddingHorizontal: ms(16),
      paddingVertical: ms(12),
      gap: ms(12),
    },
    avatar: {
      width: ms(48),
      height: ms(48),
      borderRadius: ms(24),
    },
    onlineIndicator: {
      width: ms(14),
      height: ms(14),
      borderRadius: ms(7),
      borderWidth: ms(2.5),
    },
    name: {
      fontSize: fs(16),
    },
    time: {
      fontSize: fs(12),
      marginLeft: ms(8),
    },
    location: {
      fontSize: fs(13),
    },
    message: {
      fontSize: fs(13),
    },
    badge: {
      minWidth: ms(20),
      height: ms(20),
      borderRadius: ms(10),
      paddingHorizontal: ms(6),
    },
    badgeText: {
      fontSize: fs(12),
    },
    thumbnail: {
      width: ms(52),
      height: ms(52),
      borderRadius: ms(8),
    },
    placeholderText: {
      fontSize: fs(18),
    },
  }), [ms, fs])

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor },
        responsiveStyles.container
      ]}
      onPress={() => onPress?.(chat.id)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {chat.avatar ? (
          <RemoteImage
            src={chat.avatar}
            style={responsiveStyles.avatar}
            cachePolicy='disk'
            requestedWidth={96}
            requestedHeight={96}
            requestedQuality={65}
          />
        ) : (
          <View style={[responsiveStyles.avatar, styles.placeholderAvatar]}>
            <Text style={[styles.placeholderText, responsiveStyles.placeholderText]}>
              {chat.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {chat.isOnline && <View style={[styles.onlineIndicator, responsiveStyles.onlineIndicator]} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: textColor }, responsiveStyles.name]} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={[styles.time, { color: mutedTextColor }, responsiveStyles.time]}>
            {chat.time}
          </Text>
        </View>

        <View style={styles.messageRow}>
          <View style={styles.messageContainer}>
            {chat.location && (
              <Text style={[styles.location, { color: mutedTextColor }, responsiveStyles.location]}>
                {chat.location}{' '}
              </Text>
            )}
            <Text
              style={[styles.message, { color: mutedTextColor }, responsiveStyles.message]}
              numberOfLines={1}
            >
              {chat.message}
            </Text>
          </View>
          {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
            <View style={[styles.badge, responsiveStyles.badge]}>
              <Text style={[styles.badgeText, responsiveStyles.badgeText]}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Thumbnail */}
      <RemoteImage
        src={chat.thumbnail}
        style={responsiveStyles.thumbnail}
        cachePolicy='disk'
        requestedWidth={104}
        requestedHeight={104}
        requestedQuality={60}
      />
    </TouchableOpacity>
  )
}

const ChatListItem = memo(ChatListItemComponent)

export default ChatListItem

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholderAvatar: {
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  location: {
    fontSize: 13,
  },
  message: {
    fontSize: 13,
    flex: 1,
  },
  badge: {
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
})
