import { useAuthStore } from '@/modules/Auth/auth-store';
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
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
