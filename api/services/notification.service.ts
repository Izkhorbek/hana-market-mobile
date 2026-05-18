import type {
  ApiResponse,
  DeactivatePushTokenDto,
  MarkNotificationsReadDto,
  NotificationListItemDto,
  PaginatedResponse,
  RegisterPushTokenDto,
} from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

export interface NotificationListParams {
  page?: number
  pageSize?: number
}

export interface NotificationUnreadCountDto {
  unread_count: number
}

export const notificationService = {
  /**
   * Register device push token (FCM / APNS) with the backend.
   * Call this after login and whenever the token refreshes.
   * POST /notifications/token/register
   */
  registerToken: (data: RegisterPushTokenDto) =>
    axiosInstance.post<ApiResponse<void>>(
      ENDPOINT.NOTIFICATIONS.REGISTER_TOKEN,
      data,
    ),

  /**
   * Deactivate push token on logout so the backend stops sending
   * push notifications to this device.
   * POST /notifications/token/deactivate
   */
  deactivateToken: (data: DeactivatePushTokenDto) =>
    axiosInstance.post<ApiResponse<void>>(
      ENDPOINT.NOTIFICATIONS.DEACTIVATE_TOKEN,
      data,
    ),

  /**
   * Paginated notification list for the current user.
   * GET /notifications
   */
  getList: (params?: NotificationListParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<NotificationListItemDto>>>(
      ENDPOINT.NOTIFICATIONS.LIST,
      { params },
    ),

  /**
   * Total unread notification count.
   * GET /notifications/unread-count
   */
  getUnreadCount: () =>
    axiosInstance.get<ApiResponse<NotificationUnreadCountDto>>(
      ENDPOINT.NOTIFICATIONS.UNREAD_COUNT,
    ),

  /**
   * Mark notifications as read.
   * Pass an empty ids array to mark ALL unread as read.
   * POST /notifications/mark-read
   */
  markAsRead: (data: MarkNotificationsReadDto) =>
    axiosInstance.post<ApiResponse<void>>(
      ENDPOINT.NOTIFICATIONS.MARK_AS_READ,
      data,
    ),

  /**
   * Delete a single notification by id.
   * DELETE /notifications/:id
   */
  delete: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(ENDPOINT.NOTIFICATIONS.DELETE(id)),
}
