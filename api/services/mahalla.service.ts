import type {
  ApiResponse,
  JoinMahallaRequest,
  MahallaDistributorDto,
  MahallaDto,
  MahallaListParams,
  MahallaMemberDto,
} from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

/**
 * Mahalla (neighborhood) membership data layer. Used by onboarding to find and
 * join a mahalla, which unlocks the hyperlocal features. See ARCHITECTURE.md §2.
 */
export const mahallaService = {
  /** Search/list mahallas (onboarding selection). GET /api/mahalla */
  getList: (params: MahallaListParams) => {
    return axiosInstance.get<ApiResponse<MahallaDto[]>>(ENDPOINT.MAHALLA.LIST, { params })
  },

  /** The current user's mahalla membership, if any. GET /api/mahalla/my */
  getMy: () => {
    return axiosInstance.get<ApiResponse<MahallaMemberDto | null>>(ENDPOINT.MAHALLA.MY)
  },

  /** A single mahalla by id. GET /api/mahalla/{id} */
  getById: (id: number) => {
    return axiosInstance.get<ApiResponse<MahallaDto>>(ENDPOINT.MAHALLA.BY_ID(id))
  },

  /** Join a mahalla and claim a household. POST /api/mahalla/join */
  join: (data: JoinMahallaRequest) => {
    return axiosInstance.post<ApiResponse<MahallaMemberDto>>(ENDPOINT.MAHALLA.JOIN, data)
  },

  /**
   * The mahalla's distributors with their public contact (name + phone).
   * GET /api/mahalla/{id}/distributors
   */
  getDistributors: (id: number) => {
    return axiosInstance.get<ApiResponse<MahallaDistributorDto[]>>(
      ENDPOINT.MAHALLA.DISTRIBUTORS(id),
    )
  },
}
