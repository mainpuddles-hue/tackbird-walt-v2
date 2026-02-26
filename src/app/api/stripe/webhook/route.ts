/**
 * Unified Stripe webhook handler.
 *
 * Handles events from:
 * - Pro subscription lifecycle (checkout, renewal, cancellation)
 * - Rental payment checkout
 * - Ad campaign payment checkout
 * - Connect account updates
 *
 * Security (CIS):
 * - Webhook signature verification (prevents replay/spoofing attacks)
 * - Idempotent status updates (safe to process same event twice)
 * - No user-facing errors leaked (only logs server-side)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET, DEV_MODE } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

/** Extract current_period_end safely across Stripe SDK versions */
function getSubscriptionExpiry(sub: unknown): string {
  const s = sub as Record<string, unknown>
  if (typeof s.current_period_end === 'number') {
    return new Date(s.current_period_end * 1000).toISOString()
  }
  // Fallback: 30 days from now
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

export async function POST(request: NextRequest) {
  if (DEV_MODE) {
    return NextResponse.json({ error: 'Webhooks disabled in dev mode' }, { status: 200 })
  }

  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let event: Stripe.Event

  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      // ─── Checkout completed (Pro, Rental, or Ad) ──────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}

        if (metadata.type === 'rental' && metadata.booking_id) {
          await handleRentalPayment(admin, session, metadata.booking_id)
        } else if (metadata.type === 'ad' && metadata.ad_id) {
          await handleAdPayment(admin, metadata.ad_id, session)
        } else if (metadata.tackbird_user_id) {
          await handleProCheckout(admin, session, metadata.tackbird_user_id)
        }
        break
      }

      // ─── Pro subscription renewal ─────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        // Stripe SDK v20+: subscription may be in parent or as a direct field
        const rawSubId =
          invoice.parent?.subscription_details?.subscription ??
          (invoice as unknown as { subscription?: string }).subscription
        const subId = typeof rawSubId === 'string' ? rawSubId : typeof rawSubId === 'object' && rawSubId && 'id' in rawSubId ? (rawSubId as { id: string }).id : null
        if (subId) {
          await handleProRenewal(admin, subId)
        }
        break
      }

      // ─── Pro subscription cancelled ───────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleProCancellation(admin, subscription)
        break
      }

      // ─── Connect account updated ──────────────────────────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleConnectUpdate(admin, account)
        break
      }

      default:
        // Unhandled event type — acknowledge to prevent retries
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`[stripe/webhook] Error processing ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}

// ─── Pro checkout completed ───────────────────────────────────────

async function handleProCheckout(
  admin: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  userId: string
) {
  const subscriptionId = session.subscription as string
  if (!subscriptionId) return

  // Get subscription to determine expiry
  let expiresAt: string | null = null
  if (stripe) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      expiresAt = getSubscriptionExpiry(sub)
    } catch {
      // Use 30-day fallback
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  await admin.from('profiles').update({
    is_pro: true,
    pro_expires_at: expiresAt,
    stripe_subscription_id: subscriptionId,
  }).eq('id', userId)

  // Add pro badge
  await admin.from('user_badges').upsert(
    { user_id: userId, badge_type: 'pro' },
    { onConflict: 'user_id,badge_type' }
  )

  console.log(`[webhook] Pro activated for user ${userId}`)
}

// ─── Pro renewal (recurring invoice paid) ─────────────────────────

async function handleProRenewal(
  admin: ReturnType<typeof createAdminClient>,
  subscriptionId: string
) {
  let expiresAt: string | null = null
  if (stripe) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      expiresAt = getSubscriptionExpiry(sub)
    } catch {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (profile) {
    await admin.from('profiles').update({
      is_pro: true,
      pro_expires_at: expiresAt,
    }).eq('id', profile.id)

    console.log(`[webhook] Pro renewed for user ${profile.id}`)
  }
}

// ─── Pro subscription deleted ─────────────────────────────────────

async function handleProCancellation(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (profile) {
    await admin.from('profiles').update({
      is_pro: false,
      stripe_subscription_id: null,
    }).eq('id', profile.id)

    await admin.from('user_badges').delete()
      .eq('user_id', profile.id)
      .eq('badge_type', 'pro')

    console.log(`[webhook] Pro deactivated for user ${profile.id}`)
  }
}

// ─── Rental payment completed ─────────────────────────────────────

async function handleRentalPayment(
  admin: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  bookingId: string
) {
  const { data: booking } = await admin
    .from('rental_bookings')
    .select('status, lender_id, borrower_id')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.status !== 'confirmed') return

  await admin.from('rental_bookings').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: session.payment_intent as string,
  }).eq('id', bookingId)

  // Notify lender
  await admin.from('notifications').insert({
    user_id: booking.lender_id,
    from_user_id: booking.borrower_id,
    type: 'rental_paid',
    title: 'Varaus maksettu',
    body: 'Lainaaja on maksanut varauksen',
    link_type: 'rental',
    link_id: bookingId,
  })

  console.log(`[webhook] Rental ${bookingId} paid`)
}

// ─── Ad campaign payment completed ────────────────────────────────

async function handleAdPayment(
  admin: ReturnType<typeof createAdminClient>,
  adId: string,
  session: Stripe.Checkout.Session
) {
  await admin.from('advertisements').update({
    status: 'active',
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: session.payment_intent as string,
  }).eq('id', adId)

  console.log(`[webhook] Ad ${adId} activated`)
}

// ─── Connect account updated ──────────────────────────────────────

async function handleConnectUpdate(
  admin: ReturnType<typeof createAdminClient>,
  account: Stripe.Account
) {
  if (!account.charges_enabled || !account.details_submitted) return

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_connect_account_id', account.id)
    .single()

  if (profile) {
    await admin.from('profiles').update({ stripe_connect_onboarded: true }).eq('id', profile.id)
    console.log(`[webhook] Connect onboarded for user ${profile.id}`)
  }
}
