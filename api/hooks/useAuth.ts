import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { authService } from '../services';
import type { AuthResponse, UserCreateReqDto, UserRequestDto } from '../types';

/**
 * Hook for user registration
 */
export const useRegisterMutation = (
  options?: UseMutationOptions<AxiosResponse<AuthResponse>, Error, UserCreateReqDto>
) => {
  return useMutation<AxiosResponse<AuthResponse>, Error, UserCreateReqDto>({
    mutationKey: ["register"],
    mutationFn: (data) => authService.register(data),
    ...options,
  });
};

/**
 * Hook for user login
 */
export const useLoginMutation = (
  options?: UseMutationOptions<AxiosResponse<AuthResponse>, Error, UserRequestDto>
) => {
  return useMutation<AxiosResponse<AuthResponse>, Error, UserRequestDto>({
    mutationKey: ["login"],
    mutationFn: (data) => authService.login(data),
    ...options,
  });
};
