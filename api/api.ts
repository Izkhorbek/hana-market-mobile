import { authLogout, getAuthToken } from '@/api/auth-bridge';
import axios from 'axios';

// const PROD_API_URL = 'http://46.8.176.21/api';
// Android emulator: 10.0.2.2, iOS simulator: localhost, physical device: machine's local IP
// const DEV_API_URL = 'http://10.0.2.2:5000/api';
 const DEV_API_URL = 'http://192.168.1.102:5000/api';

const API_URL = DEV_API_URL;

// Static files (wwwroot) are served from the server root, not under /api
export const IMAGE_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => {
    if(response.data?.success === false) {
      console.log('API Error:', response.data?.message || 'Unknown error');
      console.log('Full response:', response);
    }

    return response;
  },
  (error) => {
    console.error('API Request Error:', error);
    // Handle common errors
    if (error.response) {
      // Server responded with error
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear auth state
        authLogout();
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;