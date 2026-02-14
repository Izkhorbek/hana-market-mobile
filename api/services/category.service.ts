import axiosInstance from '../api';
export const categoryService = {
  /**
   * Get all categories
   * GET /api/product/categories
   */
  getAll: (data: any) => {
    return axiosInstance.get('/product/categories', {
      data
    });
  },
};
