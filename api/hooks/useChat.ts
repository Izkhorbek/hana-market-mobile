import { useAuthStore } from '@/modules/Auth/auth-store';
import { useInfiniteQuery, useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import type {
    ApiResponse,
    ChatListParams,
    ChatListResponse,
    ChatMessagesParams,
    ChatMessagesResponse,
    ChatRoomDto,
    CreateChatRoomRequest,
    MarkAsReadRequest,
    UnreadCountResponse,
} from '../../types';
import { chatService } from '../services';

/**
 * Hook to query my chats
 */
export const useMyChatQuery = ({ 
  params = {}, 
  querySettings = {} 
}: { 
  params?: ChatListParams; 
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<ChatListResponse>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: ['MY_CHATS', params],
    queryFn: () => chatService.getMyChats(params),
    enabled: isAuthorized,
    ...querySettings,
  });
};

/**
 * Hook to create or get chat room
 */
export const useCreateChatMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<ChatRoomDto>>, Error, CreateChatRoomRequest>
) => {
  return useMutation<AxiosResponse<ApiResponse<ChatRoomDto>>, Error, CreateChatRoomRequest>({
    mutationKey: ["CREATE_OR_GET_CHAT"],
    mutationFn: (data) => chatService.createOrGetChat(data),
    ...options,
  });
};

/**
 * Hook to query chat messages
 */
export const useChatMessagesQuery = ({ 
  chatRoomId, 
  params = {}, 
  querySettings = {} 
}: { 
  chatRoomId: number;
  params?: ChatMessagesParams; 
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<ChatMessagesResponse>>>, 'queryKey' | 'queryFn'>;
}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: ['CHAT_MESSAGES', chatRoomId, params],
    queryFn: () => chatService.getChatMessages(chatRoomId, params),
    enabled: isAuthorized && !!chatRoomId,
    ...querySettings,
  });
};

/**
 * Hook to query chat messages with infinite pagination
 * Messages are returned oldest-first from API, we reverse for display
 */
export const useChatMessagesInfiniteQuery = ({ 
  chatRoomId, 
  pageSize = 50,
}: { 
  chatRoomId: number;
  pageSize?: number;
}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated);
  
  return useInfiniteQuery({
    queryKey: ['CHAT_MESSAGES_INFINITE', chatRoomId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await chatService.getChatMessages(chatRoomId, { page: pageParam, pageSize });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const data = lastPage?.data;
      if (data && data.has_more && data.current_page < data.total_pages) {
        return data.current_page + 1;
      }
      return undefined;
    },
    enabled: isAuthorized && !!chatRoomId,
  });
};

/**
 * Hook to query unread message count
 */
export const useUnreadCountQuery = ({ 
  querySettings = {} 
}: { 
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<UnreadCountResponse>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: ['UNREAD_COUNT'],
    queryFn: () => chatService.getUnreadCount(),
    enabled: isAuthorized,
    refetchInterval: 30000, // Refetch every 30 seconds
    ...querySettings,
  });
};

/**
 * Hook to mark messages as read
 */
export const useMarkAsReadMutation = (
  options?: UseMutationOptions<AxiosResponse<void>, Error, MarkAsReadRequest>
) => {
  return useMutation<AxiosResponse<void>, Error, MarkAsReadRequest>({
    mutationKey: ["MARK_AS_READ"],
    mutationFn: (data) => chatService.markAsRead(data),
    ...options,
  });
};

/**
 * Hook to delete a chat room for current user
 */
export const useDeleteChatRoomMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<Record<string, never>>>, Error, number>
) => {
  return useMutation<AxiosResponse<ApiResponse<Record<string, never>>>, Error, number>({
    mutationKey: ["DELETE_CHAT_ROOM"],
    mutationFn: (chatRoomId) => chatService.deleteChatRoom(chatRoomId),
    ...options,
  });
};

/**
 * Hook to delete a message from a chat room for current user
 */
export const useDeleteChatMessageMutation = (
  options?: UseMutationOptions<
    AxiosResponse<ApiResponse<Record<string, never>>>,
    Error,
    { chatRoomId: number; messageId: number }
  >
) => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, never>>>,
    Error,
    { chatRoomId: number; messageId: number }
  >({
    mutationKey: ["DELETE_CHAT_MESSAGE"],
    mutationFn: ({ chatRoomId, messageId }) => chatService.deleteChatMessage(chatRoomId, messageId),
    ...options,
  });
};

/**
 * Hook to query user online status
 */
export const useUserStatusQuery = ({ 
  userId, 
  querySettings = {} 
}: { 
  userId: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<any>>, 'queryKey' | 'queryFn'>;
}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: ['USER_STATUS', userId],
    queryFn: () => chatService.getUserStatus(userId),
    enabled: isAuthorized && !!userId,
    refetchInterval: 10000, // Refetch every 10 seconds
    ...querySettings,
  });
};
