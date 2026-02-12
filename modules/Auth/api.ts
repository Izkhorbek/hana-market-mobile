import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

const BASE_URL = 'http://46.8.176.21'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Attach Bearer token to every request ──
// Token is set lazily to avoid circular imports with the auth store
apiClient.interceptors.request.use(async (config) => {
  try {
    const raw = await AsyncStorage.getItem('hana-auth-storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return config
})

// ── Auth API ──

export const authApi = {
  register: (phoneNumber: string) =>
    apiClient.post('/api/auth/register', { phone_number: phoneNumber }),

  login: (phoneNumber: string) =>
    apiClient.post('/api/auth/login', { phone_number: phoneNumber }),
}

// ── User API ──

export const userApi = {
  getUser: () => apiClient.get('/api/user/get'),

  updateUser: (data: {
    username?: string
    email?: string
    first_name?: string
    last_name?: string
    bio?: string
  }) => apiClient.post('/api/user/update', data),

  updateLocation: (data: {
    latitude: number
    longitude: number
    search_radius_km?: number
    address_name?: string
  }) => apiClient.post('/api/user/update/location', data),

  uploadProfileImage: (formData: FormData) =>
    apiClient.post('/api/user/upload/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteUser: () => apiClient.post('/api/user/delete'),
}
