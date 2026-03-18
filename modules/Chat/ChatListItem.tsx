import RemoteImage from '@/components/shared/RemoteImage';
import { useColor } from '@/hooks/useColor';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

const ChatListItem = ({ chat, onPress }: ChatListItemProps) => {
  const textColor = useColor('text');
  const mutedTextColor = useColor('textMuted');
  const backgroundColor = useColor('background');

  console.log('Rendering ChatListItem:', chat);
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={() => onPress?.(chat.id)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {chat.avatar ? (
          <RemoteImage src={chat.avatar} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.placeholderText}>
              {chat.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {chat.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={[styles.time, { color: mutedTextColor }]}>
            {chat.time}
          </Text>
        </View>

        <View style={styles.messageRow}>
          <View style={styles.messageContainer}>
            {chat.location && (
              <Text style={[styles.location, { color: mutedTextColor }]}>
                {chat.location}{' '}
              </Text>
            )}
            <Text
              style={[styles.message, { color: mutedTextColor }]}
              numberOfLines={1}
            >
              {chat.message}
            </Text>
          </View>
          {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Thumbnail */}
      {chat.thumbnail && (
        <RemoteImage src={chat.thumbnail} style={styles.thumbnail} />
      )}
    </TouchableOpacity>
  );
};

export default ChatListItem;

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
});
