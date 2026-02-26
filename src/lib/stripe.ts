/**
 * Stripe client singleton + configuration constants.
 *
 * If STRIPE_SECRET_KEY is not set, DEV_MODE is true and all payment
 * flows activate instantly without real Stripe calls.
 */

import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeKey ? new Stripe(stripeKey) : null

/** True when no Stripe key is configured — activations happen instantly */
export const DEV_MODE = !stripe

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || ''
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// Rental commission rates
export const COMMISSION_RATE = parseFloat(process.env.RENTAL_COMMISSION_RATE || '0.10')
export const COMMISSION_RATE_PRO = parseFloat(process.env.RENTAL_COMMISSION_RATE_PRO || '0.05')

// Ad daily rates (EUR)
export const AD_DAILY_RATE = parseFloat(process.env.AD_DAILY_RATE || '2.99')
export const AD_DAILY_RATE_PRO = parseFloat(process.env.AD_DAILY_RATE_PRO || '2.39')

/** Convert euros to cents for Stripe API (rounds to avoid floating-point errors) */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}
