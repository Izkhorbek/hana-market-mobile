import axiosInstance from '../api';
import type {
    ChatListParams,
    ChatListResponse,
    ChatMessagesParams,
    ChatMessagesResponse,
    ChatRoomDto,
    CreateChatRoomRequest,
    MarkAsReadRequest,
    UnreadCountResponse,
} from '../types';

export const chatService = {
  /**
   * Get my chats
   * GET /api/chats/my-chats
   */
  getMyChats: (params: ChatListParams = {}) => {
    return axiosInstance.get<ChatListResponse>('/chats/my-chats', { params });
  },

  /**
   * Create or get existing chat room
   * POST /api/chats/create-or-get
   */
  createOrGetChat: (data: CreateChatRoomRequest) => {
    return axiosInstance.post<ChatRoomDto>('/chats/create-or-get', data);
  },

  /**
   * Get messages for a chat room
   * GET /api/chats/{chatRoomId}/messages
   */
  getChatMessages: (chatRoomId: number, params: ChatMessagesParams = {}) => {
    return axiosInstance.get<ChatMessagesResponse>(`/chats/${chatRoomId}/messages`, { params });
  },

  /**
   * Get unread message count
   * GET /api/chats/unread-count
   */
  getUnreadCount: () => {
    return axiosInstance.get<UnreadCountResponse>('/chats/unread-count');
  },

  /**
   * Mark messages as read
   * POST /api/chats/mark-as-read
   */
  markAsRead: (data: MarkAsReadRequest) => {
    return axiosInstance.post('/chats/mark-as-read', data);
  },

  /**
   * Get user online status
   * GET /api/chats/user-status/{userId}
   */
  getUserStatus: (userId: number) => {
    return axiosInstance.get(`/chats/user-status/${userId}`);
  },

  /**
   * Health check
   * GET /api/chats/health
   */
  health: () => {
    return axiosInstance.get('/chats/health');
  },
};
