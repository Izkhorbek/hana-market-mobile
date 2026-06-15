import { featureFlags } from '@/constants/featureFlags'
import { useAuthStore } from '@/modules/Auth/auth-store'
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type {
  ApiResponse,
  CreateMannerReviewRequest,
  CreateMannerReviewResponse,
  MannerEventResponse,
  MannerReviewResponse,
  MannerTemperatureSummaryResponse,
} from '../../types'
import { mannerService } from '../services/manner.service'

type Pagination = { page?: number; pageSize?: number }

/**
 * Submit a manner review (Phase 1 data collection).
 */
export const useCreateMannerReviewMutation = (
  options?: UseMutationOptions<
    AxiosResponse<ApiResponse<CreateMannerReviewResponse>>,
    Error,
    CreateMannerReviewRequest
  >,
) =>
  useMutation<AxiosResponse<ApiResponse<CreateMannerReviewResponse>>, Error, CreateMannerReviewRequest>({
    mutationKey: ['CREATE_MANNER_REVIEW'],
    mutationFn: (data) => mannerService.createMannerReview(data),
    ...options,
  })

// ── Read hooks ──────────────────────────────────────────────────────────────
// Gated behind the PUBLIC-UI flag. While `mannerTemperaturePublicUiEnabled` is
// false these never fetch (enabled:false), so no summary/review data is requested
// and nothing can be rendered publicly by accident.

export const useMannerSummaryQuery = ({
  userId,
  querySettings = {},
}: {
  userId: number | null | undefined;
  querySettings?: Omit<
    UseQueryOptions<AxiosResponse<ApiResponse<MannerTemperatureSummaryResponse>>>,
    'queryKey' | 'queryFn'
  >;
}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['MANNER_SUMMARY', userId],
    queryFn: () => mannerService.getMannerSummary(userId as number),
    enabled:
      isAuthorized &&
      featureFlags.mannerTemperaturePublicUiEnabled &&
      !!userId,
    ...querySettings,
  })
}

export const useMannerReviewsQuery = ({
  userId,
  params = {},
  querySettings = {},
}: {
  userId: number | null | undefined;
  params?: Pagination;
  querySettings?: Omit<
    UseQueryOptions<AxiosResponse<ApiResponse<MannerReviewResponse[]>>>,
    'queryKey' | 'queryFn'
  >;
}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['MANNER_REVIEWS', userId, params],
    queryFn: () => mannerService.getMannerReviews(userId as number, params),
    enabled:
      isAuthorized &&
      featureFlags.mannerTemperaturePublicUiEnabled &&
      !!userId,
    ...querySettings,
  })
}

export const useMannerEventsQuery = ({
  userId,
  params = {},
  querySettings = {},
}: {
  userId: number | null | undefined;
  params?: Pagination;
  querySettings?: Omit<
    UseQueryOptions<AxiosResponse<ApiResponse<MannerEventResponse[]>>>,
    'queryKey' | 'queryFn'
  >;
}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['MANNER_EVENTS', userId, params],
    queryFn: () => mannerService.getMannerEvents(userId as number, params),
    enabled:
      isAuthorized &&
      featureFlags.mannerTemperaturePublicUiEnabled &&
      !!userId,
    ...querySettings,
  })
}
