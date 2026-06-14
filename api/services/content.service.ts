import type {
    AboutUsDto,
    ApiResponse,
    ContentLang,
    NewsItem,
    NewsListParams,
    PrivacyDto,
    TermsDto,
} from '../../types'
import axiosInstance from '../api'
import ENDPOINT from '../endpoints'

export const contentService = {
  /**
   * Get About Us content
   * GET /api/content/about-us
   */
  getAboutUs: (lang?: ContentLang) => {
    return axiosInstance.get<ApiResponse<AboutUsDto>>(ENDPOINT.CONTENT.ABOUT_US, {
      params: { lang },
    })
  },

  /**
   * Get Terms of Service
   * GET /api/content/terms
   */
  getTerms: (lang?: ContentLang) => {
    return axiosInstance.get<ApiResponse<TermsDto>>(ENDPOINT.CONTENT.TERMS, {
      params: { lang },
    })
  },

  /**
   * Get Privacy Policy
   * GET /api/content/privacy
   */
  getPrivacy: (lang?: ContentLang) => {
    return axiosInstance.get<ApiResponse<PrivacyDto>>(ENDPOINT.CONTENT.PRIVACY, {
      params: { lang },
    })
  },

  /**
   * Get paginated news list
   * GET /api/content/news
   */
  getNewsList: (params?: NewsListParams) => {
    return axiosInstance.get<ApiResponse<NewsItem[]>>(ENDPOINT.CONTENT.NEWS, {
      params,
    })
  },

  /**
   * Get single news by ID
   * GET /api/content/news/{id}
   */
  getNewsById: (id: number) => {
    return axiosInstance.get<ApiResponse<NewsItem>>(`${ENDPOINT.CONTENT.NEWS}/${id}`)
  },
}
