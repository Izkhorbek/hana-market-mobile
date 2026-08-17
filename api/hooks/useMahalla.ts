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
  DistrictDto,
  JoinMahallaRequest,
  MahallaDistributorDto,
  MahallaDto,
  MahallaListParams,
  MahallaMemberDto,
  RegionDto,
} from '../../types'
import { mahallaService } from '../services'

/** All regions (first step of the onboarding cascade). */
export const useRegionsQuery = ({
  querySettings = {},
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<RegionDto[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  return useQuery({
    queryKey: ['REGIONS'],
    queryFn: () => mahallaService.getRegions(),
    staleTime: 1000 * 60 * 60, // territory rarely changes
    ...querySettings,
  })
}

/** Districts of a region (second step). Disabled until a region is picked. */
export const useDistrictsQuery = ({
  regionId,
  querySettings = {},
}: {
  regionId: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<DistrictDto[]>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['DISTRICTS', regionId],
    queryFn: () => mahallaService.getDistricts(regionId),
    enabled: !!regionId,
    staleTime: 1000 * 60 * 60,
    ...querySettings,
  })
}

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

/** The mahalla's distributors with their public contact (for members to call). */
export const useMahallaDistributorsQuery = ({
  mahallaId,
  querySettings = {},
}: {
  mahallaId: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<MahallaDistributorDto[]>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['MAHALLA_DISTRIBUTORS', mahallaId],
    queryFn: () => mahallaService.getDistributors(mahallaId),
    enabled: !!mahallaId,
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
