import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type { ApiResponse, VersionCheckParams, VersionCheckResponse } from '../../types'
import { appService } from '../services'

/** Check the backend version policy (imperative, once per launch). */
export const useAppVersionCheckMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<VersionCheckResponse>>, Error, VersionCheckParams>,
) => {
  return useMutation<AxiosResponse<ApiResponse<VersionCheckResponse>>, Error, VersionCheckParams>({
    mutationFn: (params) => appService.checkAppVersion(params),
    ...options,
  })
}
