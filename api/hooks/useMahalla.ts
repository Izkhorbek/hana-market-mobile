import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type {
  ApiResponse,
  JoinMahallaRequest,
  MahallaDto,
  MahallaListParams,
  MahallaMemberDto,
} from '../../types'
import { mahallaService } from '../services'

/** Search/list mahallas for onboarding selection. */
export const useMahallaListQuery = ({
  params,
  querySettings = {},
}: {
  params: MahallaListParams;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<MahallaDto[]>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['MAHALLA_LIST', params],
    queryFn: () => mahallaService.getList(params),
    ...querySettings,
  })
}

/** The current user's mahalla membership (used to seed hyperlocal features). */
export const useMyMahallaQuery = ({
  querySettings = {},
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<MahallaMemberDto | null>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  return useQuery({
    queryKey: ['MAHALLA_MY'],
    queryFn: () => mahallaService.getMy(),
    ...querySettings,
  })
}

/** Join a mahalla and claim a household. */
export const useJoinMahallaMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<MahallaMemberDto>>, Error, JoinMahallaRequest>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<MahallaMemberDto>>, Error, JoinMahallaRequest>({
    mutationFn: (data) => mahallaService.join(data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['MAHALLA_MY'] })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
