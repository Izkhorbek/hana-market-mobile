import axiosInstance from '@/api/api'
import ENDPOINT from '@/api/endpoints'

export const authApi = {
  register: (phoneNumber: string) =>
    axiosInstance.post(ENDPOINT.AUTH.REGISTER, { phone_number: phoneNumber }),

  login: (phoneNumber: string) =>
    axiosInstance.post(ENDPOINT.AUTH.LOGIN, { phone_number: phoneNumber }),
}

// ── User API ──

export const userApi = {
  getUser: () => axiosInstance.get(ENDPOINT.USER.MY),

  updateUser: (data: {
    username?: string
    email?: string
    first_name?: string
    last_name?: string
    bio?: string
  }) => axiosInstance.post(ENDPOINT.USER.UPDATE_PROFILE, data),

  updateLocation: (data: {
    latitude: number
    longitude: number
    search_radius_km?: number
    address_name?: string
  }) => axiosInstance.post(ENDPOINT.USER.UPDATE_LOCATION, data),

  uploadProfileImage: (formData: FormData) =>
    axiosInstance.post(ENDPOINT.USER.UPLOAD_PROFILE_IMAGE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteUser: () => axiosInstance.post(ENDPOINT.USER.DELETE),
}
