import { useTranslations } from '@/hooks/use-translation';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import type { ApiResponse, Category, CategoryTreeItem, PaginatedResponse, ProductListParams } from '../../types';
import { categoryService } from '../services';

/**
 * Hook to query all categories
 */
export const useCategoriesQuery = ({
  querySettings = {}
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<Category[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const { locale } = useTranslations();
  return useQuery({
    queryKey: ['CATEGORIES', locale],
    queryFn: () => categoryService.getAll(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    ...querySettings,
  });
};

/**
 * Hook to query categories as a tree
 */
export const useCategoryTreeQuery = ({
  querySettings = {}
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<CategoryTreeItem[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const { locale } = useTranslations();
  return useQuery({
    queryKey: ['CATEGORIES_TREE', locale],
    queryFn: () => categoryService.getTree(),
    staleTime: 1000 * 60 * 5,
    ...querySettings,
  });
};

/**
 * Hook to query a single category by ID
 */
export const useCategoryByIdQuery = ({
  categoryId,
  querySettings = {}
}: {
  categoryId: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<Category>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['CATEGORY', categoryId],
    queryFn: () => categoryService.getById(categoryId),
    enabled: !!categoryId,
    ...querySettings,
  });
};

/**
 * Hook to query products by category
 */
export const useProductsByCategoryQuery = ({
  categoryId,
  params,
  querySettings = {}
}: {
  categoryId: number;
  params: ProductListParams;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<PaginatedResponse<any>>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['CATEGORY_PRODUCTS', categoryId, params],
    queryFn: () => categoryService.getProductsByCategory(categoryId, params),
    enabled: !!categoryId,
    ...querySettings,
  });
};

/**
 * Hook to query subcategories of a parent category
 */
export const useSubcategoriesQuery = ({
  parentId,
  querySettings = {}
}: {
  parentId: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<Category[]>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['SUBCATEGORIES', parentId],
    queryFn: () => categoryService.getSubcategories(parentId),
    enabled: !!parentId,
    ...querySettings,
  });
};
