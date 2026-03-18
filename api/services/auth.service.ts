import type { ApiResponse, User, UserCreateReqDto, UserRequestDto } from '../../types';
import axiosInstance from '../api';
import ENDPOINT from '../endpoints';

export const authService = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register: (data: UserCreateReqDto) => {
    return axiosInstance.post<ApiResponse<{}>>(ENDPOINT.AUTH.REGISTER, data);
  },

  /**
   * Login user
   * POST /api/auth/login
   * Token returned in response headers: X-Access-Token
   */
  login: (data: UserRequestDto) => {
    return axiosInstance.post<ApiResponse<User>>(ENDPOINT.AUTH.LOGIN, data);
  },

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout: () => {
    return axiosInstance.post<ApiResponse<{}>>(ENDPOINT.AUTH.LOGOUT);
  },
};
