import ChatPageHeader from '@/components/headers/ChatPageHeader';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import {
  ChatItemData,
  ChatListItem,
  FilterTabs,
  FilterTabType,
  NotificationBanner,
} from '@/modules/Chat';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

// Mock chat data
const MOCK_CHATS: ChatItemData[] = [
  {
    id: '1',
    name: 'Nebr Market',
    message: 'Device change detected. To keep your acco',
    time: '11:08 AM',
    isOnline: true,
    unreadCount: 1,
  },
  {
    id: '2',
    name: 'Sarah',
    message: 'Hi! Is this still available?',
    location: 'Downtown',
    time: '2 months ago',
    avatar: 'https://i.pravatar.cc/150?img=1',
    thumbnail: 'https://picsum.photos/200/200?random=1',
  },
  {
    id: '3',
    name: 'Michael Chen',
    message: 'Thanks for the quick response!',
    location: 'Eastside',
    time: '2 months ago',
    avatar: 'https://i.pravatar.cc/150?img=2',
    thumbnail: 'https://picsum.photos/200/200?random=2',
  },
  {
    id: '4',
    name: 'Emily Davis',
    message: 'Hello! Is there a discount for bulk',
    location: 'Westwood',
    time: '2 months ago',
    avatar: 'https://i.pravatar.cc/150?img=3',
    thumbnail: 'https://picsum.photos/200/200?random=3',
  },
  {
    id: '5',
    name: 'David Park',
    message: 'No problem!',
    location: 'Northside',
    time: '2 months ago',
    avatar: 'https://i.pravatar.cc/150?img=4',
    thumbnail: 'https://picsum.photos/200/200?random=4',
  },
  {
    id: '6',
    name: 'Jessica',
    message: 'Thank you!',
    location: 'Southside',
    time: '2 months ago',
    avatar: 'https://i.pravatar.cc/150?img=5',
    thumbnail: 'https://picsum.photos/200/200?random=5',
  },
  {
    id: '7',
    name: 'Ryan Lee',
    message: 'Sounds good',
    location: 'Midtown',
    time: '2 months ago',
    avatar: 'https://i.pravatar.cc/150?img=6',
    thumbnail: 'https://picsum.photos/200/200?random=6',
  },
];

const ChatPage = () => {
  const { t } = useTranslations();
  const backgroundColor = useColor('background');
  const mutedTextColor = useColor('textMuted');

  const [activeTab, setActiveTab] = useState<FilterTabType>('all');
  const [showBanner, setShowBanner] = useState(true);
  const [chats] = useState<ChatItemData[]>(MOCK_CHATS);

  const filterTabs = [
    { key: 'all' as FilterTabType, label: t('chat.filter_all') },
    { key: 'selling' as FilterTabType, label: t('chat.filter_selling') },
    { key: 'buying' as FilterTabType, label: t('chat.filter_buying') },
    { key: 'unread' as FilterTabType, label: t('chat.filter_unread') },
  ];

  const handleChatPress = (chatId: string) => {
    console.log('Open chat:', chatId);
    // TODO: Navigate to chat detail screen
  };

  const handleFilterPress = () => {
    console.log('Open filter modal');
  };

  const handleBookmarkPress = () => {
    console.log('Open bookmarks');
  };

  const handleNotificationPress = () => {
    console.log('Open notifications');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: mutedTextColor }]}>
        {t('chat.empty_state')}
      </Text>
      <Text style={[styles.emptySubtext, { color: mutedTextColor }]}>
        {t('chat.empty_state_description')}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ChatPageHeader
        onFilterPress={handleFilterPress}
        onBookmarkPress={handleBookmarkPress}
        onNotificationPress={handleNotificationPress}
        hasNotifications={true}
      />

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem chat={item} onPress={handleChatPress} />
        )}
        ListHeaderComponent={
          <>
            {showBanner && (
              <NotificationBanner
                message={t('chat.notification_banner')}
                onClose={() => setShowBanner(false)}
              />
            )}
            <FilterTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={filterTabs}
            />
          </>
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={chats.length === 0 ? styles.emptyListContent : undefined}
      />
    </View>
  );
};

export default ChatPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});