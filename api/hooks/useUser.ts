import { useAuthStore } from '@/modules/Auth/auth-store';
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { userService } from '../services';
import type { User } from '../types';

/**
 * Hook to query user profile
 */
export const useProfileQuery = ({ 
  querySettings = {} 
}: { 
  querySettings?: Omit<UseQueryOptions<AxiosResponse<User>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: ['USER_PROFILE'],
    queryFn: () => userService.getProfile(),
    enabled: isAuthorized,
    ...querySettings,
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateProfileMutation = (
  options?: UseMutationOptions<AxiosResponse<User>, Error, Partial<User>>
) => {
  return useMutation<AxiosResponse<User>, Error, Partial<User>>({
    mutationFn: (data) => userService.updateProfile(data),
    ...options,
  });
};

/**
 * Hook to query my products
 */
export const useMyProductsQuery = ({ 
  params = {}, 
  querySettings = {} 
}: { 
  params?: { page?: number; page_size?: number }; 
  querySettings?: Omit<UseQueryOptions<AxiosResponse<any>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: ['MY_PRODUCTS', params],
    queryFn: () => userService.getMyProducts(params),
    enabled: isAuthorized,
    ...querySettings,
  });
};

/**
 * Hook to query favorites
 */
export const useFavoritesQuery = ({ 
  params = {}, 
  querySettings = {} 
}: { 
  params?: { page?: number; page_size?: number }; 
  querySettings?: Omit<UseQueryOptions<AxiosResponse<any>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const isAuthorized = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: ['FAVORITES', params],
    queryFn: () => userService.getFavorites(params),
    enabled: isAuthorized,
    ...querySettings,
  });
};
