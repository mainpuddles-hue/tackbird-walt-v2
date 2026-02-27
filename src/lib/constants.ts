import type { PostType } from './types'

// Post categories with Finnish labels, icons (Lucide names), and colors
export const CATEGORIES: Record<PostType, {
  label: string
  icon: string
  color: string
  bgLight: string
  bgDark: string
}> = {
  tarvitsen: {
    label: 'Tarvitsen',
    icon: 'HandHelping',
    color: '#FF6B35',
    bgLight: '#FFF8F3',
    bgDark: '#2D1B10',
  },
  tarjoan: {
    label: 'Tarjoan',
    icon: 'Gift',
    color: '#8B5CF6',
    bgLight: '#FBF8FF',
    bgDark: '#1A1025',
  },
  ilmaista: {
    label: 'Ilmaista',
    icon: 'Heart',
    color: '#3B82F6',
    bgLight: '#F8FBFF',
    bgDark: '#0F1A2D',
  },
  nappaa: {
    label: 'Nappaa!',
    icon: 'Zap',
    color: '#EF4444',
    bgLight: '#FFF6F6',
    bgDark: '#2D0F0F',
  },
  lainaa: {
    label: 'Lainaa',
    icon: 'BookOpen',
    color: '#F59E0B',
    bgLight: '#FFFCF0',
    bgDark: '#2D2510',
  },
  tapahtuma: {
    label: 'Tapahtuma',
    icon: 'CalendarDays',
    color: '#10B981',
    bgLight: '#F5FFF9',
    bgDark: '#0F2D1A',
  },
  tilannehuone: {
    label: 'Tilannehuone',
    icon: 'AlertTriangle',
    color: '#06B6D4',
    bgLight: '#F4FFFE',
    bgDark: '#0F2D2B',
  },
}

// Bulletin-board design tokens
export const BOARD = {
  boardBg: '#ede5d5',
  boardBgDark: '#1a1815',
  paperShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
  paperShadowDark: '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
} as const

// Badge configuration
export const BADGES = {
  verified: { label: 'Vahvistettu', icon: 'BadgeCheck', color: '#3B82F6' },
  pro: { label: 'Pro', icon: 'Crown', color: '#F59E0B' },
  trusted: { label: 'Luotettu', icon: 'Shield', color: '#10B981' },
  active: { label: 'Aktiivinen', icon: 'Flame', color: '#EF4444' },
} as const

// Helsinki neighborhoods
export const NEIGHBORHOODS = [
  'Kallio', 'Sörnäinen', 'Vallila', 'Hermanni', 'Alppiharju',
  'Pasila', 'Käpylä', 'Kumpula', 'Toukola', 'Arabia',
  'Kruununhaka', 'Katajanokka', 'Punavuori', 'Ullanlinna', 'Eira',
  'Töölö', 'Meilahti', 'Munkkiniemi', 'Lauttasaari', 'Ruoholahti',
  'Jätkäsaari', 'Kamppi', 'Hakaniemi', 'Merihaka', 'Kulosaari',
  'Herttoniemi', 'Laajasalo', 'Vuosaari', 'Mellunmäki', 'Kontula',
  'Malmi', 'Tapanila', 'Pukinmäki', 'Oulunkylä', 'Maunula',
  'Pitäjänmäki', 'Haaga', 'Viikki', 'Suutarila', 'Tapulikaupunki',
] as const
