import { useTranslations } from '@/hooks/use-translation'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import type {
  AboutUsDto,
  ApiResponse,
  ContentLang,
  NewsItem,
  NewsListParams,
  PrivacyDto,
  TermsDto,
} from '../../types'
import { contentService } from '../services'

/**
 * Hook to get About Us content, automatically uses current app locale
 */
export const useAboutUsQuery = ({
  querySettings = {},
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<AboutUsDto>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const { locale } = useTranslations()
  const lang = (locale === 'ru' ? 'ru' : 'uz') as ContentLang

  return useQuery({
    queryKey: ['CONTENT_ABOUT_US', lang],
    queryFn: () => contentService.getAboutUs(lang),
    staleTime: 1000 * 60 * 30, // 30 min — rarely changes
    ...querySettings,
  })
}

/**
 * Hook to get Terms of Service, automatically uses current app locale
 */
export const useTermsQuery = ({
  querySettings = {},
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<TermsDto>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const { locale } = useTranslations()
  const lang = (locale === 'ru' ? 'ru' : 'uz') as ContentLang

  return useQuery({
    queryKey: ['CONTENT_TERMS', lang],
    queryFn: () => contentService.getTerms(lang),
    staleTime: 1000 * 60 * 30,
    ...querySettings,
  })
}

/**
 * Hook to get Privacy Policy, automatically uses current app locale
 */
export const usePrivacyQuery = ({
  querySettings = {},
}: {
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<PrivacyDto>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  const { locale } = useTranslations()
  const lang = (locale === 'ru' ? 'ru' : 'uz') as ContentLang

  return useQuery({
    queryKey: ['CONTENT_PRIVACY', lang],
    queryFn: () => contentService.getPrivacy(lang),
    staleTime: 1000 * 60 * 30,
    ...querySettings,
  })
}

/**
 * Hook to get paginated news list
 */
export const useNewsListQuery = ({
  params = {},
  querySettings = {},
}: {
  params?: NewsListParams;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<NewsItem[]>>>, 'queryKey' | 'queryFn'>;
} = {}) => {
  return useQuery({
    queryKey: ['CONTENT_NEWS', params],
    queryFn: () => contentService.getNewsList(params),
    staleTime: 1000 * 60 * 5,
    ...querySettings,
  })
}

/**
 * Hook to get a single news article by ID
 */
export const useNewsByIdQuery = ({
  id,
  querySettings = {},
}: {
  id: number;
  querySettings?: Omit<UseQueryOptions<AxiosResponse<ApiResponse<NewsItem>>>, 'queryKey' | 'queryFn'>;
}) => {
  return useQuery({
    queryKey: ['CONTENT_NEWS_DETAIL', id],
    queryFn: () => contentService.getNewsById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    ...querySettings,
  })
}
