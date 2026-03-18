import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import type { ApiResponse, User, UserCreateReqDto, UserRequestDto } from '../../types';
import { authService } from '../services';

/**
 * Hook for user registration
 */
export const useRegisterMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{}>>, Error, UserCreateReqDto>
) => {
  return useMutation<AxiosResponse<ApiResponse<{}>>, Error, UserCreateReqDto>({
    mutationKey: ["register"],
    mutationFn: (data) => authService.register(data),
    ...options,
  });
};

/**
 * Hook for user login
 */
export const useLoginMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<User>>, Error, UserRequestDto>
) => {
  return useMutation<AxiosResponse<ApiResponse<User>>, Error, UserRequestDto>({
    mutationKey: ["login"],
    mutationFn: (data) => authService.login(data),
    ...options,
  });
};
