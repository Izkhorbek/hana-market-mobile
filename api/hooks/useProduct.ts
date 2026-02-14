import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { productService } from '../services';
import type {
  DeleteProductImagesRequestDto,
  ProductLikeDto,
  ProductListParams,
} from '../types';

/**
 * Hook to query products list
 */
export const useProductsQuery = ({ 
  params, 
  querySettings = {} 
}: { 
  params: ProductListParams; 
  querySettings?: Omit<UseQueryOptions<AxiosResponse<any>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['PRODUCTS', params],
    queryFn: () => productService.getAll(params),
    ...querySettings,
  });
};

/**
 * Hook to query single product
 */
export const useProductQuery = ({ 
  id, 
  querySettings = {} 
}: { 
  id: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<any>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['PRODUCT', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
    ...querySettings,
  });
};

/**
 * Hook to create product
 */
export const useCreateProductMutation = (
  options?: UseMutationOptions<AxiosResponse<any>, Error, FormData>
) => {
  return useMutation<AxiosResponse<any>, Error, FormData>({
    mutationFn: (data) => productService.create(data),
    ...options,
  });
};

/**
 * Hook to update product
 */
export const useUpdateProductMutation = (
  options?: UseMutationOptions<AxiosResponse<any>, Error, { id: number; data: FormData }>
) => {
  return useMutation<AxiosResponse<any>, Error, { id: number; data: FormData }>({
    mutationFn: ({ id, data }) => productService.update(id, data),
    ...options,
  });
};

/**
 * Hook to delete product
 */
export const useDeleteProductMutation = (
  options?: UseMutationOptions<AxiosResponse<any>, Error, number>
) => {
  return useMutation<AxiosResponse<any>, Error, number>({
    mutationFn: (id) => productService.delete(id),
    ...options,
  });
};

/**
 * Hook to toggle product like
 */
export const useToggleLikeMutation = (
  options?: UseMutationOptions<AxiosResponse<any>, Error, { id: number; data: ProductLikeDto }>
) => {
  return useMutation<AxiosResponse<any>, Error, { id: number; data: ProductLikeDto }>({
    mutationFn: ({ id, data }) => productService.toggleLike(id, data),
    ...options,
  });
};

/**
 * Hook to upload product image
 */
export const useUploadImageMutation = (
  options?: UseMutationOptions<AxiosResponse<any>, Error, FormData>
) => {
  return useMutation<AxiosResponse<any>, Error, FormData>({
    mutationKey: ['UPLOAD_IMAGE'],
    mutationFn: (data) => productService.uploadImage(data),
    ...options,
  });
};

/**
 * Hook to delete product images
 */
export const useDeleteImagesMutation = (
  options?: UseMutationOptions<AxiosResponse<any>, Error, DeleteProductImagesRequestDto>
) => {
  return useMutation<AxiosResponse<any>, Error, DeleteProductImagesRequestDto>({
    mutationFn: (data) => productService.deleteImages(data),
    ...options,
  });
};
