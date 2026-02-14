import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { categoryService } from '../services';
import { useTranslations } from '@/hooks/use-translation';

/**
 * Hook to query all categories
 */
export const useCategoriesQuery = ({
  data,
  querySettings = {}
}: {
  data?: any;
  querySettings?: Omit<UseQueryOptions<AxiosResponse>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const { locale } = useTranslations();
  return useQuery({
    queryKey: ['CATEGORIES', locale],
    queryFn: () => categoryService.getAll(data),
    staleTime: 1000 * 60 * 5, // Categories don't change often, cache for 5 minutes
    ...querySettings,
  });
};
