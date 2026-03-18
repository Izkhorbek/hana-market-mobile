import { Platform, StatusBar } from "react-native";
      
// Platform-aware layout constants
export const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 80;
export const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : 30;
export const TAB_FOOTER_HEIGHT = Platform.OS === 'ios' ? 100 : 120;

// STATUS_BAR_HEIGHT: 44 on iOS (behind notch) | actual bar height on Android
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 0);
const STICKY_HEADER_HEIGHT = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 0) + 56;

 export type MessageTypeString = 'text' | 'image' | 'file';


export const AppLimits = {
  STATUS_BAR_HEIGHT: STATUS_BAR_HEIGHT,
  STICKY_HEADER_CONTENT_HEIGHT: 56,
  STICKY_HEADER_HEIGHT: STATUS_BAR_HEIGHT + 56,
  HERO_HEIGHT: Platform.OS === 'ios' ? 400 : 300,
  // Extra px the image container extends below the clip area for parallax travel
  PARALLAX_EXTRA: 100,
  // Image moves up at 30% of scroll speed (PARALLAX_EXTRA must be >= HERO_HEIGHT * PARALLAX_FACTOR)
  PARALLAX_FACTOR: 0.3,
  STICKY_THRESHOLD: Platform.OS === 'ios' ? 400 : 300 - STICKY_HEADER_HEIGHT,

  Image: {
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    MAX_FILE_SIZE_MB: 5,
    ALLOWED_CONTENT_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
    ALLOWED_FILE_EXTENSIONS: ['jpeg', 'png', 'jpg', 'gif', 'webp'],
    MAX_IMAGES_PER_PRODUCT: 5,
    MIN_WIDTH_PIXELS: 100,
    MAX_WIDTH_PIXELS: 4000,
    MIN_HEIGHT_PIXELS: 100,
    MAX_HEIGHT_PIXELS: 4000,
  },

  DraftImage: {
    EXPIRATION_MINUTES: 10,
  },

  Location: {
    MIN_LATITUDE: 37.0,
    MAX_LATITUDE: 46.0,
    MIN_LONGITUDE: 56.0,
    MAX_LONGITUDE: 74.0,
    DEFAULT_RADIUS_KM: 3.0,
    MIN_RADIUS_KM: 0,
    MAX_RADIUS_KM: 12,
  },

  DefaultCoordinates: {
    TASHKENT_LATITUDE: 41.341948,
    TASHKENT_LONGITUDE: 69.33725,
  },

  Product: {
    MIN_TITLE_LENGTH: 5,
    MAX_TITLE_LENGTH: 100,
    MIN_MOLJAL_LENGTH: 0,
    MAX_MOLJAL_LENGTH: 50,
    MIN_DESCRIPTION_LENGTH: 1,
    MAX_DESCRIPTION_LENGTH: 1000,
    MIN_PRICE_UZS: 0.01,
    MAX_PRICE_UZS: 999999999.99,
    MIN_PRICE_USD: 0.01,
    MAX_PRICE_USD: 999999999.99,
    ALLOWED_STATUSES: ['active', 'reserved', 'sold'] as const,
  },

  Pagination: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 200,
  },

  Chat: {
    MAX_MESSAGE_LENGTH: 500,
    MAX_CHAT_ROOMS_PER_USER: 100,
    MAX_MESSAGES_PER_PAGE: 20,
    MAXIMUM_RECEIVE_MESSAGE_SIZE: 1024 * 1024, // 1MB
    MESSAGE_TYPES: {
      TEXT: 'text',
      IMAGE: 'image',
      FILE: 'file',
    } as const,
    },
  ProductStatusColors: {
    active: '',
    reserved: 'green',
    sold: 'black',
  } as const,
  Home: {
    SHEET_HEIGHT: 340,
  } as const,

} as const;
