// ==================== ENUMS ====================

export enum ECurrencyType {
  UZS = 1000,
  USD = 1010,
}

export enum EProductType {
  THING = 1000,
  CAR = 1010,
  WORK = 1020,
}

export enum ECarFuelType {
  UNKNOWN = 0,
  PETROL = 1000,
  DIESEL = 1010,
  ELECTRIC = 1020,
  HYBRID = 1030,
  GAS = 1040,
}

export enum ECarTransmissionType {
  UNKNOWN = 0,
  MANUAL = 1000,
  AUTOMATIC = 1010,
}

export enum ECarCondition {
  UNKNOWN = 0,
  NEW = 1000,
  USED = 1010,
  DAMAGED = 1020,
}

export enum EWorkerType {
  SEEKING = 1000,
  OFFERING = 1010,
  BOTH = 1020,
}

export enum EWorkSalaryType {
  UNKNOWN = 0,
  HOURLY = 1000,
  DAILY = 1010,
  MONTHLY = 1020,
  CONTRACT = 1030,
}

export enum EPaymentType {
  UNKNOWN = 0,
  CASH = 1000,
  BANK_TRANSFER = 1010,
  BOTH = 1020,
}

// ==================== AUTH TYPES ====================

export interface UserCreateReqDto {
  phone_number: string;
  first_name?: string;
  last_name?: string;
}

export interface UserRequestDto {
  phone_number: string;
}

export interface User {
  id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  phone_number: string | null;
  profile_image_url: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ==================== CHAT TYPES ====================

export interface ChatUserInfoDto {
  id: number;
  username: string | null;
  profile_image_url: string | null;
  is_online: boolean;
  last_seen_at: string | null;
}

export interface ChatProductInfoDto {
  id: number;
  title: string | null;
  price: number;
  seller_id: number;
  image_url: string | null;
  status: string | null;
  initial_message: string | null;
}

export interface ChatRoomDto {
  id: number;
  buyer: ChatUserInfoDto;
  seller: ChatUserInfoDto;
  product: ChatProductInfoDto;
  created_at: string;
  last_message_at: string | null;
  last_message: string | null;
  unread_count: number;
  is_other_user_online: boolean;
  other_user_last_seen: string | null;
}

export interface ChatMessageDto {
  id: number;
  chat_room_id: number;
  sender_id: number;
  content: string | null;
  type: string | null;
  sent_at: string;
  sender_name: string | null;
  sender_image_url: string | null;
  is_read: boolean;
  is_edited: boolean;
  is_mine: boolean;
}

export interface ChatListResponse {
  chats: ChatRoomDto[];
  total_count: number;
  total_pages: number;
  current_page: number;
}

export interface ChatMessagesResponse {
  chat_room: ChatRoomDto;
  messages: ChatMessageDto[] | null;
  total_pages: number;
  current_page: number;
  has_more: boolean;
}

export interface CreateChatRoomRequest {
  seller_id: number;
  product_id: number;
  initial_message: string;
}

export interface MarkAsReadRequest {
  chat_room_id: number;
  message_ids: number[];
}

export interface UnreadCountResponse {
  total_unread: number;
  unread_per_chat: Record<string, number>;
}

export interface ChatListParams {
  page?: number;
  pageSize?: number;
}

export interface ChatMessagesParams {
  page?: number;
  pageSize?: number;
}

// ==================== PRODUCT TYPES ====================

export interface ProductAdditionalImagesDto {
  draft_uuid?: string | null;
  image_url?: string | null;
  sort_order: number;
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
  category_id?: number;
  title: string;
  description: string;
  currency_type: ECurrencyType;
  price_uzs?: number;
  price_usd?: number;
  is_free?: boolean;
  is_negotiable?: boolean;
  moljal?: string;
  latitude?: number;
  longitude?: number;
  main_image_url?: string;
  product_type?: EProductType;
  car_brand?: string;
  car_model?: string;
  work_category?: string;
  work_condition?: string;
  images?: ProductAdditionalImagesDto[];
  // Car specific fields
  'car_data.year'?: number;
  'car_data.mileage'?: number;
  'car_data.fuel_type'?: ECarFuelType;
  'car_data.car_transmission'?: ECarTransmissionType;
  'car_data.car_condition'?: ECarCondition;
  // Work specific fields
  'work_data.worker_type'?: EWorkerType;
  'work_data.working_days_hours'?: string;
  'work_data.salary_type'?: EWorkSalaryType;
  'work_data.salary_amount'?: number;
  'work_data.payment_type'?: EPaymentType;
  'work_data.employer_information'?: string;
  'work_data.workplace_information'?: string;
  'work_data.phone_number'?: string;
  'work_data.work_ethics'?: string;
}

export interface ProductUpdateRequest {
  category_id?: number;
  title?: string;
  description?: string;
  currency_type: ECurrencyType;
  price_uzs?: number;
  price_usd?: number;
  is_free?: boolean;
  is_negotiable?: boolean;
  latitude?: number;
  longitude?: number;
  moljal?: string;
  status?: string;
  main_image_url?: string;
  product_type?: EProductType;
  car_brand?: string;
  car_model?: string;
  work_category?: string;
  work_condition?: string;
  type_specific_data?: string;
  // Car specific fields
  'car_data.year'?: number;
  'car_data.mileage'?: number;
  'car_data.fuel_type'?: ECarFuelType;
  'car_data.car_transmission'?: ECarTransmissionType;
  'car_data.car_condition'?: ECarCondition;
  // Work specific fields
  'work_data.worker_type'?: EWorkerType;
  'work_data.working_days_hours'?: string;
  'work_data.salary_type'?: EWorkSalaryType;
  'work_data.salary_amount'?: number;
  'work_data.payment_type'?: EPaymentType;
  'work_data.employer_information'?: string;
  'work_data.workplace_information'?: string;
  'work_data.phone_number'?: string;
  'work_data.work_ethics'?: string;
}

export interface ProductListParams {
  query?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  status?: string;
  current_page?: number;
  page_size?: number;
  user_lat: number;
  user_long: number;
  product_type?: EProductType;
  car_brand?: string;
  car_model?: string;
  work_category?: string;
  work_condition?: string;
}

export interface ProductLikeDto {
  is_liked: boolean;
}

export interface DeleteProductImagesRequestDto {
  image_ids: number[];
}


// Pagination helper
export interface PaginatedResponse<T> {
  data: T[];
  total_count: number;
  total_pages: number;
  current_page: number;
}

// ==================== CATEGORY TYPES ====================

export interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
  parent_id: number | null;
  parent_name: string | null;
  sort_order: number;
  product_count: number;
}

export interface CategoryListResponse {
  categories: Category[];
}
