// ==================== ENUMS ====================

export enum ECategoryType {
  ELECTRONICS = 100, // Elektronika
  FURNITURE = 101, // Mebel
  KIDS = 103, // Bolalar uchun
  WOMENS_CLOTHING = 104, // Ayollar kiyimlari
  WOMENS_ACCESSORIES = 105, // Ayollar aksessuarlari
  MENS_CLOTHING = 106, // Erkaklar kiyimlari
  HOME_APPLIANCES = 107, // Maishiy texnika
  HOME_AND_KITCHEN = 108, // Uy va oshxona
  SPORTS = 109, // Sport va dam olish
  GAMES_AND_HOBBIES = 110, // O'yin va xobbi
  CARS = 111, // Avtomobillar
  CAR_PARTS = 112, // Avto qismlar
  REAL_ESTATE = 113, // Ko'chmas mulk va ijara
  BEAUTY = 114, // Go'zallik
  PLANTS = 115, // O'simliklar
  FOOD = 116, // Oziq-ovqat
  HEALTH = 117, // Sog'liq uchun
  PETS = 118, // Uy hayvonlari uchun
  TICKETS = 119, // Chipta va kuponlar
  BOOKS = 120, // Kitoblar
  KIDS_BOOKS = 121, // Bolalar kitoblari
  OTHER = 122, 
  WANTED = 123, // Qidirilmoqda
  BUY = 124, // Sotib olaman
  WORKS = 125, // Ish bor
}

export enum ECurrencyType {
  UZS = 1000,
  USD = 1010
}

export enum EProductType {
  THING = 1000,
  CAR = 1010,
  WORK = 1020,
}

// keyinroq: 1000 o'rgartirish kerak.
export enum EProductSortBy {
  DISTANCE = 0,
  PRICE_ASC = 1,
  PRICE_DESC = 2,
  NEWEST = 3,
}

export enum ECarFuelType {
  PETROL = 1000,
  GAS = 1010,
  HYBRID = 1020,
  ELECTRIC = 1030,
  PROPAN = 1040,
}

export enum ECarTransmissionType {
  AUTOMATIC = 1000,
  MANUAL = 1010,
}

export enum ECarCondition {
  NEW = 1000,
  USED = 1010,
  BROKEN = 1020,
}

export enum EWorkerType {
  EMPLOYEE = 1000,
  ASSISTANT = 1010,
  TEACHER = 1020,
}

export enum EWorkType {
  FULL_TIME = 1000, // To'liq vaqtli
  PART_TIME = 1010, // Yarım vaqtli
  CONTRACT = 1020, // Shartnoma asosida
  FREELANCER = 1030, // Frilans
}

export enum EWorkCondition {
  TEMPORARY = 1000,
  ONE_MONTH = 1010,
  LONG_TERM = 1020,
}

export enum EWorkSalaryType {
  HOURLY = 1000,
  DAILY = 1010,
  // PER_TASK = 1020,
  MONTHLY = 1030,
}

export enum EPaymentType {
  CASH = 1000,
  BANK_TRANSFER = 1010,
  MOBILE_PAYMENT = 1020,
}

export enum EPaymentTimeType {
  IMMEDIATELY = 1000,
  WEEKLY = 1010,
  MONTHLY = 1020,
  AFTER_COMPLETION = 1030,
}


export enum EComplaintType {
  SPAM = 1000,
  INAPPROPRIATE = 1010,
  FRAUD = 1020,
  OTHER = 1030,
}

export enum EMessageType {
  TEXT = 1000,
  IMAGE = 1010,
  FILE = 1020,
  SYSTEM = 1030
}