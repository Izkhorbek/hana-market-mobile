import { useAuthStore } from '@/modules/Auth/auth-store'
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type {
    ApiResponse,
    ReportCreateRequestDto,
    ReportResponseDto,
} from '../../types'
import { reportService } from '../services/report.service'

/**
 * Hook to create a report
 */
export const useCreateReportMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{ report_id: number }>>, Error, ReportCreateRequestDto>
) => {
  return useMutation<AxiosResponse<ApiResponse<{ report_id: number }>>, Error, ReportCreateRequestDto>({
    mutationFn: (data) => reportService.create(data),
    ...options,
  })
}

/**
 * Hook to query my reports
 */
export const useMyReportsQuery = ({
  params = {},
  querySettings = {}
}: {
  params?: { page?: number; pageSize?: number };
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<ReportResponseDto[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['MY_REPORTS', params],
    queryFn: () => reportService.getMyReports(params),
    enabled: isAuthorized,
    ...querySettings,
  })
}

