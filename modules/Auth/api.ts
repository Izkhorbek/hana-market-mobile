import axiosInstance from "@/api/api";
import ENDPOINT from "@/api/endpoints";

// Auth wire-format helpers used by the auth store.
// Backend contract: OTP-only flow with refresh-token rotation.
//  - request-otp: POST { phone_number } -> server SMSes a 6-digit code
//  - verify-otp:  POST { phone_number, code } -> tokens via X-* headers + user
//  - refresh:     POST { refresh_token }      -> new tokens via X-* headers
export const authApi = {
  requestOtp: (phoneNumber: string) =>
    axiosInstance.post(ENDPOINT.AUTH.REQUEST_OTP, {
      phone_number: phoneNumber,
    }),

  verifyOtp: (phoneNumber: string, code: string) =>
    axiosInstance.post(ENDPOINT.AUTH.VERIFY_OTP, {
      phone_number: phoneNumber,
      code,
    }),

  refresh: (refreshToken: string) =>
    axiosInstance.post(
      ENDPOINT.AUTH.REFRESH,
      { refresh_token: refreshToken },
      // Bypass the response interceptor's automatic refresh-on-401 to avoid
      // an infinite loop when the refresh token itself is rejected.
      { _skipAuthRefresh: true } as any,
    ),
};

// ── User API ──

export const userApi = {
  getUser: () => axiosInstance.get(ENDPOINT.USER.MY),

  updateUser: (data: {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
  }) => axiosInstance.post(ENDPOINT.USER.UPDATE_PROFILE, data),

  updateLocation: (data: {
    latitude: number;
    longitude: number;
    search_radius_km?: number;
    address_name?: string;
  }) => axiosInstance.post(ENDPOINT.USER.UPDATE_LOCATION, data),

  uploadProfileImage: (formData: FormData) =>
    axiosInstance.post(ENDPOINT.USER.UPLOAD_PROFILE_IMAGE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteUser: () => axiosInstance.post(ENDPOINT.USER.DELETE),
};
