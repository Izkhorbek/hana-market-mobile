// ============================================
// COMMON TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors: string[];
  status_code: number;
}

export interface PaginatedResult<T> {
  items: T[];
  current_page: number;
  page_size: number;
  total_records: number;
  total_pages?: number;
}

export interface EnumResponse {
  value: number;
  name: string;
  description: string;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface RegisterRequest {
  phone_number: string; // +998XXXXXXXXX
}

export interface LoginRequest {
  phone_number: string; // +998XXXXXXXXX
}

export interface LoginResponse {
  id: number;
  username?: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  status: 'active' | 'blocked' | 'deleted';
  is_blocked: boolean;
  blocked_info?: BlockedInfo;
}

export interface BlockedInfo {
  blocked_until?: string; // ISO date
  blocked_reason?: string;
  is_permanent: boolean;
}

// ============================================
// USER TYPES
// ============================================

export interface UserProfileResponse {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  bio?: string;
  latitude: number;
  longitude: number;
  search_radius_km: number;
  address_name?: string;
  is_verified: boolean;
  products: ProductSummary[];
  liked: LikeSummary[];
}

export interface ProductSummary {
  id: number;
  title: string;
  price: string;
  is_free: boolean;
  is_negotiable: boolean;
  main_image_url?: string;
}

export interface LikeSummary {
  id: number;
  product_id: number;
  liked_at: string;
}

export interface UpdateUserRequest {
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

// ============================================
// PRODUCT TYPES
// ============================================

export enum ProductType {
  Thing = 0,
  Car = 1,
  Work = 2
}

export enum CurrencyType {
  UZS = 0,
  USD = 1
}

export enum ProductStatus {
  Active = 'active',
  Reserved = 'reserved',
  Sold = 'sold',
  Hidden = 'hidden',
  Deleted = 'deleted'
}

export interface ProductSearchQuery {
  user_lat: number; // required
  user_long: number; // required
  current_page?: number;
  page_size?: number;
  category_id?: number;
  product_type?: ProductType;
  search_query?: string;
  min_price_uzs?: number;
  max_price_uzs?: number;
  is_free?: boolean;
  // sort_by?: 'distance' | 'price_asc' | 'price_desc' | 'newest';
}

export interface AllProductResponse {
  id: number;
  title: string;
  description: string;
  moljal?: string;
  is_free: boolean;
  is_negotiable: boolean;
  status: string;
  likes_count: number;
  views_count: number;
  main_image_url?: string;
  car_brand?: string;
  car_model?: string;
  work_category?: string;
  work_condition?: string;
  distance?: string;
  created_ago: string;
  price?: string;
}

export interface SingleProductResponse {
  id: number;
  user_id: number;
  category_id: number;
  category_name_uz: string;
  category_name_ru: string;
  title: string;
  description: string;
  moljal?: string;
  is_free: boolean;
  is_negotiable: boolean;
  status: string;
  views_count: number;
  likes_count: number;
  main_image_url: string;
  latitude: number;
  longitude: number;
  car_brand?: string;
  car_model?: string;
  work_category?: string;
  work_condition?: string;
  product_type: ProductType;
  product_type_name?: string;
  distance?: string;
  created_ago: string;
  price?: string;
  car_data?: CarAdditionalData;
  work_data?: WorkAdditionalData;
}

export interface CarAdditionalData {
  year?: number;
  mileage?: number;
  fuel_type?: EnumResponse;
  car_transmission?: EnumResponse;
  car_condition?: EnumResponse;
}

export interface WorkAdditionalData {
  worker_type?: EnumResponse;
  salary_type?: EnumResponse;
  payment_type?: EnumResponse;
  working_days_hours?: string;
  employer_information?: string;
  workplace_information?: string;
  salary_amount?: number;
  phone_number?: string;
  work_ethics?: string;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  category_id: number;
  product_type: ProductType;
  is_free: boolean;
  is_negotiable: boolean;
  latitude: number;
  longitude: number;
  moljal?: string;
  currency_type?: CurrencyType;
  price_uzs?: number;
  price_usd?: number;
  car_brand?: string;
  car_model?: string;
  car_data?: string; // JSON string
  work_category?: string;
  work_condition?: string;
  work_data?: string; // JSON string
  images_json: string; // JSON string array of DraftImage
}

export interface DraftImage {
  draft_uuid: string;
  draft_image_url: string;
}

export interface UpdateProductRequest {
  category_id?: number;
  title?: string;
  description?: string;
  price_uzs?: number;
  price_usd?: number;
  is_free?: boolean;
  is_negotiable?: boolean;
  latitude?: number;
  longitude?: number;
  moljal?: string;
  status?: string;
  main_image_url?: string;
  car_brand?: string;
  car_model?: string;
  work_category?: string;
  work_condition?: string;
  product_type?: ProductType;
  car_data?: string;
  work_data?: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductLikeRequest {
  is_liked: boolean;
}

export interface LikedProduct {
  id: number;
  product_id: number;
  title: string;
  description: string;
  main_image_url: string;
  status: string;
  created_ago: string;
  price?: string;
}

export interface MyProduct {
  id: number;
  category_id: number;
  category_name_uz: string;
  category_name_ru: string;
  product_type: ProductType;
  product_type_name?: string;
  title: string;
  description: string;
  moljal?: string;
  is_free: boolean;
  is_negotiable: boolean;
  status: string;
  views_count: number;
  likes_count: number;
  main_image_url: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  price?: string;
  car_brand?: string;
  car_model?: string;
  car_data?: CarAdditionalData;
  work_category?: string;
  work_condition?: string;
  work_data?: WorkAdditionalData;
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: number;
  name_uz: string;
  name_ru: string;
  parent_id?: number;
  sort_order: number;
  product_count: number;
}

export interface CategoryTree {
  id: number;
  name_uz: string;
  name_ru: string;
  sort_order: number;
  product_count: number;
  subcategories: CategoryTree[];
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatListResponse {
  chats: ChatRoom[];
  total_count: number;
  current_page: number;
  page_size: number;
}

export interface ChatRoom {
  chat_room_id: number;
  product_id: number;
  product_title: string;
  product_image_url?: string;
  other_user_id: number;
  other_user_name?: string;
  other_user_image?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  is_seller: boolean;
}

export interface CreateChatRoomRequest {
  seller_id: number;
  product_id: number;
}

export interface ChatRoomDetail {
  chat_room_id: number;
  buyer_id: number;
  seller_id: number;
  product_id: number;
  product: ProductInfo;
  buyer_info: UserInfo;
  seller_info: UserInfo;
  created_at: string;
}

export interface ProductInfo {
  id: number;
  title: string;
  main_image_url?: string;
  price?: string;
}

export interface UserInfo {
  id: number;
  username?: string;
  profile_image_url?: string;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  total_count: number;
  current_page: number;
  page_size: number;
}

export interface ChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  message_type: MessageType;
  text_content?: string;
  image_url?: string;
  file_url?: string;
  is_read: boolean;
  sent_at: string;
}

export enum MessageType {
  Text = 1,
  Image = 2,
  File = 3,
  System = 4
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface MarkAsReadRequest {
  chat_room_id: number;
}

export interface UserOnlineStatus {
  isOnline: boolean;
  lastSeenAt?: string;
}

// ============================================
// SIGNALR TYPES
// ============================================

export interface SendMessageRequest {
  chatRoomId: number;
  textContent: string;
  messageType: MessageType;
}

export interface TypingIndicatorRequest {
  chatRoomId: number;
  isTyping: boolean;
}

export interface ReceiveMessageEvent {
  id: number;
  chat_room_id: number;
  sender_id: number;
  message_type: MessageType;
  text_content?: string;
  image_url?: string;
  file_url?: string;
  is_read: boolean;
  sent_at: string;
}

export interface UserTypingEvent {
  user_id: number;
  chat_room_id: number;
  is_typing: boolean;
}

export interface MessagesReadEvent {
  chat_room_id: number;
  reader_user_id: number;
  read_at: string;
}

export interface UserStatusChangedEvent {
  user_id: number;
  is_online: boolean;
  last_seen_at: string;
}

// ============================================
// COMPLAINT TYPES
// ============================================

export enum ComplaintType {
  Spam = 1000,
  Inappropriate = 1010,
  Fraud = 1020,
  Other = 1030
}

export interface CreateComplaintRequest {
  reported_user_id: number;
  reported_product_id: number;
  complaint_type: ComplaintType;
  description: string;
}

export interface ComplaintResponse {
  id: number;
  reporter_user_id: number;
  reported_user_id: number;
  reported_product_id: number;
  complaint_type: EnumResponse;
  description: string;
  status: string;
  created_at: string;
}

export interface ComplaintTypeInfo {
  value: number;
  name: string;
  display_name: string;
}
