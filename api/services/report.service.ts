
import axiosInstance from '../api'
import type {
    ApiResponse,
    ReportResponseDto,
    ReportCreateRequestDto,
} from '../../types'
import ENDPOINT from '../endpoints'

export const reportService = {
  /**
   * Create a report
   * POST /api/report/create
   */
  create: (data: ReportCreateRequestDto) => {
    return axiosInstance.post<ApiResponse<{ report_id: number }>>(ENDPOINT.REPORT.CREATE, data)
  },

  /**
   * Get my reports
   * GET /api/report/my-reports
   */
  getMyReports: (params: { page?: number; pageSize?: number } = {}) => {
    return axiosInstance.get<ApiResponse<ReportResponseDto[]>>(ENDPOINT.REPORT.MY_REPORTS, { params })
  },
}
