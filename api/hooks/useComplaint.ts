import { useAuthStore } from '@/modules/Auth/auth-store'
import { useInfiniteQuery, useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import { complaintService } from '../services'
import type {
    ApiResponse,
    ComplaintResponseDto,
    ComplaintTypeDto,
    CreateComplaintRequest,
} from '../../types'

/**
 * Hook to create a complaint
 */
export const useCreateComplaintMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{ complaint_id: number }>>, Error, CreateComplaintRequest>
) => {
  return useMutation<AxiosResponse<ApiResponse<{ complaint_id: number }>>, Error, CreateComplaintRequest>({
    mutationFn: (data) => complaintService.create(data),
    ...options,
  })
}

/**
 * Hook to query my complaints
 */
export const useMyComplaintsQuery = ({
  params = {},
  querySettings = {}
}: {
  params?: { page?: number; pageSize?: number };
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<ComplaintResponseDto[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['MY_COMPLAINTS', params],
    queryFn: () => complaintService.getMyComplaints(params),
    enabled: isAuthorized,
    ...querySettings,
  })
}

/**
 * Hook to query my complaints with infinite scroll pagination.
 * Determines hasMore by checking if the last page returned a full page of results.
 */
export const useInfiniteMyComplaintsQuery = ({
  pageSize = 20,
  querySettings = {},
}: {
  pageSize?: number;
  querySettings?: Record<string, any>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)

  return useInfiniteQuery({
    queryKey: ['MY_COMPLAINTS_INFINITE', { pageSize }],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      complaintService.getMyComplaints({ page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: AxiosResponse<ApiResponse<ComplaintResponseDto[]>>,
      _allPages: unknown,
      lastPageParam: number,
    ) => {
      const items = lastPage.data?.data
      if (!items || items.length < pageSize) return undefined
      return lastPageParam + 1
    },
    enabled: isAuthorized,
    ...querySettings,
  })
}

/**
 * Hook to query complaint types
 */
export const useComplaintTypesQuery = ({
  querySettings = {}
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<ComplaintTypeDto[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  return useQuery({
    queryKey: ['COMPLAINT_TYPES'],
    queryFn: () => complaintService.getTypes(),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    ...querySettings,
  })
}
