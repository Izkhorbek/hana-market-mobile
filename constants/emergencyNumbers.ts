import type { EmergencySectionDto } from '@/types'

// Pre-backend SEED for the emergency-numbers screen (public sources). Once the
// backend serves GET /api/emergency-numbers, that response replaces this; the
// admin dashboard adds/removes sections and numbers. Kept only as a fallback so
// the screen isn't empty before the endpoint exists. Titles are Uzbek.

export const EMERGENCY_SECTIONS: EmergencySectionDto[] = [
  {
    title: 'Shoshilinch xizmatlar',
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
    title: 'Davlat portali va Hokimiyat',
    emoji: '🏛️',
    items: [
      { number: '1000', name: 'Prezident Virtual qabulxonasi (yoki 1110)' },
      { number: '1055', name: 'Kommunal masalalar va hokimiyat markazi' },
      { number: '1130', name: 'Yagona davlat xizmatlari portali (My.gov.uz)' },
    ],
  },
  {
    title: 'Gaz va Elektr energiyasi',
    emoji: '💡',
    items: [
      { number: '1154', name: 'Hududiy elektr tarmoqlari (uzilishlar)' },
      { number: '1104', name: "Hududgazta'minot (gaz ta'minoti)" },
    ],
  },
  {
    title: 'Korrupsiyaga qarshi va Huquq',
    emoji: '🛡️',
    items: [
      { number: '1082', name: 'Korrupsiyaga qarshi kurashish agentligi' },
      { number: '1008', name: 'Bosh prokuratura (ishonch telefoni)' },
      { number: '1102', name: 'Ichki ishlar vazirligi (ishonch telefoni)' },
      { number: '1007', name: 'Adliya vazirligi' },
    ],
  },
  {
    title: 'Boshqa foydali raqamlar',
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
