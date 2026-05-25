import axiosInstance from '../api'
import type {
    ApiResponse,
    ComplaintDto,
    ComplaintTypeDto,
    CreateComplaintRequest,
} from '../../types'
import ENDPOINT from '../endpoints'

export const complaintService = {
  /**
   * Create a complaint
   * POST /api/complaint/create
   */
  create: (data: CreateComplaintRequest) => {
    return axiosInstance.post<ApiResponse<{ complaint_id: number }>>(ENDPOINT.COMPLAINT.CREATE, data)
  },

  /**
   * Get my complaints
   * GET /api/complaint/my-complaints
   */
  getMyComplaints: (params: { page?: number; pageSize?: number } = {}) => {
    return axiosInstance.get<ApiResponse<ComplaintDto[]>>(ENDPOINT.COMPLAINT.MY, { params })
  },

  /**
   * Get complaint types
   * GET /api/complaint/types
   */
  getTypes: () => {
    return axiosInstance.get<ApiResponse<ComplaintTypeDto[]>>(ENDPOINT.COMPLAINT.TYPES)
  },
}
