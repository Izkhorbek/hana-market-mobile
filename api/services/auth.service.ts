import axiosInstance from '../api';
import type { AuthResponse, UserCreateReqDto, UserRequestDto } from '../types';

export const authService = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register: (data: UserCreateReqDto) => {
    return axiosInstance.post<AuthResponse>('/auth/register', data);
  },

  /**
   * Login user
   * POST /api/auth/login
   */
  login: (data: UserRequestDto) => {
    return axiosInstance.post<AuthResponse>('/auth/login', data);
  },
};
