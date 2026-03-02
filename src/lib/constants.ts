import type { PostType } from './types'

// Post categories with Finnish labels, icons (Lucide names), and Forest Teal colors
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
    color: '#3D6B5E',
    bgLight: '#E8F0ED',
    bgDark: '#1A2E28',
  },
  tarjoan: {
    label: 'Tarjoan',
    icon: 'Gift',
    color: '#4CAF6A',
    bgLight: '#E8F5EC',
    bgDark: '#1A2E1F',
  },
  ilmaista: {
    label: 'Ilmaista',
    icon: 'Heart',
    color: '#D4956B',
    bgLight: '#FDF3EB',
    bgDark: '#2D2015',
  },
  lainaa: {
    label: 'Lainaa',
    icon: 'BookOpen',
    color: '#C4943A',
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
}

// Badge configuration
export const BADGES = {
  verified: { label: 'Vahvistettu', icon: 'BadgeCheck', color: '#3D6B5E' },
  pro: { label: 'Pro', icon: 'Crown', color: '#C4943A' },
  trusted: { label: 'Luotettu', icon: 'Shield', color: '#4CAF6A' },
  active: { label: 'Aktiivinen', icon: 'Flame', color: '#D4956B' },
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
