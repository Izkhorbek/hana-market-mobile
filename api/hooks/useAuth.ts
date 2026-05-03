import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import type {
  ApiResponse,
  RefreshTokenRequest,
  RequestOtpRequest,
  User,
  VerifyOtpRequest,
} from '../../types';
import { authService } from '../services';

/**
 * Request an OTP code to be sent to a phone number.
 * Backend sends SMS; no token is issued at this step.
 */
export const useRequestOtpMutation = (
  options?: UseMutationOptions<
    AxiosResponse<ApiResponse<{}>>,
    Error,
    RequestOtpRequest
  >,
) => {
  return useMutation<AxiosResponse<ApiResponse<{}>>, Error, RequestOtpRequest>({
    mutationKey: ['request-otp'],
    mutationFn: (data) => authService.requestOtp(data),
    ...options,
  });
};

/**
 * Verify an OTP code and authenticate the user.
 * Implicitly registers a brand-new phone the first time it verifies.
 * Token is returned in the X-Access-Token response header.
 */
export const useVerifyOtpMutation = (
  options?: UseMutationOptions<
    AxiosResponse<ApiResponse<User>>,
    Error,
    VerifyOtpRequest
  >,
) => {
  return useMutation<AxiosResponse<ApiResponse<User>>, Error, VerifyOtpRequest>(
    {
      mutationKey: ['verify-otp'],
      mutationFn: (data) => authService.verifyOtp(data),
      ...options,
    },
  );
};

/**
 * Exchange a refresh token for a new access/refresh pair.
 * Tokens are returned in the X-* response headers (consumed by the auth-store).
 * Most callers should rely on the axios interceptor's automatic refresh-on-401
 * instead of invoking this hook directly.
 */
export const useRefreshTokenMutation = (
  options?: UseMutationOptions<
    AxiosResponse<ApiResponse<{}>>,
    Error,
    RefreshTokenRequest
  >,
) => {
  return useMutation<
    AxiosResponse<ApiResponse<{}>>,
    Error,
    RefreshTokenRequest
  >({
    mutationKey: ['refresh-token'],
    mutationFn: (data) => authService.refreshToken(data),
    ...options,
  });
};
