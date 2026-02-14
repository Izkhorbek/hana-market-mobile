import axiosInstance from '../api';
import type {
    DeleteProductImagesRequestDto,
    ProductLikeDto,
    ProductListParams,
} from '../types';

export const productService = {
  /**
   * Create a new product
   * POST /api/product/create
   * Note: This endpoint expects multipart/form-data
   */
  create: (data: FormData) => {
    return axiosInstance.post('/product/create', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get all products with filters
   * GET /api/product/all
   */
  getAll: (params: ProductListParams) => {
    return axiosInstance.get('/product/all', { params });
  },

  /**
   * Get product by ID
   * GET /api/product/{id}
   */
  getById: (id: number) => {
    return axiosInstance.get(`/product/${id}`);
  },

  /**
   * Update product
   * PUT /api/product/{id}
   * Note: This endpoint expects multipart/form-data
   */
  update: (id: number, data: FormData) => {
    return axiosInstance.put(`/product/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete product
   * DELETE /api/product/{id}
   */
  delete: (id: number) => {
    return axiosInstance.delete(`/product/${id}`);
  },

  /**
   * Toggle product like
   * PUT /api/product/{id}/like
   */
  toggleLike: (id: number, data: ProductLikeDto) => {
    return axiosInstance.put(`/product/${id}/like`, data);
  },

  /**
   * Upload product image
   * POST /api/product/upload-image
   * Note: This endpoint expects multipart/form-data
   */
  uploadImage: (data: FormData) => {
    return axiosInstance.post('/product/upload-image', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete product images
   * POST /api/product/delete-images
   */
  deleteImages: (data: DeleteProductImagesRequestDto) => {
    return axiosInstance.post('/product/delete-images', data);
  },
};
