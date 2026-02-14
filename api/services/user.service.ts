import axiosInstance from '../api';
import type { User } from '../types';

export const userService = {
  /**
   * Get user profile
   * GET /api/user/profile
   */
  getProfile: () => {
    return axiosInstance.get<User>('/user/profile');
  },

  /**
   * Update user profile
   * PUT /api/user/profile
   */
  updateProfile: (data: Partial<User>) => {
    return axiosInstance.put<User>('/user/profile', data);
  },

  /**
   * Get my products
   * GET /api/user/my-products
   */
  getMyProducts: (params: { page?: number; page_size?: number } = {}) => {
    return axiosInstance.get('/user/my-products', { params });
  },

  /**
   * Get favorites
   * GET /api/user/favorites
   */
  getFavorites: (params: { page?: number; page_size?: number } = {}) => {
    return axiosInstance.get('/user/favorites', { params });
  },
};
