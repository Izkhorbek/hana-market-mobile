import type {
  ApiResponse,
  DraftImageDto,
  PaginatedResponse,
  ProductEditResponseDto,
  ProductImageDto,
  ProductLikeDto,
  ProductListParams,
} from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

export const productService = {
  /**
   * Get all products with filters
   * GET /api/product/all
   */
  getAll: (params: ProductListParams) => {
    return axiosInstance.get<ApiResponse<PaginatedResponse<any>>>(ENDPOINT.PRODUCT.ALL, { params })
  },

  /**
   * Get product by ID
   * GET /api/product/{id}
   */
  getById: (id: number) => {
    return axiosInstance.get<ApiResponse<any>>(ENDPOINT.PRODUCT.BY_ID(id))
  },

    /**
   * Get product by ID for editing (includes additional fields)
   * GET /api/product/{id}/edit
   */
  getByIdToEdit: (id: number) => {
    return axiosInstance.get<ApiResponse<ProductEditResponseDto>>(ENDPOINT.PRODUCT.BY_ID_TO_EDIT(id))
  },

  /**
   * Create a new product
   * POST /api/product/create
   * Note: Expects multipart/form-data
   */
  create: (data: FormData) => {
    return axiosInstance.post<ApiResponse<object>>(ENDPOINT.PRODUCT.CREATE, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Update product
   * PUT /api/product/{id}
   */
  update: (id: number, data: object) => {
    return axiosInstance.put<ApiResponse<object>>(ENDPOINT.PRODUCT.UPDATE(id), data)
  },

  /**
   * Delete product
   * DELETE /api/product/{id}
   */
  delete: (id: number) => {
    return axiosInstance.delete<ApiResponse<object>>(ENDPOINT.PRODUCT.DELETE(id))
  },

  /**
   * Get product images
   * GET /api/product/{id}/images
   */
  getImages: (id: number) => {
    return axiosInstance.get<ApiResponse<ProductImageDto[]>>(ENDPOINT.PRODUCT.IMAGES(id))
  },

  /**
   * Like or unlike a product
   * POST /api/product/{id}/likes
   */
  toggleLike: (id: number, data: ProductLikeDto) => {
    return axiosInstance.post<ApiResponse<object>>(ENDPOINT.PRODUCT.LIKE(id), data)
  },

  /**
   * Upload draft images before creating a product
   * POST /api/product/images/upload-draft
   * Note: Expects multipart/form-data
   */
  uploadDraftImages: (data: FormData) => {
    return axiosInstance.post<ApiResponse<DraftImageDto[]>>(ENDPOINT.PRODUCT.UPLOAD_DRAFT, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Delete a draft image by UUID
   * DELETE /api/product/images/delete-draft/{draftUuid}
   */
  deleteDraftImage: (draftUuid: string) => {
    return axiosInstance.delete(ENDPOINT.PRODUCT.DELETE_DRAFT(draftUuid))
  },

  /**
   * Get products by seller ID
   * GET /api/product/seller/{sellerId}/products
   */
  getProductsBySeller: (sellerId: number, page: number, pageSize: number) => {
    return axiosInstance.get<ApiResponse<PaginatedResponse<any>>>(ENDPOINT.PRODUCT.SELLER_PRODUCTS(sellerId), { params: { page, pageSize } })
  },

  /**
   * Get related products by product ID
   * GET /api/product/{id}/related  
   * Returns products from the same category, excluding the current product
   */
  getRelatedProducts: (id: number) => {   
    return axiosInstance.get<ApiResponse<any[]>>(ENDPOINT.PRODUCT.RELATED(id))
  }
}
