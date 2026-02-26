# Testing

## Current State

No automated test framework is installed. Verification is manual.

## Manual Verification Checklist

Before pushing, verify:

### Build
```bash
npm run build    # Must complete without errors
npm run lint     # ESLint checks
```

### Auth Flow
- [ ] Google OAuth login works
- [ ] Email/password registration sends verification email
- [ ] Email/password login works
- [ ] Password reset flow works
- [ ] Logout clears session
- [ ] Protected routes redirect to `/login` when unauthenticated
- [ ] Authenticated users redirect from `/login` to `/`
- [ ] Onboarding enforced for new users

### API Routes
- [ ] All API routes return 401 when unauthenticated
- [ ] Rate limiting returns 429 when exceeded
- [ ] Input validation rejects invalid data
- [ ] Admin-only routes return 403 for non-admins

### Payments (Dev Mode)
When `STRIPE_SECRET_KEY` is not set, verify:
- [ ] Pro subscription activates instantly
- [ ] Rental bookings confirm without payment
- [ ] Ad campaigns activate without payment

### Core Features
- [ ] Posts: create, edit, delete, view in feed
- [ ] Events: create, attend, edit, delete, calendar view
- [ ] Messages: send text, send image, typing indicator
- [ ] Notifications: appear on new message/event/rental
- [ ] Search: text search, category filter, sort
- [ ] Map: markers show, cluster, user location
- [ ] Profile: edit bio, change avatar, view stats

## Health Check

```bash
curl http://localhost:3000/api/health
# → { "status": "ok" } or { "status": "error" } with 503
```

## Future Testing

Recommended additions:
- **Playwright** for E2E tests (auth flows, post CRUD, messaging)
- **Vitest** for unit tests (format utilities, rate limiter logic)
