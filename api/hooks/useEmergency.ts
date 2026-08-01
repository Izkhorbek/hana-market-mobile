import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type { ApiResponse, EmergencySectionDto } from '../../types'
import { emergencyService } from '../services'

/**
 * Emergency short numbers (admin-managed). The screen renders these when loaded
 * and falls back to a local seed otherwise. Rarely changes → long staleTime.
 */
export const useEmergencyNumbersQuery = ({
  querySettings = {},
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<EmergencySectionDto[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  return useQuery({
    queryKey: ['EMERGENCY_NUMBERS'],
    queryFn: () => emergencyService.getSections(),
    staleTime: 60 * 60 * 1000,
    ...querySettings,
  })
}
