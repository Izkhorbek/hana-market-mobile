import { useInfiniteQuery, useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import type {
  ApiResponse,
  DraftImageDto,
  PaginatedResponse,
  ProductEditResponseDto,
  ProductImageDto,
  ProductLikeDto,
  ProductListParams,
  ProductUpdateRequest,
  SingleProductResponseDto,
} from '../../types';
import { productService } from '../services';

/**
 * Hook to query products list
 */
export const useProductsQuery = ({
  params,
  querySettings = {}
}: {
  params: ProductListParams;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<PaginatedResponse<any>>>>, 'queryKey' | 'queryFn'>;
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
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<SingleProductResponseDto>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['PRODUCT', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
    ...querySettings,
  });
};

/**
 * Hook to query single edit product
 */
export const useEditProductQuery = ({
  id,
  querySettings = {}
}: {
  id: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<ProductEditResponseDto>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['EDIT_PRODUCT', id],
    queryFn: () => productService.getByIdToEdit(id),
    enabled: !!id,
    ...querySettings,
  });
};


/**
 * Hook to query product images
 */
export const useProductImagesQuery = ({
  id,
  querySettings = {}
}: {
  id: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<ProductImageDto[]>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['PRODUCT_IMAGES', id],
    queryFn: () => productService.getImages(id),
    enabled: !!id,
    ...querySettings,
  });
};

/**
 * Hook to create product
 */
export const useCreateProductMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{}>>, Error, FormData>
) => {
  const queryClient = useQueryClient();
  return useMutation<AxiosResponse<ApiResponse<{}>>, Error, FormData>({
    mutationFn: (data) => productService.create(data),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Refresh the home page product list (and any other product queries)
      queryClient.invalidateQueries({ queryKey: ['PRODUCTS_INFINITE'] });
      queryClient.invalidateQueries({ queryKey: ['PRODUCTS'] });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

/**
 * Hook to update product
 */
export const useUpdateProductMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{}>>, Error, { id: number; data: ProductUpdateRequest }>
) => {
  return useMutation<AxiosResponse<ApiResponse<{}>>, Error, { id: number; data: ProductUpdateRequest }>({
    mutationFn: ({ id, data }) => productService.update(id, data),
    ...options,
  });
};

/**
 * Hook to delete product
 */
export const useDeleteProductMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{}>>, Error, number>
) => {
  return useMutation<AxiosResponse<ApiResponse<{}>>, Error, number>({
    mutationFn: (id) => productService.delete(id),
    ...options,
  });
};

/**
 * Hook to toggle product like
 */
export const useToggleLikeMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<{}>>, Error, { id: number; data: ProductLikeDto }>
) => {
  return useMutation<AxiosResponse<ApiResponse<{}>>, Error, { id: number; data: ProductLikeDto }>({
    mutationFn: ({ id, data }) => productService.toggleLike(id, data),
    ...options,
  });
};

/**
 * Hook to upload draft images before creating a product
 */
export const useUploadDraftImagesMutation = (
  options?: UseMutationOptions<AxiosResponse<ApiResponse<DraftImageDto[]>>, Error, FormData>
) => {
  return useMutation<AxiosResponse<ApiResponse<DraftImageDto[]>>, Error, FormData>({
    mutationKey: ['UPLOAD_DRAFT_IMAGES'],
    mutationFn: (data) => productService.uploadDraftImages(data),
    ...options,
  });
};

/**
 * Hook to fetch products with infinite scroll / pagination
 */
export const useInfiniteProductsQuery = ({
  params,
  querySettings = {},
}: {
  params: Omit<ProductListParams, 'current_page'>;
  querySettings?: Record<string, any>;
}) => {
  return useInfiniteQuery({
    queryKey: ['PRODUCTS_INFINITE', params],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      productService.getAll({ ...params, current_page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: AxiosResponse<ApiResponse<PaginatedResponse<any>>>) => {
      const paged = lastPage.data?.data;
      if (!paged) return undefined;
      const totalPages = Math.ceil(paged.total_records / paged.page_size);
      return paged.current_page < totalPages ? paged.current_page + 1 : undefined;
    },
    ...querySettings,
  });
};

/**
 * Hook to fetch products by seller ID
 */
export const useProductsBySellerQuery = ({   
  sellerId,
  page,
  pageSize,
  querySettings = {},
}: {
  sellerId: number; 
  page?: number;
  pageSize?: number;
  querySettings?: Record<string, any>;
}) => {
  return useQuery({
    queryKey: ['PRODUCTS_BY_SELLER', sellerId, page, pageSize],
    queryFn: () => productService.getProductsBySeller(sellerId, page ?? 1, pageSize ?? 20), // Default to first page with 20 items, can be enhanced to support pagination
    enabled: !!sellerId,
    ...querySettings,
  });
};

/**
 * Hook to fetch related products by product ID 
 */
export const useRelatedProductsQuery = ({   
  productId,
  querySettings = {}, 
}: {
  productId: number; 
  querySettings?: Record<string, any>;
}) => {
  return useQuery({
    queryKey: ['RELATED_PRODUCTS', productId],
    queryFn: () => productService.getRelatedProducts(productId),
    enabled: !!productId,
    ...querySettings,
  });
};