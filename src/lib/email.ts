/**
 * TackBird transactional email utility (server-side only).
 *
 * - If SMTP_HOST is set, sends real emails via nodemailer.
 * - Otherwise, logs to console (development fallback).
 *
 * Supabase Auth already handles auth-related emails (confirm, reset).
 * This module is for app-specific transactional emails only.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// Minimal nodemailer transporter interface so we don't depend on @types/nodemailer
interface Transporter {
  sendMail(options: {
    from: string
    to: string
    subject: string
    html: string
  }): Promise<unknown>
}

// ---------------------------------------------------------------------------
// Branding helpers
// ---------------------------------------------------------------------------

const BRAND_COLOR = '#16a34a' // green-600
const APP_NAME = 'TackBird'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === 'production') {
  console.warn('[email] NEXT_PUBLIC_APP_URL is not set — email links will point to localhost!')
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:24px 32px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${APP_NAME}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${title}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px;font-size:15px;line-height:1.6;color:#18181b;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:20px 32px;border-radius:0 0 12px 12px;font-size:12px;color:#71717a;text-align:center;">
            <p style="margin:0;">Sait t&auml;m&auml;n viestin koska sinulla on ${APP_NAME}-tili.</p>
            <p style="margin:6px 0 0;">
              <a href="${APP_URL}" style="color:${BRAND_COLOR};text-decoration:none;">${APP_NAME}</a>
              &nbsp;&middot;&nbsp;Naapuriapu-sovellus
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#a1a1aa;">
              Jos et halua saada ilmoituksia, voit muuttaa asetuksiasi sovelluksessa.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Transport initialisation (lazy, singleton)
// ---------------------------------------------------------------------------

let _transporter: Transporter | null | undefined // undefined = not yet initialised

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST
  if (!host) return null
  return {
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  }
}

async function getTransporter(): Promise<Transporter | null> {
  if (_transporter !== undefined) return _transporter

  const config = getSmtpConfig()
  if (!config) {
    _transporter = null
    return null
  }

  try {
    // Use require() via a variable to avoid static analysis / TypeScript module resolution.
    // This lets the app build even when nodemailer is not installed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const requireFn = typeof require !== 'undefined' ? require : undefined
    if (!requireFn) {
      _transporter = null
      return null
    }
    const nodemailer = requireFn('nodemailer') as {
      createTransport: (config: SmtpConfig) => Transporter
    }
    _transporter = nodemailer.createTransport(config)
    console.log('[email] SMTP transporter initialised')
    return _transporter
  } catch {
    console.warn('[email] nodemailer not installed — emails will be logged to console. Run: npm install nodemailer')
    _transporter = null
    return null
  }
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/**
 * Send an email. Returns true if sent (or logged in dev), false on error.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const from = process.env.SMTP_FROM || 'noreply@tackbird.fi'

  try {
    const transporter = await getTransporter()

    if (transporter) {
      await transporter.sendMail({ from, to, subject, html })
      console.log(`[email] Sent "${subject}" to ${to}`)
      return true
    }

    // Development fallback — log to console
    console.log(
      `[email][dev] Would send email:\n  To: ${to}\n  Subject: ${subject}\n  (HTML body omitted — ${html.length} chars)`
    )
    return true
  } catch (err) {
    console.error('[email] Failed to send email:', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Template functions
// ---------------------------------------------------------------------------

/**
 * Welcome email sent after onboarding.
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;">Tervetuloa ${APP_NAME}iin, ${name}!</h2>
    <p>Hienoa, ett&auml; liityit naapuruston avuverkostoon. T&auml;ss&auml; muutama vinkki alkuun:</p>
    <ul style="padding-left:20px;">
      <li><strong>Selaa ilmoituksia</strong> &mdash; etsik&ouml; jotain hyödyllistä l&auml;heltä.</li>
      <li><strong>Luo oma ilmoitus</strong> &mdash; tarjoa apua, tavaroita tai palveluja.</li>
      <li><strong>Osallistu tapahtumiin</strong> &mdash; tutustu naapureihin livenä.</li>
    </ul>
    <p style="margin-top:24px;">
      <a href="${APP_URL}" style="display:inline-block;padding:12px 28px;background:${BRAND_COLOR};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Avaa ${APP_NAME}
      </a>
    </p>
  `
  return sendEmail(email, `Tervetuloa ${APP_NAME}iin!`, wrapHtml('Tervetuloa!', body))
}

/**
 * Booking confirmation email for rental bookings.
 */
export async function sendBookingConfirmation(
  email: string,
  data: {
    postTitle: string
    startDate: string
    endDate: string
    totalFee: number
  }
): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;">Varauksesi on vahvistettu!</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">Kohde</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;font-weight:600;">${data.postTitle}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">Alkup&auml;iv&auml;</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">${data.startDate}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">Loppup&auml;iv&auml;</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">${data.endDate}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#71717a;">Yhteens&auml;</td>
        <td style="padding:8px 0;font-weight:700;font-size:18px;">${data.totalFee.toFixed(2)}&nbsp;&euro;</td>
      </tr>
    </table>
    <p>Voit hallita varauksiasi sovelluksessa.</p>
    <p style="margin-top:24px;">
      <a href="${APP_URL}" style="display:inline-block;padding:12px 28px;background:${BRAND_COLOR};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Avaa ${APP_NAME}
      </a>
    </p>
  `
  return sendEmail(email, 'Varauksesi on vahvistettu', wrapHtml('Varausvahvistus', body))
}

/**
 * Booking cancellation notification.
 */
export async function sendBookingCancellation(
  email: string,
  data: { postTitle: string }
): Promise<boolean> {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;">Varaus peruutettu</h2>
    <p>Varaus kohteelle <strong>${data.postTitle}</strong> on peruutettu.</p>
    <p>Jos t&auml;m&auml; ei ollut odotettua, ota yhteytt&auml; toiseen osapuoleen viestill&auml; sovelluksessa.</p>
    <p style="margin-top:24px;">
      <a href="${APP_URL}" style="display:inline-block;padding:12px 28px;background:${BRAND_COLOR};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Avaa ${APP_NAME}
      </a>
    </p>
  `
  return sendEmail(email, 'Varaus peruutettu', wrapHtml('Varaus peruutettu', body))
}

/**
 * New message notification email. Intended to be throttled (max 1 per conversation per hour).
 */
export async function sendNewMessageEmail(
  email: string,
  data: { senderName: string; preview: string }
): Promise<boolean> {
  // Truncate preview to 200 chars for email
  const preview =
    data.preview.length > 200 ? data.preview.slice(0, 200) + '...' : data.preview

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;">Uusi viesti k&auml;ytt&auml;j&auml;lt&auml; ${data.senderName}</h2>
    <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;color:#3f3f46;font-style:italic;">&ldquo;${preview}&rdquo;</p>
    </div>
    <p>Vastaa viestiin avaamalla sovellus.</p>
    <p style="margin-top:24px;">
      <a href="${APP_URL}" style="display:inline-block;padding:12px 28px;background:${BRAND_COLOR};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Avaa keskustelu
      </a>
    </p>
  `
  return sendEmail(email, `Uusi viesti: ${data.senderName}`, wrapHtml('Uusi viesti', body))
}
