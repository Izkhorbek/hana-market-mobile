import { authLogout, getAuthToken } from '@/api/auth-bridge';
import axios from 'axios';
  
const PROD_API_URL = 'http://46.8.176.21/api';
// Android emulator: 10.0.2.2, iOS simulator: localhost, physical device: machine's local IP
//const DEV_API_URL = 'http://10.0.2.2:5000/api'; // only if backend runs locally on dev machine
 const DEV_API_URL = 'http://192.168.219.122:5000/api'; // real device on same Wi-Fi (local backend)
//const DEV_API_URL = PROD_API_URL; // remote backend — use production server in dev too

const API_URL = __DEV__
  ? DEV_API_URL
  : PROD_API_URL;

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
    // Log detailed error info for debugging
    const url = error.config?.url || 'unknown'
    const method = error.config?.method?.toUpperCase() || 'unknown'
    const status = error.response?.status || 'no response'
    
    console.error(`[API Error] ${method} ${url} → ${status}`, {
      message: error.message,
      data: error.response?.data,
    })
    
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