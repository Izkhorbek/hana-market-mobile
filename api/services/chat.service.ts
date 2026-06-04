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
} from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

export const chatService = {
  /**
   * Get my chats
   * GET /api/chats/my-chats
   */
  getMyChats: (params: ChatListParams = {}) => {
    return axiosInstance.get<ApiResponse<ChatListResponse>>(ENDPOINT.CHAT.MY_CHATS, { params })
  },

  /**
   * Create or get existing chat room
   * POST /api/chats/create-or-get
   */
  createOrGetChat: (data: CreateChatRoomRequest) => {
    return axiosInstance.post<ApiResponse<ChatRoomDto>>(ENDPOINT.CHAT.CREATE_OR_GET, data)
  },

  /**
   * Get messages for a chat room
   * GET /api/chats/{chatRoomId}/messages
   */
  getChatMessages: (chatRoomId: number, params: ChatMessagesParams = {}) => {
    return axiosInstance.get<ApiResponse<ChatMessagesResponse>>(ENDPOINT.CHAT.MESSAGES(chatRoomId), { params })
  },

  /**
   * Get unread message count
   * GET /api/chats/unread-count
   */
  getUnreadCount: () => {
    return axiosInstance.get<ApiResponse<UnreadCountResponse>>(ENDPOINT.CHAT.UNREAD_COUNT)
  },

  /**
   * Mark messages as read
   * POST /api/chats/mark-as-read
   */
  markAsRead: (data: MarkAsReadRequest) => {
    return axiosInstance.post(ENDPOINT.CHAT.MARK_AS_READ, data)
  },

  /**
   * Delete chat room for current user
   * DELETE /api/chats/room/{chatRoomId}
   */
  deleteChatRoom: (chatRoomId: number) => {
    return axiosInstance.delete<ApiResponse<Record<string, never>>>(
      ENDPOINT.CHAT.DELETE_CHAT_ROOM(chatRoomId)
    )
  },

  /**
   * Delete one message in a chat room for current user
   * DELETE /api/chats/room/{chatRoomId}/message/{messageId}
   */
  deleteChatMessage: (chatRoomId: number, messageId: number) => {
    return axiosInstance.delete<ApiResponse<Record<string, never>>>(
      ENDPOINT.CHAT.DELETE_ROOM_MESSAGES(chatRoomId, messageId)
    )
  },

  /**
   * Health check
   * GET /api/chats/health
   */
  health: () => {
    return axiosInstance.get(ENDPOINT.CHAT.HEALTH)
  },
}
