'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import {
  Dice5,
  Check,
  RefreshCw,
  MapPin,
  Clock,
  Trash2,
  Navigation,
  Car,
  Bus,
  Map,
  X,
  ChevronLeft,
  Calendar,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

// ---------------------------------------------------------------------------
// Dynamic leaflet imports (SSR-incompatible)
// ---------------------------------------------------------------------------
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
)
const MarkerDynamic = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((m) => m.Polyline),
  { ssr: false }
)
const PopupDynamic = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActivityCategory = 'breakfast' | 'activity' | 'lunch' | 'culture' | 'evening'

interface Activity {
  id: string
  emoji: string
  title: string
  description: string
  time: string
  location: string
  lat: number
  lng: number
  category: ActivityCategory
}

interface SurprisePlan {
  id: string
  date: string
  activities: Activity[]
  createdAt: string
}

interface SurpriseDayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlanSaved?: () => void
}

// ---------------------------------------------------------------------------
// Category color map
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  breakfast: '#F59E0B',
  activity: '#3B82F6',
  lunch: '#EF4444',
  culture: '#8B5CF6',
  evening: '#EC4899',
}

const CATEGORY_LABELS: Record<ActivityCategory, { fi: string; en: string; sv: string }> = {
  breakfast: { fi: 'Aamiainen', en: 'Breakfast', sv: 'Frukost' },
  activity: { fi: 'Aktiviteetti', en: 'Activity', sv: 'Aktivitet' },
  lunch: { fi: 'Lounas', en: 'Lunch', sv: 'Lunch' },
  culture: { fi: 'Kulttuuri', en: 'Culture', sv: 'Kultur' },
  evening: { fi: 'Ilta', en: 'Evening', sv: 'Kväll' },
}

// ---------------------------------------------------------------------------
// Sample data generator (Helsinki-based activities)
// ---------------------------------------------------------------------------
const SAMPLE_ACTIVITIES: Record<ActivityCategory, Array<Omit<Activity, 'id' | 'category'>>> = {
  breakfast: [
    { emoji: '🥐', title: 'Aamiaisbrunssi Cafe Regulierissa', description: 'Ranskalaistyyliset croissantit ja erikoiskahvi tunnelmallisessa kahvilassa.', time: '09:00', location: 'Fredrikinkatu 11, Helsinki', lat: 60.1652, lng: 24.9395 },
    { emoji: '☕', title: 'Kahvihetki Johan & Nyströmillä', description: 'Käsinpaahdettu kahvi ja tuore pulla viihtyisässä ympäristössä.', time: '09:30', location: 'Kanavaranta 7C, Helsinki', lat: 60.1676, lng: 24.9570 },
    { emoji: '🍳', title: 'Brunssi Ravintola Seasidessa', description: 'Merellinen brunssi panoraamanäköalalla Kauppatorille.', time: '10:00', location: 'Eteläinen Makasiinikatu 6, Helsinki', lat: 60.1670, lng: 24.9530 },
  ],
  activity: [
    { emoji: '🧗', title: 'Kiipeily BoulderTehdas', description: 'Boulderointia ja seikkailua sisäkiipeilyareenalla.', time: '11:00', location: 'Sörnäistenkatu 1, Helsinki', lat: 60.1860, lng: 24.9620 },
    { emoji: '🎳', title: 'Keilaus Holiday Bowlingissa', description: 'Retrotunnelmaista keilaamista neonvaloissa.', time: '11:30', location: 'Hämeentie 2, Helsinki', lat: 60.1820, lng: 24.9530 },
    { emoji: '🚣', title: 'Kajakkiretki Seurasaareen', description: 'Ohjattu kajakkimelonta Helsingin saaristossa.', time: '11:00', location: 'Rajasaarentie 1, Helsinki', lat: 60.1830, lng: 24.8850 },
  ],
  lunch: [
    { emoji: '🍜', title: 'Ramen Kampin Kookissa', description: 'Aitoa japanilaista ramenia täyteläisellä liemellä.', time: '13:00', location: 'Fredrikinkatu 22, Helsinki', lat: 60.1680, lng: 24.9330 },
    { emoji: '🍕', title: 'Pizza Piece Soderhelmissä', description: 'New York -tyylinen newyorkkalaispizza Kalliossa.', time: '13:30', location: 'Vaasankatu 8, Helsinki', lat: 60.1880, lng: 24.9510 },
    { emoji: '🥗', title: 'Lounas Ravintola Grönissä', description: 'Kasvispainotteinen sesonkilounas Punavuoressa.', time: '13:00', location: 'Albertinkatu 36, Helsinki', lat: 60.1610, lng: 24.9370 },
  ],
  culture: [
    { emoji: '🎨', title: 'Amos Rex -museo', description: 'Modernin taiteen näyttely kiehtovassa tilassa Lasipalatsin alla.', time: '15:00', location: 'Mannerheimintie 22-24, Helsinki', lat: 60.1706, lng: 24.9360 },
    { emoji: '🏛️', title: 'Ateneum taidemuseo', description: 'Suomalaisen taiteen aarteita 1700-luvulta nykypäivään.', time: '15:30', location: 'Kaivokatu 2, Helsinki', lat: 60.1710, lng: 24.9445 },
    { emoji: '📚', title: 'Oodi-kirjasto', description: 'Arkkitehtuurielämys ja interaktiivinen näyttely keskustakirjastossa.', time: '15:00', location: 'Töölönlahdenkatu 4, Helsinki', lat: 60.1740, lng: 24.9380 },
  ],
  evening: [
    { emoji: '🍷', title: 'Illallinen Ravintola Oloissa', description: 'Fine dining -elämys skandinaavisilla makumaailmoilla.', time: '18:00', location: 'Pohjoisesplanadi 5, Helsinki', lat: 60.1693, lng: 24.9510 },
    { emoji: '🎭', title: 'Esitys Kansallisteatterissa', description: 'Dramaattinen teatterielämys historiallisessa päärakennuksessa.', time: '19:00', location: 'Läntinen Teatterikuja 1, Helsinki', lat: 60.1720, lng: 24.9440 },
    { emoji: '🌃', title: 'SkyWheel Helsinki', description: 'Helsingin valot maailmanpyörästä merellisellä Katajanokalla.', time: '20:00', location: 'Katajanokanlaituri 2, Helsinki', lat: 60.1675, lng: 24.9630 },
  ],
}

function generateRandomPlan(date: string): SurprisePlan {
  const categories: ActivityCategory[] = ['breakfast', 'activity', 'lunch', 'culture', 'evening']
  const activities: Activity[] = categories.map((cat) => {
    const pool = SAMPLE_ACTIVITIES[cat]
    const picked = pool[Math.floor(Math.random() * pool.length)]
    return {
      ...picked,
      id: `${cat}-${Math.random().toString(36).slice(2, 8)}`,
      category: cat,
    }
  })

  return {
    id: `plan-${Math.random().toString(36).slice(2, 10)}`,
    date,
    activities,
    createdAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'tackbird-surprise-plans'

function loadPlans(): SurprisePlan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SurprisePlan[]) : []
  } catch {
    return []
  }
}

function savePlans(plans: SurprisePlan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function formatDateFi(dateStr: string): string {
  const d = new Date(dateStr)
  const weekdays = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la']
  const months = [
    'tammik.', 'helmik.', 'maalisk.', 'huhtik.', 'toukok.', 'kesäk.',
    'heinäk.', 'elok.', 'syysk.', 'lokak.', 'marrask.', 'jouluk.',
  ]
  return `${weekdays[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`
}

function buildHslLink(from: Activity, to: Activity): string {
  const fromStr = `${from.location}::${from.lat},${from.lng}`
  const toStr = `${to.location}::${to.lat},${to.lng}`
  return `https://reittiopas.hsl.fi/reitti/${encodeURIComponent(fromStr)}/${encodeURIComponent(toStr)}`
}

function buildUberLink(from: Activity, to: Activity): string {
  return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${from.lat}&pickup[longitude]=${from.lng}&dropoff[latitude]=${to.lat}&dropoff[longitude]=${to.lng}`
}

function buildBoltLink(_from: Activity, to: Activity): string {
  return `https://bolt.eu/deeplink/?lat_to=${to.lat}&lng_to=${to.lng}`
}

// ---------------------------------------------------------------------------
// Numbered marker icon builder
// ---------------------------------------------------------------------------
function createNumberedIcon(num: number, color: string): L.DivIcon | undefined {
  if (typeof window === 'undefined') return undefined
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;font-family:Inter,system-ui,sans-serif">${num}</div>`,
  })
}

// ---------------------------------------------------------------------------
// Step: Select
// ---------------------------------------------------------------------------
function SelectStep({
  selectedDate,
  onDateChange,
  onGenerate,
  existingPlans,
  onSelectPlan,
  onDeletePlan,
  generating,
  locale,
}: {
  selectedDate: string
  onDateChange: (date: string) => void
  onGenerate: () => void
  existingPlans: SurprisePlan[]
  onSelectPlan: (plan: SurprisePlan) => void
  onDeletePlan: (id: string) => void
  generating: boolean
  locale: string
}) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const today = new Date().toISOString().split('T')[0]

  const dateInvalid = selectedDate !== '' && !isWeekend(new Date(selectedDate + 'T12:00:00'))

  return (
    <div className="space-y-5">
      {/* Date picker */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Calendar className="size-4" />
          {locale === 'en' ? 'Pick a weekend date' : locale === 'sv' ? 'Välj ett helgdatum' : 'Valitse viikonloppupäivä'}
        </label>
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          min={today}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            dateInvalid && 'border-destructive ring-1 ring-destructive/30'
          )}
        />
        {dateInvalid && (
          <p className="text-xs text-destructive">
            {locale === 'en'
              ? 'Please select a Saturday or Sunday'
              : locale === 'sv'
                ? 'Välj en lördag eller söndag'
                : 'Valitse lauantai tai sunnuntai'}
          </p>
        )}
      </div>

      {/* Generate button */}
      <Button
        className="w-full gap-2"
        size="lg"
        disabled={!selectedDate || dateInvalid || generating}
        onClick={onGenerate}
      >
        {generating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Dice5 className="size-4" />
        )}
        {generating
          ? (locale === 'en' ? 'Generating...' : locale === 'sv' ? 'Genererar...' : 'Luodaan...')
          : (locale === 'en' ? 'Generate surprise day!' : locale === 'sv' ? 'Generera överraskningsdag!' : 'Luo yllätyspäivä!')}
      </Button>

      {/* Existing plans */}
      {existingPlans.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            {locale === 'en' ? 'Saved plans' : locale === 'sv' ? 'Sparade planer' : 'Tallennetut suunnitelmat'}
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {existingPlans.map((plan) => (
              <div
                key={plan.id}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/40 cursor-pointer"
                onClick={() => onSelectPlan(plan)}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{formatDateFi(plan.date)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {plan.activities.map((a) => a.emoji).join(' ')} &middot; {plan.activities.length}{' '}
                    {locale === 'en' ? 'activities' : locale === 'sv' ? 'aktiviteter' : 'aktiviteettia'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeletePlan(plan.id)
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Transportation links
// ---------------------------------------------------------------------------
function TransportLinks({ from, to }: { from: Activity; to: Activity }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <span className="text-xs text-muted-foreground mr-1">
        <Navigation className="size-3 inline -mt-0.5 mr-0.5" />
        Siirry:
      </span>
      <a
        href={buildHslLink(from, to)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
      >
        <Bus className="size-3" />
        HSL
      </a>
      <a
        href={buildUberLink(from, to)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:hover:bg-gray-700/50"
      >
        <Car className="size-3" />
        Uber
      </a>
      <a
        href={buildBoltLink(from, to)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-900/50"
      >
        <Car className="size-3" />
        Bolt
      </a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Map component (rendered client-only)
// ---------------------------------------------------------------------------
function SurpriseMap({ activities }: { activities: Activity[] }) {
  const [leafletReady, setLeafletReady] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    // Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
      document.head.appendChild(link)
    }
    setLeafletReady(true)
  }, [])

  useEffect(() => {
    if (mapRef.current && activities.length > 0) {
      const bounds = L.latLngBounds(activities.map((a) => [a.lat, a.lng] as [number, number]))
      mapRef.current.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [activities])

  if (!leafletReady) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-muted">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const center: [number, number] = activities.length > 0
    ? [
        activities.reduce((s, a) => s + a.lat, 0) / activities.length,
        activities.reduce((s, a) => s + a.lng, 0) / activities.length,
      ]
    : [60.1699, 24.9384]

  const routePoints: [number, number][] = activities.map((a) => [a.lat, a.lng])

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={13}
        className="h-64 w-full"
        zoomControl={false}
        ref={(map) => {
          if (map) {
            mapRef.current = map
            if (activities.length > 0) {
              const bounds = L.latLngBounds(activities.map((a) => [a.lat, a.lng] as [number, number]))
              map.fitBounds(bounds, { padding: [40, 40] })
            }
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Dashed route polyline */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: 'var(--primary, #3D6B5E)',
              weight: 3,
              dashArray: '8 6',
              opacity: 0.6,
            }}
          />
        )}
        {/* Numbered markers */}
        {activities.map((activity, idx) => {
          const icon = createNumberedIcon(idx + 1, CATEGORY_COLORS[activity.category])
          if (!icon) return null
          return (
            <MarkerDynamic key={activity.id} position={[activity.lat, activity.lng]} icon={icon}>
              <PopupDynamic>
                <div className="min-w-[160px] space-y-1 text-sm">
                  <p className="font-semibold">{activity.emoji} {activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time} &middot; {activity.location}</p>
                </div>
              </PopupDynamic>
            </MarkerDynamic>
          )
        })}
      </MapContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step: Result
// ---------------------------------------------------------------------------
function ResultStep({
  plan,
  onAccept,
  onRegenerate,
  onBack,
  saving,
  locale,
}: {
  plan: SurprisePlan
  onAccept: () => void
  onRegenerate: () => void
  onBack: () => void
  saving: boolean
  locale: string
}) {
  const [showMap, setShowMap] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header with date */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          {locale === 'en' ? 'Back' : locale === 'sv' ? 'Tillbaka' : 'Takaisin'}
        </button>
        <span className="text-sm font-medium text-muted-foreground">
          {formatDateFi(plan.date)}
        </span>
      </div>

      {/* Map toggle */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => setShowMap(!showMap)}
      >
        {showMap ? <X className="size-4" /> : <Map className="size-4" />}
        {showMap
          ? (locale === 'en' ? 'Hide map' : locale === 'sv' ? 'Dölj karta' : 'Piilota kartta')
          : (locale === 'en' ? 'Show map' : locale === 'sv' ? 'Visa karta' : 'Näytä kartta')}
      </Button>

      {/* Map */}
      {showMap && <SurpriseMap activities={plan.activities} />}

      {/* Timeline */}
      <div className="relative space-y-0">
        {plan.activities.map((activity, idx) => {
          const color = CATEGORY_COLORS[activity.category]
          const isLast = idx === plan.activities.length - 1

          return (
            <div key={activity.id}>
              {/* Activity card */}
              <div className="relative flex gap-3">
                {/* Timeline line + circle */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {idx + 1}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    {/* Category badge */}
                    <span
                      className="inline-block mb-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {CATEGORY_LABELS[activity.category][locale as 'fi' | 'en' | 'sv'] ?? CATEGORY_LABELS[activity.category].fi}
                    </span>

                    {/* Title row */}
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-lg leading-none">{activity.emoji}</span>
                      <h4 className="text-sm font-semibold text-foreground leading-snug">
                        {activity.title}
                      </h4>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {activity.description}
                    </p>

                    {/* Time & Location */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {activity.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {activity.location}
                      </span>
                    </div>
                  </div>

                  {/* Transportation links */}
                  {!isLast && (
                    <TransportLinks from={activity} to={plan.activities[idx + 1]} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={onRegenerate}
          disabled={saving}
        >
          <RefreshCw className="size-4" />
          {locale === 'en' ? 'Regenerate' : locale === 'sv' ? 'Regenerera' : 'Luo uusi'}
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={onAccept}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {saving
            ? (locale === 'en' ? 'Saving...' : locale === 'sv' ? 'Sparar...' : 'Tallennetaan...')
            : (locale === 'en' ? 'Accept plan' : locale === 'sv' ? 'Acceptera plan' : 'Hyväksy suunnitelma')}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------
export function SurpriseDayModal({ open, onOpenChange, onPlanSaved }: SurpriseDayModalProps) {
  const { locale } = useI18n()
  const [step, setStep] = useState<'select' | 'result'>('select')
  const [selectedDate, setSelectedDate] = useState('')
  const [currentPlan, setCurrentPlan] = useState<SurprisePlan | null>(null)
  const [existingPlans, setExistingPlans] = useState<SurprisePlan[]>([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load saved plans on mount
  useEffect(() => {
    if (open) {
      setExistingPlans(loadPlans())
    }
  }, [open])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('select')
      setCurrentPlan(null)
      setGenerating(false)
      setSaving(false)
    }
  }, [open])

  const handleGenerate = useCallback(() => {
    if (!selectedDate) return
    setGenerating(true)

    // Simulate generation delay for UX
    setTimeout(() => {
      const plan = generateRandomPlan(selectedDate)
      setCurrentPlan(plan)
      setStep('result')
      setGenerating(false)
    }, 800)
  }, [selectedDate])

  const handleRegenerate = useCallback(() => {
    if (!currentPlan) return
    setGenerating(true)

    setTimeout(() => {
      const plan = generateRandomPlan(currentPlan.date)
      setCurrentPlan(plan)
      setGenerating(false)
    }, 600)
  }, [currentPlan])

  const handleAccept = useCallback(() => {
    if (!currentPlan) return
    setSaving(true)

    setTimeout(() => {
      const plans = loadPlans()
      plans.unshift(currentPlan)
      savePlans(plans)
      setExistingPlans(plans)
      setSaving(false)
      setStep('select')
      setCurrentPlan(null)
      setSelectedDate('')
      onPlanSaved?.()
    }, 400)
  }, [currentPlan, onPlanSaved])

  const handleSelectPlan = useCallback((plan: SurprisePlan) => {
    setCurrentPlan(plan)
    setStep('result')
  }, [])

  const handleDeletePlan = useCallback((id: string) => {
    const plans = loadPlans().filter((p) => p.id !== id)
    savePlans(plans)
    setExistingPlans(plans)
  }, [])

  const handleBack = useCallback(() => {
    setStep('select')
    setCurrentPlan(null)
  }, [])

  const title = locale === 'en'
    ? 'Surprise Day'
    : locale === 'sv'
      ? 'Överraskningsdag'
      : 'Yllätyspaiva'

  const description = locale === 'en'
    ? 'Generate a surprise day plan with 5 curated activities around Helsinki.'
    : locale === 'sv'
      ? 'Generera en överraskningsdagsplan med 5 utvalda aktiviteter runt Helsingfors.'
      : 'Luo yllätyssuunnitelma viidellä kuratoidulla aktiviteetilla Helsingissä.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <SelectStep
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onGenerate={handleGenerate}
            existingPlans={existingPlans}
            onSelectPlan={handleSelectPlan}
            onDeletePlan={handleDeletePlan}
            generating={generating}
            locale={locale}
          />
        )}

        {step === 'result' && currentPlan && (
          <ResultStep
            plan={currentPlan}
            onAccept={handleAccept}
            onRegenerate={handleRegenerate}
            onBack={handleBack}
            saving={saving}
            locale={locale}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
