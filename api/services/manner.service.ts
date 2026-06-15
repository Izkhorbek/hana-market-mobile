import axiosInstance from '../api'
import type {
  ApiResponse,
  CreateMannerReviewRequest,
  CreateMannerReviewResponse,
  MannerTemperatureSummaryResponse,
  MannerReviewResponse,
  MannerEventResponse,
} from '../../types'
import ENDPOINT from '../endpoints'

type Pagination = { page?: number; pageSize?: number }

/**
 * The app uses a camelCase request shape; the backend DTO is snake_case.
 * Map here so callers/components never deal with snake_case, and the server
 * never receives an unexpected (camelCase) field.
 */
const toReviewBody = (r: CreateMannerReviewRequest) => ({
  chat_room_id: r.chatRoomId,
  target_user_id: r.targetUserId,
  rating: r.rating,
  ...(r.comment && r.comment.trim().length > 0 ? { comment: r.comment.trim() } : {}),
  is_polite: !!r.isPolite,
  is_fast_response: !!r.isFastResponse,
  is_on_time: !!r.isOnTime,
  is_fair_price: !!r.isFairPrice,
  is_no_show: !!r.isNoShow,
  is_rude: !!r.isRude,
  is_spam: !!r.isSpam,
})

export const mannerService = {
  /**
   * Submit a manner review.
   * POST /api/manner-temperature/reviews
   */
  createMannerReview: (data: CreateMannerReviewRequest) =>
    axiosInstance.post<ApiResponse<CreateMannerReviewResponse>>(
      ENDPOINT.MANNER.REVIEWS,
      toReviewBody(data),
    ),

  /**
   * GET /api/manner-temperature/users/{userId}/summary
   * NOTE: only call this when the public-UI flag is on (Phase 2).
   */
  getMannerSummary: (userId: number) =>
    axiosInstance.get<ApiResponse<MannerTemperatureSummaryResponse>>(
      ENDPOINT.MANNER.SUMMARY(userId),
    ),

  /** GET /api/manner-temperature/users/{userId}/reviews */
  getMannerReviews: (userId: number, params: Pagination = {}) =>
    axiosInstance.get<ApiResponse<MannerReviewResponse[]>>(
      ENDPOINT.MANNER.USER_REVIEWS(userId),
      { params },
    ),

  /** GET /api/manner-temperature/users/{userId}/events */
  getMannerEvents: (userId: number, params: Pagination = {}) =>
    axiosInstance.get<ApiResponse<MannerEventResponse[]>>(
      ENDPOINT.MANNER.EVENTS(userId),
      { params },
    ),
}
