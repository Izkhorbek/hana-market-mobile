// ==================== COMMON ====================

import {
  ECarCondition,
  ECarFuelType,
  ECarTransmissionType,
  EComplaintType,
  ECurrencyType,
  EPaymentType,
  EProductSortBy,
  EProductType,
  EWorkCondition,
  EWorkerType,
  EWorkSalaryType,
  EWorkType
} from "@/constants/enums";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors: string[];
  status_code: number;
}

// ==================== AUTH TYPES ====================

export interface UserCreateReqDto {
  phone_number: string;
}

export interface UserRequestDto {
  phone_number: string;
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
	id: string
	text: string
	timestamp: string
	isMe: boolean
	status?: 'pending' | 'sent' | 'delivered' | 'read'
	failed?: boolean
	imageUrl?: string
	fileUrl?: string
}

export interface ChatData {
	id: number
	name: string
	avatar?: string
	trustScore: string
	isOnline: boolean
	otherUserId: number
	product: {
		id: number
		title: string
		price: string
		image: string
    status: string
		isSold?: boolean,
    isReserved?: boolean,
	}
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
  message_ids: number[];
}

export interface UnreadCountResponse {
  unread_count: number;
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

export interface SendMessageRequest
{
  chat_room_id: number;
  content: string;             
  type: string;           // Default: Text
  attachmentUrl?: string;
}

export interface MessageReceivedEvent{
  message: ChatMessageDto;
  chat_room: ChatRoomDto;
}
export interface UnreadCountResponse
{
  total_unread: number;
  unread_per_chat: Record<number, number>;
}

// ==================== PRODUCT TYPES ====================

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
  working_days_hours?: string;
  salary_type?: EWorkSalaryType;
  salary_amount?: number;
  payment_type?: EPaymentType;
  employer_information?: string;
  workplace_information?: string;
  phone_number?: string;
  work_ethics?: string;
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
  title?: string;
  description?: string;
  price_uzs?: number;
  is_free?: boolean;
  is_negotiable?: boolean;
  latitude?: number;
  longitude?: number;
  moljal?: string;
}

export interface ProductListParams {
  user_lat: number;
  user_long: number;
  current_page?: number;
  page_size?: number;
  category_id?: number;
  product_type?: EProductType;
  search_query?: string;
  min_price_uzs?: number;
  max_price_uzs?: number;
  is_free?: boolean;
  sort_by?: EProductSortBy;
}

export interface ProductLikeDto {
  is_liked: boolean;
}

export interface LikedProductDto {
  id: number;
  product_id: number;
  title: string | null;
  description: string | null;
  main_image_url: string | null;
  status: string | null;
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

export interface ProductListResponse extends PaginatedResponse<ProductListItemDto> {}

export interface ProductListItemDto {
  id: number;
  title: string | null;
  description: string | null;
  main_image_url: string | null;
  price: string | null;
  distance_km?: number | null;
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

// ==================== CATEGORY TYPES ====================

export interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
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

export interface ComplaintDto {
  id: number;
  reporter_user_id: number;
  reported_user_id: number | null;
  reported_product_id: number | null;
  complaint_type: {
    value: number;
    name: string;
    description: string;
  };
  description: string | null;
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
  last_updated: string;
  sections: ContentSection[];
}

export interface PrivacyDto {
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
  email: string;
  phone_number?: string;
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
