// ==================== COMMON ====================

import {
  ECarCondition,
  ECarFuelType,
  ECarTransmissionType,
  EComplaintType,
  ECurrencyType,
  EProductSortBy,
  EProductType,
  EWorkCondition,
  EWorkerType,
  EWorkSalaryType,
  EWorkType,
} from '@/constants/enums'

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors: string[];
  status_code: number;
}

// ==================== APP VERSION CHECK ====================

/** Query params for GET /api/app/version-check. */
export interface VersionCheckParams {
  platform: 'android' | 'ios';
  /** App semantic version, e.g. "1.0.3". */
  version: string;
  /** Native build number. Omitted when it can't be resolved numerically. */
  build?: number;
  locale: 'uz' | 'ru' | 'en';
}

/** Response body (inside ApiResponse.data) for the version-check endpoint. */
export interface VersionCheckResponse {
  update_required: boolean;
  update_recommended: boolean;
  latest_version: string;
  latest_build: number;
  min_supported_version: string;
  min_supported_build: number;
  store_url: string;
  message: string;
}

// ==================== TELEMETRY ====================

/**
 * Mobile log payload sent to POST /telemetry/log.
 * Mirrors backend MobileLogDto.
 */

export interface MobileLogDto {
  /** Severity level: "info", "warn", "error", "fatal" */
  level: string;

  /** Stable, machine-readable error code (e.g. "OTP_PARSE_FAILED", "PRODUCT_LOAD_TIMEOUT"). Max 120 chars. */
  code?: string;

  /** Human-readable message. Max 2000 chars. */
  message: string;

  /** Stack trace (truncated by client if long). Max 8000 chars. */
  stack?: string;

  /** Trace id correlating this event with a specific backend request. Max 64 chars. */
  trace_id?: string;

  /** Screen / route name where the issue occurred. Max 120 chars. */
  screen?: string;

  /** Mobile app version (e.g. "1.4.2"). Max 40 chars. */
  app_version?: string;

  /** Platform: "android", "ios", "web". Max 20 chars. */
  platform?: string;

  /** OS version (e.g. "Android 14", "iOS 17.2"). Max 60 chars. */
  os_version?: string;

  /** Device model (e.g. "Samsung A52", "iPhone 13"). Max 100 chars. */
  device?: string;

  /** Free-form structured context (will be serialized to JSON in logs). Keep < 4 KB serialized. */
  extra?: Record<string, any>;
}

export interface EnumResponse {
    /// <summary>
    /// Numeric value (DB da saqlanadi)
    /// </summary>
    value: number ;

    /// <summary>
    /// Enum name (C# code)
    /// </summary>
    name: string;

    /// <summary>
    /// User-friendly description (frontend uchun)
    /// </summary>
    description: string;
}

// ==================== AUTH TYPES ====================

export interface UserCreateReqDto {
  phone_number: string;
}

export interface UserRequestDto {
  phone_number: string;
}

// New OTP-based auth contract.
// Server now exposes /auth/request-otp and /auth/verify-otp. Registration is
// implicit on first successful verify.
export interface RequestOtpRequest {
  phone_number: string;
}

export interface VerifyOtpRequest {
  phone_number: string;
  code: string;
}

// Refresh access token using a previously issued refresh token.
// Backend contract: POST /auth/refresh { refresh_token } -> new tokens in
// X-Access-Token / X-Expires-At / X-Refresh-Token / X-Refresh-Token-Expires-At
// response headers (refresh-token rotation).
export interface RefreshTokenRequest {
  refresh_token: string;
}

// Token bundle returned (via response headers) by verify-otp and refresh.
export interface AuthTokens {
  access_token: string;
  expires_at: string | null;
  refresh_token: string | null;
  refresh_token_expires_at: string | null;
}

export interface BlockedInfo {
  blocked_until: string | null;
  blocked_reason: string | null;
  is_permanent: boolean;
}

export interface User {
  id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  email: string | null;
  phone_number: string | null;
  profile_image_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  search_radius_km?: number | null;
  address_name?: string | null;
  is_verified?: boolean;
  status?: string | null;
  is_blocked?: boolean;
  blocked_info?: BlockedInfo | null;
  total_products?: number;
  total_likes?: number;
  /** Server-side Terms/Privacy acceptance status (App Store 1.2). */
  terms_acceptance?: TermsAcceptanceStatus | null;
}

/** Whether the user has accepted the current Terms/Privacy (from GET user/my). */
export interface TermsAcceptanceStatus {
  accepted: boolean;
  terms_version: string | null;
  privacy_version: string | null;
  accepted_at: string | null;
  /** false when a newer Terms/Privacy version was published after acceptance. */
  up_to_date: boolean;
}

// ==================== UGC SAFETY: BLOCK & TERMS (Apple 1.2) ====================

export interface BlockUserRequest {
  blocked_user_id: number;
  reason?: string;
}

export interface UnblockUserRequest {
  blocked_user_id: number;
}

export interface BlockUserResponse {
  blocked_user_id: number;
  created_at: string;
}

/** One row of GET user/blocked (paginated). */
export interface BlockedUserDto {
  user_id: number;
  username: string | null;
  profile_image_url: string | null;
  reason: string | null;
  created_at: string;
}

export interface AcceptTermsRequest {
  terms_version: string;
  privacy_version: string;
  /** Informational — the server stamps its own authoritative timestamp. */
  accepted_at?: string;
  app_version?: string;
  platform?: 'ios' | 'android';
}

export interface AcceptTermsResponse {
  accepted: boolean;
  terms_version: string;
  accepted_at: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  search_radius_km?: number;
  address_name?: string;
}

// ==================== CHAT TYPES ====================
// Types for UI display
export interface DisplayMessage {
  id: string;
  localId?: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  failed?: boolean;
  imageUrl?: string;
  fileUrl?: string;
}

export interface ChatData {
  id: number;
  name: string;
  avatar?: string;
  trustScore: string;
  isOnline: boolean;
  otherUserId: number;
  product: {
    id: number;
    title: string;
    price: string;
    image: string;
    status: string;
    isSold?: boolean;
    isReserved?: boolean;
    isDeleted?: boolean;
  };
}

export interface ChatProductInfoDto {
  id: number;
  title: string;
  is_free: boolean;
  price?: number;

  seller_id: number;
  image_url?: string;
  status: string;
  initial_message: string;
}

export interface ChatUserInfoDto {
  id: number;
  username: string;
  profile_image_url: string;
  is_online: boolean;
  last_seen_at: string | null | Date;
}

export interface ChatRoomDto {
  id: number;
  buyer: ChatUserInfoDto;
  seller: ChatUserInfoDto;
  product: ChatProductInfoDto;
  created_at: Date | string | null;
  last_message_at?: Date | string | null;
  last_message?: string;
  unread_count: number;
  is_other_user_online?: boolean;
  other_user_last_seen?: string | null | Date;
}

export interface ChatMessageDto {
  id: number;
  chat_room_id: number;
  sender_id: number;
  content: string;
  message_type: number;
  sent_at: string;
  sender_name: string | null;
  sender_image_url: string | null;
  is_read: boolean;
  is_edited?: boolean;
  is_mine?: boolean; // For convenience in UI
}

export interface ChatMessagesResponse {
  chat_room: ChatRoomDto;
  messages: ChatMessageDto[];
  total_pages: number;
  current_page: number;
  has_more: boolean;
}

export interface ChatListResponse {
  chats: ChatRoomDto[];
  total_unread_count: number;
  total_pages: number;
  current_page: number;
}

export interface CreateChatRoomRequest {
  seller_id: number;
  product_id: number;
  initial_message?: string;
}

export interface MarkAsReadRequest {
  chat_room_id: number;
}

export interface UserOnlineStatus {
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface ChatListParams {
  page?: number;
  pageSize?: number;
}

export interface ChatMessagesParams {
  page?: number;
  pageSize?: number;
}

export interface SendMessageRequest {
  chat_room_id: number;
  content: string;
  type: string; // Default: Text
  attachmentUrl?: string;
}

export interface MessageReceivedEvent {
  message: ChatMessageDto;
  chat_room: ChatRoomDto;
}
export interface UnreadCountResponse {
  total_unread: number;
  unread_per_chat: Record<number, number>;
}

// ==================== PRODUCT TYPES ====================

export type ProductStatus = 'active' | 'reserved' | 'sold' | 'hidden'

export interface DraftImageDto {
  draft_uuid: string;
  draft_image_url: string;
  sort_order: number;
}

export interface ProductImageDto {
  id: number;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface CarData {
  year?: number;
  mileage?: number;
  fuel_type?: ECarFuelType;
  car_transmission?: ECarTransmissionType;
  car_condition?: ECarCondition;
}

export interface WorkData {
  worker_type?: EWorkerType;
  salary_type?: EWorkSalaryType;
  salary_amount?: number;
  employer_information?: string;
  phone_number?: string;
}

export interface ProductCreateRequest {
  title: string;
  description: string;
  category_id?: number;
  product_type?: EProductType;
  is_free?: boolean;
  is_negotiable?: boolean;
  latitude?: number;
  longitude?: number;
  moljal?: string;
  currency_type?: ECurrencyType;
  price_uzs?: number;
  price_usd?: number;
  car_brand?: string;
  car_model?: string;
  work_type?: EWorkType;
  work_condition?: EWorkCondition;
  car_data?: string; // JSON.stringify(CarData)
  work_data?: string; // JSON.stringify(WorkData)
  images_json?: string; // JSON.stringify(DraftImageDto[])
}

export interface ProductUpdateRequest {
  category_id?: number;
  product_type?: EProductType;
  title?: string;
  description?: string;
  currency_type?: ECurrencyType;
  price_uzs?: number;
  price_usd?: number;
  is_free?: boolean;
  is_negotiable?: boolean;
  moljal?: string;
  status?: ProductStatus;
  car_brand?: string;
  car_model?: string;
  work_type?: EWorkType;
  work_condition?: EWorkCondition;
  car_data?: CarData; // JSON.stringify(CarData)
  work_data?: WorkData; // JSON.stringify(WorkData)
}

export interface ProductListParams {
  user_lat: number;
  user_long: number;
  current_page?: number;
  page_size?: number;
  status?: ProductStatus;
  category_id?: number;
  product_type?: EProductType;
  search_query?: string;
  currency_type?: ECurrencyType; // Filter by currency type (UZS or USD)
  min_price?: number;   // Minimum price filter (in UZS or USD, depending on currency_type)
  max_price?: number;   // Maximum price filter (in UZS or USD, depending on currency_type)
  is_free?: boolean;    // Filter for free products
  sort_by?: EProductSortBy; // Sorting option
}

/**
 * Lightweight marker payload for the map screen.
 * Returned (as a flat list) by `GET /api/product/map-markers` — intentionally
 * far smaller than the full product DTO from `/api/product/all`. The bottom
 * sheet enriches itself with full detail lazily (only for the selected marker).
 */
export interface ProductMapMarkerDto {
  id: number;
  latitude: number;
  longitude: number;
  title: string | null;
  price: string | null;
  is_free: boolean;
  is_negotiable: boolean;
  product_type: EProductType;
  product_type_name: string | null;
  main_image_url: string | null;
  currency_type: ECurrencyType;
  distance: string | null;
  created_ago: string | null;
}

/** Query params for `GET /api/product/map-markers`. */
export interface ProductMapMarkerParams {
  user_lat: number;
  user_long: number;
  radius_km?: number;
  product_type?: EProductType;
  category_id?: number;
  search_query?: string;
  status?: ProductStatus;
  limit?: number;
}

export interface ProductLikeDto {
  is_liked: boolean;
}

export interface LikedProductDto {
  id: number;
  product_id: number;
  title: string | null;
  likes_count: number;
  description: string | null;
  main_image_url: string | null;
  status: string | null;
  moljal: string | null;
  created_ago: string | null;
  price: string | null;
}

// Pagination helper
export interface PaginatedResponse<T> {
  items: T[];
  current_page: number;
  page_size: number;
  total_records: number;
}

export interface ProductListItemDto {
  id: number;
  title: string | null;
  description: string | null;
  main_image_url: string | null;
  price: string | null;
  distance?: string | null;
  created_ago: string | null;
  is_liked?: boolean;
}

export type MyProductStatus = 'active' | 'sold' | 'hidden';

export interface MyProductDto {
  id: number;
  category_id: number;
  category_name_uz: string | null;
  category_name_ru: string | null;
  product_type: number;
  product_type_name: string | null;
  title: string | null;
  description: string | null;
  moljal: string | null;
  is_free: boolean;
  is_negotiable: boolean;
  status: MyProductStatus;
  views_count: number;
  likes_count: number;
  main_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  price: string | null;
}

export interface SingleProductResponseDto {
  id: number;
  user_id: number;
  seller: User;

  category_id: number;
  category_name_uz?: string;
  category_name_ru?: string;

  product_type?: EProductType;
  product_type_name?: string;

  title: string;
  description?: string;
  price: string;
  is_free: boolean;
  is_negotiable: boolean;
  main_image_url: string;
  moljal?: string;
  status: string;
  latitude: number;
  longitude: number;
  distance: string;
  car_brand?: string;
  car_model?: string;
  work_condition?: string;
  work_type?: string;
  created_ago: string;
  views_count: number;
  likes_count: number;
  is_liked: boolean;

  images: string[];

  car_data?: CarData;

  work_data?: WorkData;
}

export interface ProductEditResponseDto
{
    id: number;
    user_id: number;

    category_id: number;
    category_name_uz?: string;
    category_name_ru?: string;

    product_type: EProductType;

    title: string;
    description?: string;
    moljal?: string;
    status: string;
    views_count: number;
    likes_count: number;
    // ===== CURRENCY AND PRICE (raw) =====
    currency_type?: ECurrencyType;
    price_uzs?: number;
    price_usd?: number;

    is_free?: boolean;
    is_negotiable?: boolean;

    // ===== LOCATION (raw) =====
    latitude?: number;
    longitude?: number;

    // ===== MAIN IMAGE =====
    main_image_url?: string;

    // ===== CAR =====
    car_brand?: string;
    car_model?: string;
    car_data?: CarData;

    // ===== WORK =====
    work_type?: EWorkType;
    work_condition?: EWorkCondition;
    work_data?: WorkData;

    created_at: string;
    // ===== IMAGES =====
    images: ProductEditImageDto[];
}

 /// <summary>
 /// Lightweight image item used in <see cref="ProductEditResponseDto"/> so
 /// the client can identify each image (for delete/reorder operations).
 /// </summary>
 export interface ProductEditImageDto
 {
     id: number;
     image_url: string;
     sort_order: number;
 }

// ==================== CATEGORY TYPES ====================

export interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
  image_url: string;
  parent_id: number | null;
  sort_order: number;
  product_count: number;
}

export interface CategoryTreeItem {
  id: number;
  name_uz: string;
  name_ru: string;
  sort_order: number;
  product_count: number;
  subcategories: CategoryTreeItem[];
}

// ==================== COMPLAINT TYPES ====================

export interface CreateComplaintRequest {
  reported_user_id?: number;
  reported_product_id?: number;
  complaint_type: EComplaintType;
  description?: string;
}

export interface ComplaintTypeDto {
  value: number;
  name: string;
  display_name: string;
}

export interface ComplaintResponseDto {
  id: number;
  reporter_user_id: number;
  reported_user_id: number | null;
  reported_product_id: number | null;
  complaint_type: ComplaintTypeDto;
  description: string | null;
  status: string;
  created_at: string;
}

// ==================== REPORT TYPES ====================

export interface ReportCreateRequestDto{
  reported_user_id: number;
  /// <summary>
  /// Optional: the product that triggered the report
  /// </summary>
  product_id?: number;
  /// <summary>
  /// string:  5 < size < 500
  /// </summary>
  reason: string;
}

export interface ReportResponseDto{
  id: number;
  reporter_user_id: number;
  reported_user_id: number;
  product_id?: number;
  reason: string;
  status: string;
  created_at: string;
}

// ==================== CONTENT TYPES ====================

export type ContentLang = 'uz' | 'ru';

export interface AboutUsHeader {
  app_name: string;
  version: string;
  tagline: string;
  logo_url: string;
}

export interface AboutUsMission {
  title: string;
  description: string;
  icon: string;
}

export interface AboutUsAboutApp {
  title: string;
  paragraphs: string[];
}

export interface AboutUsValue {
  icon: string;
  title: string;
  description: string;
}

export interface AboutUsFooter {
  title: string;
  description: string;
  copyright: string;
  tagline: string;
}

export interface AboutUsDto {
  header: AboutUsHeader;
  mission: AboutUsMission;
  about_app: AboutUsAboutApp;
  values: AboutUsValue[];
  footer: AboutUsFooter;
}

export interface ContecSectionItem {
  subtitle: string | null;
  content: string;
  bullet_points: string[] | null;
}

export interface ContentSection {
  order: number;
  title: string;
  intro: string;
  items: ContecSectionItem[];
}

export interface TermsDto {
  /** Machine-comparable version id used to record & re-check acceptance. */
  version?: string;
  last_updated: string;
  sections: ContentSection[];
}

export interface PrivacyDto {
  version?: string;
  last_updated: string;
  sections: ContentSection[];
}

export interface NewsItem {
  id: number;
  title_uz: string;
  title_ru: string;
  content_uz: string;
  content_ru: string;
  image_url: string | null;
  category: string;
  is_published: boolean;
  published_at: string;
  created_at: string;
}

export interface NewsListParams {
  page?: number;
  pageSize?: number;
}

// ==================== CONTACT TYPES ====================

export type FeedbackType =
  | 'bug_report'
  | 'feature_request'
  | 'general_feedback'
  | 'complaint';

export interface ContactMessageRequest {
  name: string;
  email?: string;
  phone_number: string;
  subject: string;
  message: string;
}

export interface ContactMessageResponse {
  message_id: number;
}

export interface FeedbackRequest {
  feedback_type: FeedbackType;
  message: string;
  rating?: number;
  contact_email?: string;
}

export interface FeedbackResponse {
  feedback_id: number;
}

// ==================== NOTIFICATIONS TYPES ====================
export const NotificationType = {
      NewMessage:  'new_message',
      NewChatRoom: 'new_chat_room',
      NewProduct: 'new_product',  
      ProductLiked: 'product_liked',
      ProductSold: 'product_sold',
      ProductExpired: 'product_expired',
      General: 'general',
    } as const   

    export interface RegisterPushTokenDto {
    device_token: string;

    /// <summary>android | ios</summary>
    platform: 'android' | 'ios';
}

export interface DeactivatePushTokenDto {
    device_token: string;
}

export interface NotificationListItemDto {
    id: number;
    type: string;
    title: string;
    message: string;
    related_id?: number;
    related_type: string;
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

export interface MarkNotificationsReadDto {
    /// <summary>Leave empty to mark ALL unread notifications as read.</summary>
    ids: number[];
}

// ==================== MANNER TEMPERATURE ====================
// App-facing request is camelCase; the manner service maps it to the backend's
// snake_case body. Responses below are snake_case to match the API exactly.

export interface CreateMannerReviewRequest {
  chatRoomId: number;
  targetUserId: number;
  rating: 1 | 2 | 3 | 4 | 5;
  isPolite?: boolean;
  isFastResponse?: boolean;
  isOnTime?: boolean;
  isFairPrice?: boolean;
  isNoShow?: boolean;
  isRude?: boolean;
  isSpam?: boolean;
  comment?: string;
}

export interface MannerTemperatureSummaryResponse {
  user_id: number;
  manner_temperature: number;
  review_count: number;
  updated_at?: string | null;
}

export interface MannerReviewResponse {
  id: number;
  chat_room_id: number;
  reviewer_user_id: number;
  target_user_id: number;
  rating: number;
  comment?: string | null;
  is_polite: boolean;
  is_fast_response: boolean;
  is_on_time: boolean;
  is_fair_price: boolean;
  is_no_show: boolean;
  is_rude: boolean;
  is_spam: boolean;
  temperature_change: number;
  created_at: string;
}

export interface MannerEventResponse {
  id: number;
  target_user_id: number;
  event_type: string;
  temperature_change: number;
  created_at: string;
}

/** POST /reviews returns the created review plus the target's updated summary. */
export interface CreateMannerReviewResponse {
  review: MannerReviewResponse;
  summary: MannerTemperatureSummaryResponse;
}

// ==================== SERVICE (XIZMAT) ====================
// Feature-scoped types live in their own file (ARCHITECTURE.md §4) and are
// re-exported here so existing `@/types` imports keep working.
export * from './service'

// ==================== GAZ (GAS DISTRIBUTION) ====================
export * from './gas'