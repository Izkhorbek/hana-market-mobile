import { authLogout, getAuthToken, refreshAuthToken } from '@/api/auth-bridge';
import { logger } from '@/utils/logger';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

//const PROD_API_URL = "http://46.8.176.21/api";
// Android emulator: 10.0.2.2, iOS simulator: localhost, physical device: machine's local IP
//const DEV_API_URL = 'http://10.0.2.2:5000/api'; // only if backend runs locally on dev machine
const DEV_API_URL = 'http://192.168.0.111:5000/api'; // real device on same Wi-Fi (local backend)
//const DEV_API_URL = PROD_API_URL; // remote backend — use production server in dev too

const API_URL = DEV_API_URL;

// Static files (wwwroot) are served from the server root, not under /api
export const IMAGE_BASE_URL = API_URL.replace(/\/api\/?$/, '');

// Internal flag attached to a request to opt out of the auto-refresh-on-401
// loop. Used by the /auth/refresh and /auth/logout calls themselves.
type RetriableConfig = AxiosRequestConfig & {
  _retried?: boolean;
  _skipAuthRefresh?: boolean;
};

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
  },
);

// ── Single-flight refresh ──
// If multiple requests fail with 401 concurrently, only one refresh call is
// made and all callers wait on the same promise.
let refreshInFlight: Promise<string | null> | null = null;

const runSingleFlightRefresh = (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = refreshAuthToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

// Response interceptor for global error handling + transparent token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      console.log('API Error:', response.data?.message || 'Unknown error');
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalConfig = (error.config || {}) as RetriableConfig;
    const url = originalConfig.url || 'unknown';
    const method = originalConfig.method?.toUpperCase() || 'unknown';
    const status = error.response?.status ?? 'no response';

    console.error(`[API Error] ${method} ${url} → ${status}`, {
      message: error.message,
      data: error.response?.data,
    });

    // Report to backend telemetry — skip the telemetry endpoint itself to
    // avoid an infinite loop, and skip 401s which are handled below.
    const isTelemetryCall = url.includes('telemetry/log');
    const numericStatus = typeof status === 'number' ? status : undefined;
    if (!isTelemetryCall && numericStatus !== 401) {
      const isNetwork = !error.response;
      const isServer = !!numericStatus && numericStatus >= 500;
      const code = isNetwork ? 'API_NETWORK_ERROR' : `API_HTTP_${numericStatus}`;
      const opts = {
        extra: {
          method,
          url,
          status: numericStatus,
          response_message:
            (error.response?.data as any)?.message ??
            (error.response?.data as any)?.errors?.[0],
        },
      };
      if (isServer) {
        logger.error(code, error, opts);
      } else {
        // Network / 4xx → warn (4xx is usually user/validation, network is transient)
        logger.warn(error, { code, ...opts });
      }
    }

    if (error.response) {
      const responseStatus = error.response.status;

      if (
        responseStatus === 401 &&
        !originalConfig._retried &&
        !originalConfig._skipAuthRefresh &&
        // Only attempt refresh when we still have a session to refresh from.
        getAuthToken()
      ) {
        originalConfig._retried = true;
        try {
          const newToken = await runSingleFlightRefresh();
          if (newToken) {
            originalConfig.headers = {
              ...(originalConfig.headers || {}),
              Authorization: `Bearer ${newToken}`,
            };
            return axiosInstance.request(originalConfig);
          }
        } catch (refreshErr) {
          console.error('[API] Token refresh failed', refreshErr);
          logger.error('AUTH_REFRESH_FAILED', refreshErr, { extra: { url } });
        }
        // Refresh failed → end the session.
        authLogout();
      } else if (responseStatus === 401) {
        // Refresh disabled / already retried / no token → log out.
        authLogout();
      }
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
