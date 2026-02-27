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
    color: '#C75B3A',
    bgLight: '#FDF0EB',
    bgDark: '#2A1A15',
  },
  tarjoan: {
    label: 'Tarjoan',
    icon: 'Gift',
    color: '#7C5CBF',
    bgLight: '#F4EFFF',
    bgDark: '#1A1525',
  },
  ilmaista: {
    label: 'Ilmaista',
    icon: 'Heart',
    color: '#3B7DD8',
    bgLight: '#EBF2FE',
    bgDark: '#101A2D',
  },
  nappaa: {
    label: 'Nappaa!',
    icon: 'Zap',
    color: '#C43C3C',
    bgLight: '#FDECEC',
    bgDark: '#2D1010',
  },
  lainaa: {
    label: 'Lainaa',
    icon: 'BookOpen',
    color: '#C98B2E',
    bgLight: '#FDF6E8',
    bgDark: '#2D2010',
  },
  tapahtuma: {
    label: 'Tapahtuma',
    icon: 'CalendarDays',
    color: '#2B8A62',
    bgLight: '#E8F7EF',
    bgDark: '#102D1A',
  },
  tilannehuone: {
    label: 'Tilannehuone',
    icon: 'AlertTriangle',
    color: '#1E8CA0',
    bgLight: '#E6F6FA',
    bgDark: '#102D2B',
  },
}

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
