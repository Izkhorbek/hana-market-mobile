import { useChatList, useDeleteChatRoomMutation, useMyChatQuery, useSignalRConnection, useUnreadCountQuery } from '@/api/hooks';
import ChatPageHeader from '@/components/headers/ChatPageHeader';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuthStore } from '@/modules/Auth/auth-store';
import {
  ChatItemData,
  ChatListItem,
  FilterTabs,
  FilterTabType
} from '@/modules/Chat';
import { ChatRoomDto } from '@/types';
import { parseBackendDateTime } from '@/utils/dateTime';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Transform API ChatListItemDto to UI ChatItemData
 * Shows the OTHER party's info (not the current user)
 */
const transformChatItem = (item: ChatRoomDto, currentUserId: number | undefined): ChatItemData => {
  // Determine if current user is the buyer or seller
  const isBuyer = item.buyer.id === currentUserId
  // Show the other party's info
  const otherUser = isBuyer ? item.seller : item.buyer

  return {
    id: String(item.id),
    name: otherUser.username || 'Unknown',
    message: item.last_message || '',
    avatar: otherUser.profile_image_url || undefined,
    thumbnail: item.product.image_url || undefined,
    time: item.last_message_at
      ? formatDistanceToNow(parseBackendDateTime(item.last_message_at), { addSuffix: true })
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
  const insets = useSafeAreaInsets();
  const { ms, fs } = useResponsive();

  const [activeTab, setActiveTab] = useState<FilterTabType>('all');
  // const [showBanner, setShowBanner] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; isError?: boolean }>({
    visible: false,
    message: '',
    isError: false,
  });
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  // Connect to SignalR
  const { isConnected } = useSignalRConnection();

  // Get chat list from store (for real-time updates)
  const { chatList, setChatList } = useChatList();

  const { mutate: deleteChatRoom } = useDeleteChatRoomMutation({
    onSuccess: (_res, chatRoomId) => {
      setChatList(chatList.filter((chat) => chat.id !== chatRoomId));
      queryClient.invalidateQueries({ queryKey: ['MY_CHATS'] });
      queryClient.invalidateQueries({ queryKey: ['UNREAD_COUNT'] });
      setSnackbar({ visible: true, message: t('chat.delete_chat_success'), isError: false });
    },
    onError: () => {
      setSnackbar({ visible: true, message: t('chat.delete_chat_error'), isError: true });
    },
    onSettled: () => {
      setDeletingChatId(null);
    },
  });

  useEffect(() => {
    if (!snackbar.visible) return;
    const timer = setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, visible: false }));
    }, 2200);
    return () => clearTimeout(timer);
  }, [snackbar.visible]);

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

  const handleDeleteChatRoom = useCallback((chat: ChatRoomDto) => {
    Alert.alert(
      t('chat.delete_chat_title'),
      t('chat.delete_chat_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.delete'),
          style: 'destructive',
          onPress: () => {
            setDeletingChatId(String(chat.id));
            deleteChatRoom(chat.id);
          },
        },
      ]
    );
  }, [deleteChatRoom, t]);

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { paddingHorizontal: ms(40) }]}>
      <Text style={[styles.emptyText, { color: mutedTextColor, fontSize: fs(18), marginBottom: ms(8) }]}>
        {t('chat.empty_state')}
      </Text>
      <Text style={[styles.emptySubtext, { color: mutedTextColor, fontSize: fs(14) }]}>
        {t('chat.empty_state_description')}
      </Text>
    </View>
  );

  const renderChatItem = useCallback(({ item }: { item: ChatRoomDto }) => {
    const transformedItem = transformChatItem(item, userId);
    const isDeleting = deletingChatId === String(item.id);

    return (
      <Swipeable
        overshootRight={false}
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.swipeDeleteAction}
            onPress={() => handleDeleteChatRoom(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <Trash2 size={18} color='#fff' />
            )}
          </TouchableOpacity>
        )}
      >
        <View style={styles.chatItemMain}>
          <ChatListItem chat={transformedItem} onPress={handleChatPress} />
        </View>
      </Swipeable>
    );
  }, [deletingChatId, handleChatPress, handleDeleteChatRoom, userId]);

  if (isLoading && !chatListResponse) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
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
              {/* {showBanner && (
                <NotificationBanner
                  message={t('chat.notification_banner')}
                  onClose={() => setShowBanner(false)}
                />
              )} */}
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

        {snackbar.visible && (
          <View style={[styles.snackbar, { backgroundColor: snackbar.isError ? '#DC2626' : '#16A34A', bottom: insets.bottom + 16 }]}>
            <Text style={styles.snackbarText}>{snackbar.message}</Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
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
  chatItemMain: {
    backgroundColor: 'transparent',
  },
  swipeDeleteAction: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
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
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});