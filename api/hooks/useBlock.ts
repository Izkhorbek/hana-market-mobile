import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type {
  AcceptTermsRequest,
  AcceptTermsResponse,
  ApiResponse,
  BlockedUserDto,
  BlockUserRequest,
  BlockUserResponse,
  PaginatedResponse,
  UnblockUserRequest,
} from '../../types'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { userService } from '../services'

// Product/chat surfaces that the server re-filters once a block changes, so the
// client just needs to drop their caches and refetch.
const invalidateBlockAffectedCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: ['PRODUCTS_INFINITE'] })
  queryClient.invalidateQueries({ queryKey: ['PRODUCTS'] })
  queryClient.invalidateQueries({ queryKey: ['MAP_MARKERS'] })
  queryClient.invalidateQueries({ queryKey: ['PRODUCTS_BY_SELLER'] })
  queryClient.invalidateQueries({ queryKey: ['MY_CHATS'] })
  queryClient.invalidateQueries({ queryKey: ['UNREAD_COUNT'] })
  queryClient.invalidateQueries({ queryKey: ['BLOCKED_USERS'] })
}

/**
 * Block a user. Server-side enforcement hides both users' listings and chats;
 * we only refresh the affected caches so blocked content disappears immediately.
 */
export const useBlockUserMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<BlockUserResponse>>, Error, BlockUserRequest>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<BlockUserResponse>>, Error, BlockUserRequest>({
    mutationFn: (data) => userService.blockUser(data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateBlockAffectedCaches(queryClient)
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

/**
 * Unblock a user; the server restores mutual visibility.
 */
export const useUnblockUserMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{ blocked_user_id: number }>>, Error, UnblockUserRequest>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<{ blocked_user_id: number }>>, Error, UnblockUserRequest>({
    mutationFn: (data) => userService.unblockUser(data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateBlockAffectedCaches(queryClient)
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

/**
 * Paginated list of users the current user has blocked.
 */
export const useBlockedUsersQuery = ({
  page = 1,
  pageSize = 20,
  querySettings = {},
}: {
  page?: number
  pageSize?: number
  querySettings?: Omit<
    UseQueryOptions<AxiosResponse<ApiResponse<PaginatedResponse<BlockedUserDto>>>>,
    'queryKey' | 'queryFn'
  >
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['BLOCKED_USERS', page, pageSize],
    queryFn: () => userService.getBlockedUsers(page, pageSize),
    enabled: isAuthorized,
    ...querySettings,
  })
}

/**
 * Record Terms/Privacy acceptance on the server (Apple 1.2).
 */
export const useAcceptTermsMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<AcceptTermsResponse>>, Error, AcceptTermsRequest>,
) => {
  return useMutation<AxiosResponse<ApiResponse<AcceptTermsResponse>>, Error, AcceptTermsRequest>({
    mutationFn: (data) => userService.acceptTerms(data),
    ...options,
  })
}
