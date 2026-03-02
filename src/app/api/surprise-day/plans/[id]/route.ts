import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// ─── Rate limiter: 20 mutations per hour ─────────────────────────────
const surprisePlanMutateLimiter = createRateLimiter({ max: 20, windowMs: 60 * 60 * 1000 })

// ─── Valid statuses for plan updates ─────────────────────────────────
const VALID_STATUSES = ['active', 'completed', 'cancelled'] as const
type PlanStatus = (typeof VALID_STATUSES)[number]

function isValidStatus(s: unknown): s is PlanStatus {
  return typeof s === 'string' && (VALID_STATUSES as readonly string[]).includes(s)
}

// ─── DELETE /api/surprise-day/plans/:id ──────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (surprisePlanMutateLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    // Authenticate user via session cookies
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const admin = createAdminClient()

    // Verify the plan exists and belongs to this user
    const { data: plan, error: fetchError } = await admin
      .from('surprise_plans')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !plan) {
      return NextResponse.json(
        { error: 'Suunnitelmaa ei löytynyt' },
        { status: 404 }
      )
    }

    if (plan.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete associated activities first
    const { error: activitiesDeleteError } = await admin
      .from('surprise_plan_activities')
      .delete()
      .eq('plan_id', id)

    if (activitiesDeleteError) {
      console.error('[surprise-day/plans/delete] Activities delete error:', activitiesDeleteError)
      return NextResponse.json(
        { error: 'Aktiviteettien poistaminen epäonnistui' },
        { status: 500 }
      )
    }

    // Delete the plan
    const { error: planDeleteError } = await admin
      .from('surprise_plans')
      .delete()
      .eq('id', id)

    if (planDeleteError) {
      console.error('[surprise-day/plans/delete] Plan delete error:', planDeleteError)
      return NextResponse.json(
        { error: 'Suunnitelman poistaminen epäonnistui' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[surprise-day/plans/delete] Internal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/surprise-day/plans/:id ─────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (surprisePlanMutateLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    // Authenticate user via session cookies
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: `Virheellinen tila — sallitut: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Verify the plan exists and belongs to this user
    const { data: plan, error: fetchError } = await admin
      .from('surprise_plans')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !plan) {
      return NextResponse.json(
        { error: 'Suunnitelmaa ei löytynyt' },
        { status: 404 }
      )
    }

    if (plan.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update plan status
    const { data: updated, error: updateError } = await admin
      .from('surprise_plans')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[surprise-day/plans/update] Update error:', updateError)
      return NextResponse.json(
        { error: 'Suunnitelman päivittäminen epäonnistui' },
        { status: 500 }
      )
    }

    // Also fetch the activities to return a complete plan
    const { data: activities } = await admin
      .from('surprise_plan_activities')
      .select('*')
      .eq('plan_id', id)
      .order('order_index', { ascending: true })

    return NextResponse.json({
      plan: {
        ...updated,
        activities: activities ?? [],
      },
    })
  } catch (err) {
    console.error('[surprise-day/plans/update] Internal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
