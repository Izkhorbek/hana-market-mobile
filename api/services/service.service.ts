import type {
  ApiResponse,
  PaginatedResponse,
  ServiceListItemDto,
  ServiceListParams,
  ServiceUpdateRequest,
  SingleServiceDto,
} from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

/**
 * Xizmat (Service) data layer. Mirrors productService. Draft images reuse the
 * shared product draft-upload endpoint, so there is no separate upload here.
 * See ARCHITECTURE.md §2 (global, stateless CRUD).
 */
export const serviceService = {
  /**
   * Get services near the user, with filters.
   * GET /api/service/all
   */
  getAll: (params: ServiceListParams) => {
    return axiosInstance.get<ApiResponse<PaginatedResponse<ServiceListItemDto>>>(
      ENDPOINT.SERVICE.ALL,
      { params },
    )
  },

  /**
   * Get a single service by id.
   * GET /api/service/{id}
   */
  getById: (id: number) => {
    return axiosInstance.get<ApiResponse<SingleServiceDto>>(ENDPOINT.SERVICE.BY_ID(id))
  },

  /**
   * Get the current user's own services.
   * GET /api/service/my
   */
  getMy: () => {
    return axiosInstance.get<ApiResponse<ServiceListItemDto[]>>(ENDPOINT.SERVICE.MY)
  },

  /**
   * Create a new service.
   * POST /api/service/create
   * Note: Expects multipart/form-data (mirrors product create).
   */
  create: (data: FormData) => {
    return axiosInstance.post<ApiResponse<{ service_id: number }>>(ENDPOINT.SERVICE.CREATE, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Update a service.
   * PUT /api/service/{id}
   */
  update: (id: number, data: ServiceUpdateRequest) => {
    return axiosInstance.put<ApiResponse<object>>(ENDPOINT.SERVICE.UPDATE(id), data)
  },

  /**
   * Delete a service.
   * DELETE /api/service/{id}
   */
  delete: (id: number) => {
    return axiosInstance.delete<ApiResponse<object>>(ENDPOINT.SERVICE.DELETE(id))
  },
}
