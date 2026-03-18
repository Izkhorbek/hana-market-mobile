import { useChatList, useMyChatQuery, useSignalRConnection, useUnreadCountQuery } from '@/api/hooks';
import ChatPageHeader from '@/components/headers/ChatPageHeader';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import { useAuthStore } from '@/modules/Auth/auth-store';
import {
  ChatItemData,
  ChatListItem,
  FilterTabs,
  FilterTabType,
  NotificationBanner,
} from '@/modules/Chat';
import { ChatRoomDto } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

/**
 * Transform API ChatListItemDto to UI ChatItemData
 * Shows the OTHER party's info (not the current user)
 */
const transformChatItem = (item: ChatRoomDto, currentUserId: number | undefined): ChatItemData => {
  // Determine if current user is the buyer or seller
  const isBuyer = item.buyer.id === currentUserId
  // Show the other party's info
  const otherUser = isBuyer ? item.seller : item.buyer

  console.log('Transforming chat item:', item);

  return {
    id: String(item.id),
    name: otherUser.username || 'Unknown',
    message: item.last_message || '',
    avatar: otherUser.profile_image_url || undefined,
    thumbnail: item.product.image_url || undefined,
    time: item.last_message_at
      ? formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })
      : '',
    isOnline: item.is_other_user_online ?? otherUser.is_online ?? false,
    unreadCount: item.unread_count,
  }
}

const ChatPage = () => {
  const { t } = useTranslations();
  const backgroundColor = useColor('background');
  const mutedTextColor = useColor('textMuted');
  const primaryColor = useColor('primary');

  const [activeTab, setActiveTab] = useState<FilterTabType>('all');
  const [showBanner, setShowBanner] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  // Connect to SignalR
  const { isConnected } = useSignalRConnection();

  // Get chat list from store (for real-time updates)
  const { chatList, setChatList } = useChatList();

  // Query chat list from API
  const {
    data: chatListResponse,
    isLoading,
    isRefetching,
    refetch
  } = useMyChatQuery({
    querySettings: {
      staleTime: 1000 * 60, // 1 minute
    }
  });

  // Query unread count
  const { data: unreadCountResponse } = useUnreadCountQuery();

  // Update store when API data changes
  useEffect(() => {
    if (chatListResponse?.data?.data?.chats) {
      setChatList(chatListResponse.data.data.chats);
    }
  }, [chatListResponse, setChatList]);

  // Use store data for rendering (updated via SignalR)
  const displayChats = chatList.length > 0 ? chatList : (chatListResponse?.data?.data?.chats || []);

  // Filter chats based on active tab
  const filteredChats = useMemo(() => {
    switch (activeTab) {
      case 'selling':
        // I'm the seller - show chats where I'm selling to someone
        return displayChats.filter(chat => chat.seller.id === userId);
      case 'buying':
        // I'm the buyer - show chats where I'm buying from someone
        return displayChats.filter(chat => chat.buyer.id === userId);
      case 'unread':
        return displayChats.filter(chat => chat.unread_count > 0);
      default:
        return displayChats;
    }
  }, [displayChats, activeTab, userId]);

  const filterTabs = [
    { key: 'all' as FilterTabType, label: t('chat.filter_all') },
    { key: 'selling' as FilterTabType, label: t('chat.filter_selling') },
    { key: 'buying' as FilterTabType, label: t('chat.filter_buying') },
    { key: 'unread' as FilterTabType, label: t('chat.filter_unread') },
  ];

  const handleChatPress = useCallback((chatId: string) => {
    router.push(`/chat/${chatId}`);
  }, []);

  const handleFilterPress = () => {
    console.log('Open filter modal');
  };

  const handleBookmarkPress = () => {
    console.log('Open bookmarks');
  };

  const handleNotificationPress = () => {
    console.log('Open notifications');
  };

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

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

  const renderChatItem = useCallback(({ item }: { item: ChatRoomDto }) => {
    const transformedItem = transformChatItem(item, userId);
    return <ChatListItem chat={transformedItem} onPress={handleChatPress} />;
  }, [handleChatPress, userId]);

  if (isLoading && !chatListResponse) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ChatPageHeader
        onFilterPress={handleFilterPress}
        onBookmarkPress={handleBookmarkPress}
        onNotificationPress={handleNotificationPress}
        hasNotifications={(unreadCountResponse?.data?.data?.unread_count ?? 0) > 0}
      />

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderChatItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
          />
        }
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
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyListContent : undefined}
      />
    </View>
  );
};

export default ChatPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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