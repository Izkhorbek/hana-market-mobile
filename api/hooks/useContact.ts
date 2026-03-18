import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import type {
  ApiResponse,
  ContactMessageRequest,
  ContactMessageResponse,
  FeedbackRequest,
  FeedbackResponse,
} from '../../types';
import { contactService } from '../services';

/**
 * Hook to send a public contact message (no auth required)
 */
export const useSendContactMessageMutation = (
  options?: UseMutationOptions<
    AxiosResponse<ApiResponse<ContactMessageResponse>>,
    Error,
    ContactMessageRequest
  >
) => {
  return useMutation<
    AxiosResponse<ApiResponse<ContactMessageResponse>>,
    Error,
    ContactMessageRequest
  >({
    mutationFn: (data) => contactService.sendMessage(data),
    ...options,
  });
};

/**
 * Hook to submit authenticated user feedback with optional rating
 */
export const useSubmitFeedbackMutation = (
  options?: UseMutationOptions<
    AxiosResponse<ApiResponse<FeedbackResponse>>,
    Error,
    FeedbackRequest
  >
) => {
  return useMutation<
    AxiosResponse<ApiResponse<FeedbackResponse>>,
    Error,
    FeedbackRequest
  >({
    mutationFn: (data) => contactService.submitFeedback(data),
    ...options,
  });
};
