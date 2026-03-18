import type {
    ApiResponse,
    ContactMessageRequest,
    ContactMessageResponse,
    FeedbackRequest,
    FeedbackResponse,
} from '../../types';
import axiosInstance from '../api';
import ENDPOINT from '../endpoints';

export const contactService = {
  /**
   * Send a contact message (public — no auth required)
   * POST /api/contact/send
   */
  sendMessage: (data: ContactMessageRequest) => {
    return axiosInstance.post<ApiResponse<ContactMessageResponse>>(
      ENDPOINT.CONTACT.SEND,
      data
    );
  },

  /**
   * Submit user feedback with optional rating (requires auth)
   * POST /api/contact/feedback
   */
  submitFeedback: (data: FeedbackRequest) => {
    return axiosInstance.post<ApiResponse<FeedbackResponse>>(
      ENDPOINT.CONTACT.FEEDBACK,
      data
    );
  },
};
