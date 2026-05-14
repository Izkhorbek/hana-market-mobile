import type {
  ApiResponse,
  LikedProductDto,
  MyProductDto,
  UpdateLocationRequest,
  UpdateProfileRequest,
  User,
} from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

export const userService = {
  /**
   * Get current user info
   * GET /api/user/my
   */
  getProfile: () => {
    return axiosInstance.get<ApiResponse<User>>(ENDPOINT.USER.MY)
  },

  /**
   * Update user profile
   * POST /api/user/update
   */
  updateProfile: (data: UpdateProfileRequest) => {
    return axiosInstance.post<ApiResponse<{}>>(ENDPOINT.USER.UPDATE_PROFILE, data)
  },

  /**
   * Upload profile image
   * POST /api/user/upload/profile-image
   */
  uploadProfileImage: (data: FormData) => {
    return axiosInstance.post<ApiResponse<string>>(ENDPOINT.USER.UPLOAD_PROFILE_IMAGE, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Update user location
   * POST /api/user/update/location
   */
  updateLocation: (data: UpdateLocationRequest) => {
    return axiosInstance.post<ApiResponse<string>>(ENDPOINT.USER.UPDATE_LOCATION, data)
  },

  /**
   * Get liked products
   * GET /api/product/likes
   */
  getLikedProducts: () => {
    return axiosInstance.get<ApiResponse<LikedProductDto[]>>(ENDPOINT.PRODUCT.LIKES)
  },

  /**
   * Get my products
   * GET /api/product/my
   */
  getMyProducts: () => {
    return axiosInstance.get<ApiResponse<MyProductDto[]>>(ENDPOINT.PRODUCT.MY)
  },

  /**
   * Delete account (soft delete)
   * POST /api/user/delete
   */
  deleteAccount: () => {
    return axiosInstance.post<ApiResponse<{}>>(ENDPOINT.USER.DELETE)
  },
}
