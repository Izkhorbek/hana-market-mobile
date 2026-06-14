import axiosInstance from '../api'
import type {
    ApiResponse,
    Category,
    CategoryTreeItem,
    PaginatedResponse,
    ProductListParams,
} from '../../types'
import ENDPOINT from '../endpoints'

export const categoryService = {
  /**
   * Get all categories
   * GET /api/product/categories
   */
  getAll: () => {
    return axiosInstance.get<ApiResponse<Category[]>>(ENDPOINT.CATEGORY.ALL)
  },

  /**
   * Get categories as a tree
   * GET /api/product/categories/tree
   */
  getTree: () => {
    return axiosInstance.get<ApiResponse<CategoryTreeItem[]>>(ENDPOINT.CATEGORY.TREE)
  },

  /**
   * Get category by ID
   * GET /api/product/categories/{categoryId}
   */
  getById: (categoryId: number) => {
    return axiosInstance.get<ApiResponse<Category>>(`${ENDPOINT.CATEGORY.BY_ID}/${categoryId}`)
  },

  /**
   * Get products by category
   * GET /api/product/categories/{categoryId}/products
   */
  getProductsByCategory: (categoryId: number, params: Omit<ProductListParams, 'user_lat' | 'user_long'> & { user_lat: number; user_long: number }) => {
    return axiosInstance.get<ApiResponse<PaginatedResponse<any>>>(`${ENDPOINT.CATEGORY.BY_ID}/${categoryId}/products`, { params })
  },

  /**
   * Get subcategories of a parent category
   * GET /api/product/categories/{parentId}/subcategories
   */
  getSubcategories: (parentId: number) => {
    return axiosInstance.get<ApiResponse<Category[]>>(`${ENDPOINT.CATEGORY.BY_ID}/${parentId}/subcategories`)
  },
}
