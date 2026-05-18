import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type {
  ApiResponse,
  MarkNotificationsReadDto,
  NotificationListItemDto,
  PaginatedResponse,
} from '../../types'
import {
  notificationService,
  NotificationListParams,
  NotificationUnreadCountDto,
} from '../services/notification.service'

export const NOTIFICATION_KEYS = {
  all: ['NOTIFICATIONS'] as const,
  list: (params?: NotificationListParams) =>
    ['NOTIFICATIONS', 'list', params] as const,
  unreadCount: () => ['NOTIFICATIONS', 'unread-count'] as const,
}

/**
 * Paginated notification list.
 */
export const useNotificationsQuery = ({
  params,
  querySettings = {},
}: {
  params?: NotificationListParams
  querySettings?: Omit<
    UseQueryOptions<
      AxiosResponse<ApiResponse<PaginatedResponse<NotificationListItemDto>>>
    >,
    'queryKey' | 'queryFn'
  >
} = {}) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.list(params),
    queryFn: () => notificationService.getList(params),
    ...querySettings,
  })

/**
 * Unread notification count.
 * Polls every 60 s so the badge stays fresh without a WebSocket.
 */
export const useNotificationUnreadCountQuery = (
  querySettings: Omit<
    UseQueryOptions<AxiosResponse<ApiResponse<NotificationUnreadCountDto>>>,
    'queryKey' | 'queryFn'
  > = {},
) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 60_000,
    ...querySettings,
  })

/**
 * Mark one or more notifications as read.
 * Pass { ids: [] } to mark all unread as read.
 */
export const useMarkNotificationsReadMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MarkNotificationsReadDto) =>
      notificationService.markAsRead(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

/**
 * Delete a single notification.
 */
export const useDeleteNotificationMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}
