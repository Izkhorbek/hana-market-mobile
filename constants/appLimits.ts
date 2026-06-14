import { Platform, StatusBar } from 'react-native'

// Platform-aware layout constants
export const HEADER_HEIGHT = Platform.OS === 'ios' ? 45 : 50

// Dynamic safe area values - get actual values at app startup
const STATUS_BAR_HEIGHT =
  StatusBar.currentHeight ?? (Platform.OS === 'ios' ? 44 : 0)
const STICKY_HEADER_HEIGHT = STATUS_BAR_HEIGHT + 32

export type MessageTypeString = 'text' | 'image' | 'file';

export const UZBEK_MOBILE_OPERATORS: Record<string, string> = {
  '20': 'OQ',
  '33': 'Humans',
  '50': 'Ucell',
  '70': 'Uzmobile',
  '77': 'Uzmobile',
  '80': 'Perfectum',
  '87': 'MobiUz',
  '88': 'MobiUz',
  '90': 'Beeline',
  '91': 'Beeline',
  '92': 'Beeline',
  '93': 'Ucell',
  '94': 'Ucell',
  '95': 'Uzmobile',
  '97': 'MobiUz',
  '98': 'Perfectum',
  '99': 'Uzmobile',
}

export  const UZBEK_MOBILE_PREFIXES = Object.keys(UZBEK_MOBILE_OPERATORS)
export  const UZBEK_MOBILE_PREFIX_SET = new Set(UZBEK_MOBILE_PREFIXES)
export  const UZBEK_MOBILE_PHONE_REGEX = /^(20|33|50|70|77|80|87|88|90|91|92|93|94|95|97|98|99)\d{7}$/


export const AppLimits = {
  STATUS_BAR_HEIGHT: STATUS_BAR_HEIGHT,
  STICKY_HEADER_HEIGHT: STICKY_HEADER_HEIGHT,
  HERO_HEIGHT: Platform.OS === 'ios' ? 400 : 300,
  // Extra px the image container extends below the clip area for parallax travel
  PARALLAX_EXTRA: 100,
  // Image moves up at 30% of scroll speed (PARALLAX_EXTRA must be >= HERO_HEIGHT * PARALLAX_FACTOR)
  PARALLAX_FACTOR: 0.3,
  STICKY_THRESHOLD: Platform.OS === 'ios' ? 400 : 300 - STICKY_HEADER_HEIGHT,

  Image: {
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    MAX_FILE_SIZE_MB: 5,
    ALLOWED_CONTENT_TYPES: [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
    ],
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
    DEFAULT_RADIUS_KM: 5.0,
    MIN_RADIUS_KM: 0,
    MAX_RADIUS_KM: 20,
  },

  DefaultCoordinates: {
    TASHKENT_LATITUDE: 41.341948,
    TASHKENT_LONGITUDE: 69.33725,
  },

  Product: {
    MIN_TITLE_LENGTH: 2,
    MAX_TITLE_LENGTH: 100,
    MIN_MOLJAL_LENGTH: 0,
    MAX_MOLJAL_LENGTH: 70,
    MIN_DESCRIPTION_LENGTH: 1,
    MAX_DESCRIPTION_LENGTH: 1000,
    MIN_PRICE_UZS: 0.01,
    MAX_PRICE_UZS: 999999999.99,
    MIN_PRICE_USD: 0.01,
    MAX_PRICE_USD: 999999999.99,
    ALLOWED_STATUSES: ['active', 'reserved', 'sold'] as const,
  },
  ProductStatus:{
    active: 'active',
    reserved: 'reserved',
    sold: 'sold',
    hidden: 'hidden',
  } as const,
  Pagination: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 200,
  },

  Chat: {
    MAX_MESSAGE_LENGTH: 500,
    MIN_MESSAGE_LENGTH: 1,
    MAX_CHAT_ROOMS_PER_USER: 100,
    MAX_MESSAGES_PER_PAGE: 50,
    // Max number of rooms whose message arrays are kept in the in-memory chat
    // store (Zustand). Inactive rooms beyond this are evicted LRU; re-opening a
    // room reloads its history from REST + realtime, so nothing is lost.
    MAX_CACHED_MESSAGE_ROOMS: 20,
    MAXIMUM_RECEIVE_MESSAGE_SIZE: 1024 * 1024, // 1MB
    MESSAGE_TYPES: {
      TEXT: 'text',
      IMAGE: 'image',
      FILE: 'file',
    } as const,
  },
  ProductStatusColors: {
    active: 'blue',
    reserved: 'green',
    sold: 'black',
  } as const,
  Home: {
    SHEET_HEIGHT: 340,
  } as const,

  Otp: {
    CODE_LENGTH: 4,
    RESEND_COOLDOWN_SECONDS: 120,
  } as const,
} as const

