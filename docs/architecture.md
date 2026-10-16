# Jobloom architecture

Jobloom (jobloom.co.uk) is a UK two-sided services discovery and introductions platform. Revenue: optional worker subscriptions only. The platform never processes job payments or takes commission.

## Layers
- **Web app**: TanStack Start (React 19, SSR) on edge workers. Public marketing pages are SSR; signed-in areas live under `src/routes/_authenticated/` (client-only, session from Lovable Cloud auth).
- **Backend**: Lovable Cloud (Postgres, Auth, Storage). Security is enforced in the database (RLS + security-definer functions), never only in the UI.
- **Business rules**: `src/lib/rules/*` (pure TypeScript, unit-tested) mirror DB rules for UI decisions. Tunable values live in `platform_settings`, `feature_flags`, `categories`, `subscription_plans`.
- **Privileged actions**: database functions (`admin_set_role`, `choose_initial_role`) or `createServerFn` with `requireSupabaseAuth`. The service role is never sent to the browser.

## Mobile readiness
All rules live in the database and server functions, so a future native app (React Native / Expo) can reuse the same auth, tables and functions with no rewrite. No business logic depends on the browser.

## Phases
0 Architecture · 1 Secure foundation (done) · 2 Profiles & portfolios · 3 Customer jobs · 4 Enquiries, messaging, availability · 5 Reputation & trust · 6 Admin panel · 7 Subscriptions · 8 QA & launch · 9 Post-launch.
