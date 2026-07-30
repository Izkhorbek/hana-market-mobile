import {
  useInfiniteQuery,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type {
  ApiResponse,
  PaginatedResponse,
  ServiceListItemDto,
  ServiceListParams,
  ServiceUpdateRequest,
  SingleServiceDto,
} from '../../types'
import { serviceService } from '../services'

/**
 * Xizmat (Service) React Query hooks. Mirrors useProduct.
 * See ARCHITECTURE.md §3 (server cache) and §4.
 */

/** List services near the user (single page). */
export const useServicesQuery = ({
  params,
  querySettings = {},
}: {
  params: ServiceListParams;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<PaginatedResponse<ServiceListItemDto>>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['SERVICES', params],
    queryFn: () => serviceService.getAll(params),
    ...querySettings,
  })
}

/** List services with infinite scroll / pagination. */
export const useInfiniteServicesQuery = ({
  params,
  querySettings = {},
}: {
  params: Omit<ServiceListParams, 'current_page'>;
  querySettings?: Record<string, any>;
}) => {
  return useInfiniteQuery({
    queryKey: ['SERVICES_INFINITE', params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      serviceService.getAll({ ...params, current_page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: AxiosResponse<ApiResponse<PaginatedResponse<ServiceListItemDto>>>,
    ) => {
      const paged = lastPage.data?.data
      if (!paged) return undefined
      const totalPages = Math.ceil(paged.total_records / paged.page_size)
      return paged.current_page < totalPages ? paged.current_page + 1 : undefined
    },
    ...querySettings,
  })
}

/** Single service by id. */
export const useServiceQuery = ({
  id,
  querySettings = {},
}: {
  id: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<SingleServiceDto>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['SERVICE', id],
    queryFn: () => serviceService.getById(id),
    enabled: !!id,
    ...querySettings,
  })
}

/** The current user's own services. */
export const useMyServicesQuery = ({
  querySettings = {},
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<ServiceListItemDto[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  return useQuery({
    queryKey: ['MY_SERVICES'],
    queryFn: () => serviceService.getMy(),
    ...querySettings,
  })
}

/** Create a service (multipart FormData). */
export const useCreateServiceMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{ service_id: number }>>, Error, FormData>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<{ service_id: number }>>, Error, FormData>({
    mutationFn: (data) => serviceService.create(data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['SERVICES_INFINITE'] })
      queryClient.invalidateQueries({ queryKey: ['SERVICES'] })
      queryClient.invalidateQueries({ queryKey: ['MY_SERVICES'] })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

/** Update a service. */
export const useUpdateServiceMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<object>>, Error, { id: number; data: ServiceUpdateRequest }>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<object>>, Error, { id: number; data: ServiceUpdateRequest }>({
    mutationFn: ({ id, data }) => serviceService.update(id, data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      const { id } = variables
      queryClient.invalidateQueries({ queryKey: ['SERVICE', id] })
      queryClient.invalidateQueries({ queryKey: ['SERVICES'] })
      queryClient.invalidateQueries({ queryKey: ['SERVICES_INFINITE'] })
      queryClient.invalidateQueries({ queryKey: ['MY_SERVICES'] })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

/** Delete a service. */
export const useDeleteServiceMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<object>>, Error, number>,
) => {
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse<ApiResponse<object>>, Error, number>({
    mutationFn: (id) => serviceService.delete(id),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      const id = variables
      queryClient.removeQueries({ queryKey: ['SERVICE', id] })
      queryClient.invalidateQueries({ queryKey: ['SERVICES'] })
      queryClient.invalidateQueries({ queryKey: ['SERVICES_INFINITE'] })
      queryClient.invalidateQueries({ queryKey: ['MY_SERVICES'] })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
