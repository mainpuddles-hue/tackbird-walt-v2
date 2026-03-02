import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// ─── Rate limiter: 30 reads per minute ───────────────────────────────
const surprisePlansLimiter = createRateLimiter({ max: 30, windowMs: 60 * 1000 })

// ─── GET /api/surprise-day/plans ─────────────────────────────────────

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  if (surprisePlansLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    // Authenticate user via session cookies
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Fetch all plans for this user, ordered by date descending
    const { data: plans, error: plansError } = await admin
      .from('surprise_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('plan_date', { ascending: false })

    if (plansError) {
      console.error('[surprise-day/plans] Plans fetch error:', plansError)
      return NextResponse.json(
        { error: 'Suunnitelmien hakeminen epäonnistui' },
        { status: 500 }
      )
    }

    if (!plans || plans.length === 0) {
      return NextResponse.json({ plans: [] })
    }

    // Fetch activities for all plans in a single query
    const planIds = plans.map((p) => p.id)
    const { data: allActivities, error: activitiesError } = await admin
      .from('surprise_plan_activities')
      .select('*')
      .in('plan_id', planIds)
      .order('order_index', { ascending: true })

    if (activitiesError) {
      console.error('[surprise-day/plans] Activities fetch error:', activitiesError)
      return NextResponse.json(
        { error: 'Aktiviteettien hakeminen epäonnistui' },
        { status: 500 }
      )
    }

    // Group activities by plan_id
    const activitiesByPlan = new Map<string, typeof allActivities>()
    for (const activity of allActivities ?? []) {
      const existing = activitiesByPlan.get(activity.plan_id) ?? []
      existing.push(activity)
      activitiesByPlan.set(activity.plan_id, existing)
    }

    // Combine plans with their activities
    const plansWithActivities = plans.map((plan) => ({
      ...plan,
      activities: activitiesByPlan.get(plan.id) ?? [],
    }))

    return NextResponse.json({ plans: plansWithActivities })
  } catch (err) {
    console.error('[surprise-day/plans] Internal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
