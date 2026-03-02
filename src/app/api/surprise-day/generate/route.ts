import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// ─── Rate limiter: 10 generations per hour ───────────────────────────
const surpriseGenerateLimiter = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 })

// ─── Types ───────────────────────────────────────────────────────────

type TimeSlot = 'BREAKFAST' | 'ACTIVITY' | 'LUNCH' | 'CULTURE' | 'EVENING'

interface Activity {
  title: string
  location_name: string
  time_slot: TimeSlot
  emoji: string
  description: string
  lat: number
  lng: number
}

// ─── Helsinki Activity Pool ──────────────────────────────────────────

const ACTIVITY_POOL: Record<TimeSlot, Activity[]> = {
  BREAKFAST: [
    {
      title: 'Aamupala The Way Bakeryssa',
      location_name: 'Eerikinkatu',
      time_slot: 'BREAKFAST',
      emoji: '🥐',
      description: 'Tuoretta leipää ja kahvia viihtyisässä leipomossa Eerikinkadulla.',
      lat: 60.1659,
      lng: 24.9370,
    },
    {
      title: 'Aamiainen Cafe Regattassa',
      location_name: 'Merikannontie',
      time_slot: 'BREAKFAST',
      emoji: '☕',
      description: 'Klassinen punainen kahvila meren rannalla — mustikkapiirakka ja kahvi.',
      lat: 60.1810,
      lng: 24.9110,
    },
    {
      title: 'Brunssi Ekbergillä',
      location_name: 'Bulevardi',
      time_slot: 'BREAKFAST',
      emoji: '🍳',
      description: 'Helsingin vanhin kahvila tarjoaa upean brunssin Bulevardin varrella.',
      lat: 60.1637,
      lng: 24.9363,
    },
    {
      title: 'Aamukahvi Johan & Nyströmissä',
      location_name: 'Kanavaranta',
      time_slot: 'BREAKFAST',
      emoji: '☕',
      description: 'Specialty-kahvia ja tuoretta pullaa merenrantanäkymillä.',
      lat: 60.1677,
      lng: 24.9569,
    },
    {
      title: 'Tuore smoothie Pupu Juicessa',
      location_name: 'Albertinkatu',
      time_slot: 'BREAKFAST',
      emoji: '🥤',
      description: 'Raikasta smoothieta ja terveellistä aamupalaa Albertinkadulla.',
      lat: 60.1630,
      lng: 24.9340,
    },
  ],
  ACTIVITY: [
    {
      title: 'Petankkia Tokoinrannassa',
      location_name: 'Tokoinranta',
      time_slot: 'ACTIVITY',
      emoji: '🎯',
      description: 'Rento petankki-peli kauniissa puistossa Sörnäisten rannan tuntumassa.',
      lat: 60.1831,
      lng: 24.9515,
    },
    {
      title: 'SUP-lautailua Hernesaaressa',
      location_name: 'Hernesaari',
      time_slot: 'ACTIVITY',
      emoji: '🏄',
      description: 'Stand up paddle -lautailu Helsingin edustalla — sopii aloittelijoillekin.',
      lat: 60.1530,
      lng: 24.9240,
    },
    {
      title: 'Kiipeily BoulderHallissa',
      location_name: 'Siltasaarenkatu',
      time_slot: 'ACTIVITY',
      emoji: '🧗',
      description: 'Sisäkiipeilyä monipuolisilla reiteillä keskustan tuntumassa.',
      lat: 60.1795,
      lng: 24.9480,
    },
    {
      title: 'Pyöräretki Baanan varrella',
      location_name: 'Baana',
      time_slot: 'ACTIVITY',
      emoji: '🚲',
      description: 'Pyöräilyä entisellä ratapihalla — Helsingin urbaanein pyöräreitti.',
      lat: 60.1680,
      lng: 24.9310,
    },
    {
      title: 'Frisbeegolf Talissa',
      location_name: 'Tali',
      time_slot: 'ACTIVITY',
      emoji: '🥏',
      description: 'Monipuolinen frisbeegolf-rata Talin ulkoilualueella.',
      lat: 60.2066,
      lng: 24.8770,
    },
    {
      title: 'Kajakointia Seurasaarella',
      location_name: 'Seurasaari',
      time_slot: 'ACTIVITY',
      emoji: '🛶',
      description: 'Meloretki Seurasaaren upeissa maisemissa.',
      lat: 60.1850,
      lng: 24.8850,
    },
  ],
  LUNCH: [
    {
      title: 'Lounas Meripaviljongissa',
      location_name: 'Eiranranta',
      time_slot: 'LUNCH',
      emoji: '🍽️',
      description: 'Merenrantaravintola upeilla näkymillä Eiranrannassa.',
      lat: 60.1580,
      lng: 24.9460,
    },
    {
      title: 'Lounas ravintola Storyssa',
      location_name: 'Vanha kauppahalli',
      time_slot: 'LUNCH',
      emoji: '🥘',
      description: 'Laadukas lounas historiallisessa Vanhassa kauppahallissa.',
      lat: 60.1672,
      lng: 24.9545,
    },
    {
      title: 'Sushi Yes Yes Yesissä',
      location_name: 'Yes Yes Yes',
      time_slot: 'LUNCH',
      emoji: '🍣',
      description: 'Tuoretta ja luovaa sushia rennossa ilmapiirissä.',
      lat: 60.1617,
      lng: 24.9410,
    },
    {
      title: 'Lounas Ravintola Kappelissa',
      location_name: 'Esplanadi',
      time_slot: 'LUNCH',
      emoji: '🏛️',
      description: 'Klassinen ravintola Esplanadin puistossa — suomalaista ruokaa parhaimmillaan.',
      lat: 60.1675,
      lng: 24.9488,
    },
    {
      title: 'Street food Torikorttelissa',
      location_name: 'Torikortteli',
      time_slot: 'LUNCH',
      emoji: '🌮',
      description: 'Monipuolista katukeittiöruokaa Kauppatorin vieressä.',
      lat: 60.1677,
      lng: 24.9565,
    },
  ],
  CULTURE: [
    {
      title: 'Taidenäyttely Amos Rexissä',
      location_name: 'Amos Rex',
      time_slot: 'CULTURE',
      emoji: '🎨',
      description: 'Kansainvälisiä nykytaidenäyttelyitä ikonisessa tilassa Lasipalatsin alla.',
      lat: 60.1700,
      lng: 24.9370,
    },
    {
      title: 'Nykytaidetta Kiasmassa',
      location_name: 'Kiasma',
      time_slot: 'CULTURE',
      emoji: '🖼️',
      description: 'Suomen johtava nykytaiteen museo — aina jotain uutta ja ajatuksia herättävää.',
      lat: 60.1719,
      lng: 24.9369,
    },
    {
      title: 'Designmuseo',
      location_name: 'Designmuseo',
      time_slot: 'CULTURE',
      emoji: '✏️',
      description: 'Suomalaisen muotoilun historiaa ja nykypäivää kauniissa museossa.',
      lat: 60.1630,
      lng: 24.9460,
    },
    {
      title: 'Luonnontieteellinen museo',
      location_name: 'Luonnontieteellinen museo',
      time_slot: 'CULTURE',
      emoji: '🦴',
      description: 'Fascinoivia luonnon ihmeitä ja dinosauruksia keskustassa.',
      lat: 60.1735,
      lng: 24.9310,
    },
    {
      title: 'Kaapelitehdas-kierros',
      location_name: 'Kaapelitehdas',
      time_slot: 'CULTURE',
      emoji: '🏭',
      description: 'Kulttuurikeskus vanhassa kaapelitehtaassa — gallerioita, museoita ja tapahtumia.',
      lat: 60.1620,
      lng: 24.9080,
    },
  ],
  EVENING: [
    {
      title: 'Elokuva Rivierassa',
      location_name: 'Riviera',
      time_slot: 'EVENING',
      emoji: '🎬',
      description: 'Elokuvaelämys tunnelmallisessa art deco -teatterissa.',
      lat: 60.1702,
      lng: 24.9365,
    },
    {
      title: 'Keilaus Tennispalatsissa',
      location_name: 'Tennispalatsi',
      time_slot: 'EVENING',
      emoji: '🎳',
      description: 'Hauska keilailuilta neonvaloissa Kampin keskustassa.',
      lat: 60.1690,
      lng: 24.9330,
    },
    {
      title: 'Sauna Löyly',
      location_name: 'Löyly',
      time_slot: 'EVENING',
      emoji: '🧖',
      description: 'Moderni rantasauna Hernesaaressa — löylyjä ja mereen kastautumista.',
      lat: 60.1530,
      lng: 24.9220,
    },
    {
      title: 'Illallinen Sea Horsessa',
      location_name: 'Sea Horse',
      time_slot: 'EVENING',
      emoji: '🐴',
      description: 'Legendaarinen helsinkiläisravintola — perinteistä suomalaista kotiruokaa.',
      lat: 60.1615,
      lng: 24.9445,
    },
    {
      title: 'Live-musiikkia Tavastia-klubilla',
      location_name: 'Tavastia',
      time_slot: 'EVENING',
      emoji: '🎸',
      description: 'Suomen kuuluisin rock-klubi — livekeikkoja jo vuodesta 1970.',
      lat: 60.1697,
      lng: 24.9318,
    },
    {
      title: 'Cocktailit Liberty or Deathissa',
      location_name: 'Liberty or Death',
      time_slot: 'EVENING',
      emoji: '🍸',
      description: 'Intiimi cocktailbaari Helsingin sydämessä — käsityöcocktaileja huippubaarimestareilta.',
      lat: 60.1660,
      lng: 24.9400,
    },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────

const TIME_SLOTS: TimeSlot[] = ['BREAKFAST', 'ACTIVITY', 'LUNCH', 'CULTURE', 'EVENING']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

// ─── POST /api/surprise-day/generate ─────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (surpriseGenerateLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    // Authenticate user via session cookies
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date } = body

    // Validate date is provided
    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'Päivämäärä vaaditaan (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Virheellinen päivämäärämuoto — käytä YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate date is a weekend
    if (!isWeekend(date)) {
      return NextResponse.json(
        { error: 'Yllätyspäivä voidaan luoda vain viikonlopuille (la/su)' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // If an active plan already exists for this date, delete it first
    const { data: existingPlan } = await admin
      .from('surprise_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('plan_date', date)
      .maybeSingle()

    if (existingPlan) {
      // Delete associated activities first (cascade may handle this, but be explicit)
      await admin
        .from('surprise_plan_activities')
        .delete()
        .eq('plan_id', existingPlan.id)

      await admin
        .from('surprise_plans')
        .delete()
        .eq('id', existingPlan.id)
    }

    // Create the surprise plan
    const { data: plan, error: planError } = await admin
      .from('surprise_plans')
      .insert({
        user_id: user.id,
        plan_date: date,
        status: 'active',
      })
      .select()
      .single()

    if (planError || !plan) {
      console.error('[surprise-day/generate] Plan creation error:', planError)
      return NextResponse.json(
        { error: 'Suunnitelman luominen epäonnistui' },
        { status: 500 }
      )
    }

    // Pick 1 random activity per time slot (5 total)
    const selectedActivities = TIME_SLOTS.map((slot, index) => {
      const activity = pickRandom(ACTIVITY_POOL[slot])
      return {
        plan_id: plan.id,
        title: activity.title,
        location_name: activity.location_name,
        time_slot: activity.time_slot,
        emoji: activity.emoji,
        description: activity.description,
        lat: activity.lat,
        lng: activity.lng,
        order_index: index,
      }
    })

    // Insert all 5 activities
    const { data: activities, error: activitiesError } = await admin
      .from('surprise_plan_activities')
      .insert(selectedActivities)
      .select()

    if (activitiesError) {
      console.error('[surprise-day/generate] Activities insertion error:', activitiesError)
      // Clean up the plan if activities failed
      await admin.from('surprise_plans').delete().eq('id', plan.id)
      return NextResponse.json(
        { error: 'Aktiviteettien luominen epäonnistui' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      plan: {
        ...plan,
        activities: activities ?? [],
      },
    })
  } catch (err) {
    console.error('[surprise-day/generate] Internal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
