export const ENDPOINT = {
  // Health
  HEALTH: 'health',

  // Auth
  // NOTE: Backend now uses OTP-only flow. Registration happens implicitly
  // inside verify-otp the first time a phone is verified. The legacy
  // register/login endpoints have been removed server-side.
  AUTH: {
    REQUEST_OTP: 'auth/request-otp',
    VERIFY_OTP: 'auth/verify-otp',
    REFRESH: 'auth/refresh',
    LOGOUT: 'auth/logout',
  },

  USER: {
    MY: 'user/my',
    UPDATE_PROFILE: 'user/update',
    DELETE: 'user/delete',
    UPLOAD_PROFILE_IMAGE: 'user/upload/profile-image',
    UPDATE_LOCATION: 'user/update/location',
    SELLER_INFO: (sellerId: string | number) => `user/seller/${sellerId}`,
  },

  // Chat
  CHAT: {
    MY_CHATS: 'chats/my-chats',
    CREATE_OR_GET: 'chats/create-or-get',
    MESSAGES: (chatRoomId: string | number) => `chats/${chatRoomId}/messages`,
    UNREAD_COUNT: 'chats/unread-count',
    MARK_AS_READ: 'chats/mark-as-read',
    USER_STATUS: (userId: string | number) => `chats/user-status/${userId}`,
    HEALTH: 'chats/health',
    DELETE_CHAT_ROOM: (chatRoomId: string | number) =>
      `chats/room/${chatRoomId}`,
    DELETE_ROOM_MESSAGES: (
      chatRoomId: string | number,
      messageId: string | number,
    ) => `chats/room/${chatRoomId}/message/${messageId}`,
  },

  // Product
  PRODUCT: {
    CREATE: 'product/create',
    ALL: 'product/all',
    BY_ID: (id: string | number) => `product/${id}`,
    BY_ID_TO_EDIT: (id: string | number) => `product/${id}/edit`, // New endpoint for fetching product details for editing
    UPDATE: (id: string | number) => `product/${id}`,
    DELETE: (id: string | number) => `product/${id}`,
    IMAGES: (id: string | number) => `product/${id}/images`,
    LIKE: (id: string | number) => `product/${id}/likes`,
    LIKES: 'product/likes',
    MY: 'product/my',
    UPLOAD_DRAFT: 'product/images/upload-draft',
    DELETE_IMAGES_BATCH: (id: string | number) => `product/${id}/images/batch`,
    DELETE_DRAFT: (draftUuid: string | number) =>
      `product/images/delete-draft/${draftUuid}`,
    SELLER_PRODUCTS: (sellerId: string | number) =>
      `product/seller/${sellerId}/products`,
    RELATED: (id: string | number) => `product/${id}/related`,
  },

  // Categories
  CATEGORY: {
    ALL: 'product/categories',
    TREE: 'product/categories/tree',
    BY_ID: (categoryId: string | number) => `product/categories/${categoryId}`,
    PRODUCTS: (categoryId: string | number) =>
      `product/categories/${categoryId}/products`,
    SUBCATEGORIES: (parentId: string | number) =>
      `product/categories/${parentId}/subcategories`,
  },

  // Complaints
  COMPLAINT: {
    CREATE: 'complaint/create',
    MY: 'complaint/my',
    BY_ID: (id: string | number) => `complaint/${id}`,
  },

  // Contact
  CONTACT: {
    SEND: 'contact/send',
    FEEDBACK: 'contact/feedback',
    MESSAGES: 'contact/messages',
    GET_FEEDBACK: 'contact/feedbacks',
  },
  CONTENT: {
    ABOUT_US: 'content/about-us',
    TERMS: 'content/terms',
    PRIVACY: 'content/privacy',
    NEWS: 'content/news',
    NEWS_BY_ID: (id: string | number) => `content/news/${id}`,
  },
  LOG:{
    LOG: 'telemetry/log',
  }
}

export default ENDPOINT
