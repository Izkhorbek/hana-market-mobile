import type {
  AcceptTermsRequest,
  AcceptTermsResponse,
  ApiResponse,
  BlockedUserDto,
  BlockUserRequest,
  BlockUserResponse,
  LikedProductDto,
  MyProductDto,
  PaginatedResponse,
  UnblockUserRequest,
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
    return axiosInstance.post<ApiResponse<object>>(ENDPOINT.USER.UPDATE_PROFILE, data)
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
    return axiosInstance.post<ApiResponse<object>>(ENDPOINT.USER.DELETE)
  },

  // ── UGC safety (Apple 1.2) ────────────────────────────────────────────────

  /**
   * Block a user. Enforcement (hiding listings/chats both ways) is server-side.
   * POST /api/user/block
   */
  blockUser: (data: BlockUserRequest) => {
    return axiosInstance.post<ApiResponse<BlockUserResponse>>(ENDPOINT.USER.BLOCK, data)
  },

  /**
   * Unblock a previously blocked user.
   * POST /api/user/unblock
   */
  unblockUser: (data: UnblockUserRequest) => {
    return axiosInstance.post<ApiResponse<{ blocked_user_id: number }>>(ENDPOINT.USER.UNBLOCK, data)
  },

  /**
   * Paginated list of users the current user has blocked.
   * GET /api/user/blocked
   */
  getBlockedUsers: (page = 1, pageSize = 20) => {
    return axiosInstance.get<ApiResponse<PaginatedResponse<BlockedUserDto>>>(ENDPOINT.USER.BLOCKED, {
      params: { current_page: page, page_size: pageSize },
    })
  },

  /**
   * Record acceptance of the current Terms of Service & Privacy Policy.
   * POST /api/user/accept-terms
   */
  acceptTerms: (data: AcceptTermsRequest) => {
    return axiosInstance.post<ApiResponse<AcceptTermsResponse>>(ENDPOINT.USER.ACCEPT_TERMS, data)
  },
}
