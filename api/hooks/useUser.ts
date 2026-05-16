import { useAuthStore } from '@/modules/Auth/auth-store'
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type { ApiResponse, LikedProductDto, MyProductDto, UpdateLocationRequest, UpdateProfileRequest, User } from '../../types'
import { userService } from '../services'

/**
 * Hook to query user profile
 */
export const useProfileQuery = ({
  querySettings = {}
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<User>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['USER_PROFILE'],
    queryFn: () => userService.getProfile(),
    enabled: isAuthorized,
    ...querySettings,
  })
}

/**
 * Hook to update user profile
 */
export const useUpdateProfileMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{}>>, Error, UpdateProfileRequest>
) => {
  return useMutation<AxiosResponse<ApiResponse<{}>>, Error, UpdateProfileRequest>({
    mutationFn: (data) => userService.updateProfile(data),
    ...options,
  })
}

/**
 * Hook to upload profile image
 */
export const useUploadProfileImageMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<string>>, Error, FormData>
) => {
  return useMutation<AxiosResponse<ApiResponse<string>>, Error, FormData>({
    mutationFn: (data) => userService.uploadProfileImage(data),
    ...options,
  })
}

/**
 * Hook to update user location
 */
export const useUpdateLocationMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<string>>, Error, UpdateLocationRequest>
) => {
  return useMutation<AxiosResponse<ApiResponse<string>>, Error, UpdateLocationRequest>({
    mutationFn: (data) => userService.updateLocation(data),
    ...options,
  })
}

/**
 * Hook to query my products
 */
export const useMyProductsQuery = ({
  querySettings = {}
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<MyProductDto[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['MY_PRODUCTS'],
    queryFn: () => userService.getMyProducts(),
    enabled: isAuthorized,
    ...querySettings,
  })
}

/**
 * Hook to query liked products
 */
export const useLikedProductsQuery = ({
  querySettings = {}
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<LikedProductDto[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['LIKED_PRODUCTS'],
    queryFn: () => userService.getLikedProducts(),
    enabled: isAuthorized,
    ...querySettings,
  })
}

/**
 * Hook to delete account
 */
export const useDeleteAccountMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{}>>, Error, void>
) => {
  return useMutation<AxiosResponse<ApiResponse<{}>>, Error, void>({
    mutationFn: () => userService.deleteAccount(),
    ...options,
  })
}
