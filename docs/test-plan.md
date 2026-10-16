# Acceptance test checklist

## Phase 1 (automated: `src/lib/rules/roles.test.ts`)
- [x] Customers cannot manage roles
- [x] Admins can grant moderator but not admin; super admins can grant admin
- [x] Users can only self-select customer or worker
- [x] Users are routed to the correct dashboard
- [x] Database: non-admins cannot read others' profiles, roles or the audit log (RLS)

## Later phases (from spec §24)
- Accounts: email confirmation, password reset, account suspension
- Jobs: create/edit/close, privacy of exact address, expiry
- Profiles: publish/unpublish, portfolio media, public page renders
- Availability: booking request lifecycle, no double-booking
- Reputation: review only after confirmed completion, one review per introduction, report flow
- Subscriptions: features unlock/lock, no effect on reviews/ranking
- Admin: every sensitive action audited; non-technical usability
- Responsive: mobile, tablet, desktop on every page
- Privacy: data export, account deletion
