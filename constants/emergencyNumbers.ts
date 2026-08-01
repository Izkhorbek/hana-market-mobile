// Uzbekistan public short numbers — SEED data from public sources (MVP fallback).
// The admin dashboard will later provide the authoritative, localized list; until
// then hyperlocal screens read from here. Service names stay in Uzbek (national
// services); the screen chrome (title/categories) is translated via i18n.

export interface EmergencyNumber {
  /** Dialable short number. */
  number: string
  /** Service name (Uzbek). */
  name: string
}

export interface EmergencySection {
  /** Stable key → i18n label `mahalla.em_cat_{key}`. */
  key: string
  emoji: string
  items: EmergencyNumber[]
}

export const EMERGENCY_SECTIONS: EmergencySection[] = [
  {
    key: 'emergency',
    emoji: '🚨',
    items: [
      { number: '101', name: "Yong'in xavfsizligi xizmati" },
      { number: '102', name: 'Ichki ishlar (Militsiya)' },
      { number: '103', name: 'Tez tibbiy yordam' },
      { number: '104', name: 'Avariya gaz xizmati' },
      { number: '1050', name: 'Favqulodda vaziyatlar vazirligi (qutqaruv)' },
    ],
  },
  {
    key: 'government',
    emoji: '🏛️',
    items: [
      { number: '1000', name: 'Prezident Virtual qabulxonasi (yoki 1110)' },
      { number: '1055', name: 'Kommunal masalalar va hokimiyat markazi' },
      { number: '1130', name: 'Yagona davlat xizmatlari portali (My.gov.uz)' },
    ],
  },
  {
    key: 'utilities',
    emoji: '💡',
    items: [
      { number: '1154', name: 'Hududiy elektr tarmoqlari (uzilishlar)' },
      { number: '1104', name: "Hududgazta'minot (gaz ta'minoti)" },
    ],
  },
  {
    key: 'anticorruption',
    emoji: '🛡️',
    items: [
      { number: '1082', name: 'Korrupsiyaga qarshi kurashish agentligi' },
      { number: '1008', name: 'Bosh prokuratura (ishonch telefoni)' },
      { number: '1102', name: 'Ichki ishlar vazirligi (ishonch telefoni)' },
      { number: '1007', name: 'Adliya vazirligi' },
    ],
  },
  {
    key: 'other',
    emoji: '⚖️',
    items: [
      { number: '1100', name: "Davlat soliq qo'mitasi" },
      { number: '1111', name: 'Majburiy ijro byurosi (MIB)' },
      { number: '1091', name: "Iste'molchilar huquqlarini himoya qilish" },
      { number: '1148', name: 'Ombudsman (inson huquqlari vakili)' },
      { number: '1140', name: 'Mudofaa vazirligi (ishonch telefoni)' },
      { number: '1107', name: "Bojxona qo'mitasi" },
    ],
  },
]
