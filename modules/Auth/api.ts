import axiosInstance from '@/api/api'

export const authApi = {
  register: (phoneNumber: string) =>
    axiosInstance.post('/auth/register', { phone_number: phoneNumber }),

  login: (phoneNumber: string) =>
    axiosInstance.post('/auth/login', { phone_number: phoneNumber }),
}

// ── User API ──

export const userApi = {
  getUser: () => axiosInstance.get('/user/get'),

  updateUser: (data: {
    username?: string
    email?: string
    first_name?: string
    last_name?: string
    bio?: string
  }) => axiosInstance.post('/user/update', data),

  updateLocation: (data: {
    latitude: number
    longitude: number
    search_radius_km?: number
    address_name?: string
  }) => axiosInstance.post('/user/update/location', data),

  uploadProfileImage: (formData: FormData) =>
    axiosInstance.post('/user/upload/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteUser: () => axiosInstance.post('/user/delete'),
}
