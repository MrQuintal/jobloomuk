# Jobloom (jobloom.co.uk) — Phase 0 + Phase 1 Plan

Jobloom is a UK two-sided services platform: customers post jobs and find professionals; workers advertise services, build portfolios and find jobs. The two sides then agree price and payment directly. Jobloom only earns money from worker subscriptions and never handles job payments or takes commission.

Your spec asks for the architecture to be approved before the full app is built, so this plan covers **Phase 0 (architecture documents)** and **Phase 1 (secure foundation)**. Later phases each get their own plan.

## What you will see after this step

- A branded Jobloom website with a home page, How it works, For customers, For professionals, Pricing (subscription plans marked "coming soon"), About, Contact, Terms and Privacy pages.
- Sign up and log in (email and Google), where you choose "I need work done" or "I'm a professional".
- Separate starter dashboards for customers, workers and admins. Each one only shows what that role is allowed to see.
- A basic admin area where you can see users and change their roles, with every change written to an audit log.
- Project documents: requirements register, database design, role-permission matrix, security plan, state diagrams and test checklist.

Nothing on screen will pretend to work when it doesn't. Unfinished sections will say "Coming in a later phase".

## Phase 0 — Architecture documents (saved in `/docs`)

1. `requirements-register.md`: every requirement from your spec with an ID (e.g. JOB-001), priority, phase, dependencies, status and acceptance test.
2. `architecture.md`: the system overview and how it supports a future mobile app (all business rules run on the server, so a phone app can reuse them).
3. `data-model.md`: the full database design for all phases.
4. `roles-permissions.md`: what visitors, customers, workers, moderators, admins and super admins can do.
5. `security-privacy.md`: access rules, UK GDPR, data export and deletion, abuse prevention, file safety.
6. `state-transitions.md`: job lifecycle, worker responses, booking requests, reviews, subscriptions.
7. `rules-config.md`: proposed defaults for ranking, newcomer boost, review eligibility and price-guidance thresholds. You can change these from admin later.
8. `open-decisions.md`: decisions you need to make, external services, and likely costs (payments provider, email sending, maps, file moderation, company registration and ICO fee).
9. `test-plan.md`: the acceptance checklist from section 24 of your spec.

## Phase 1 — Secure foundation (built)

- **Lovable Cloud** turned on for the database, logins and file storage.
- **Accounts**: email/password and Google sign-in, password reset, a profile record for each user, and choosing your role at sign-up.
- **Roles**: stored in their own protected table (customer, worker, moderator, admin, super_admin). Users can never promote themselves.
- **Access rules** on every table, plus checks on the server for important actions.
- **Storage**: private buckets for documents and public buckets for portfolio images, each with rules about who can upload.
- **Audit log**: admin and role changes are recorded and can't be edited.
- **Settings tables**: categories, subscription plans and feature flags kept in the database so they can be changed without code.
- **App shell**: works on mobile and desktop, with role-aware navigation, loading, empty and error states.
- **Design**: a distinctive "bloom" look (deep forest green, warm cream, coral accent, characterful serif headings with a clean sans-serif body). Not a generic template.
- **Tests**: automated checks that a customer can't reach admin pages, users can't change their own role, and so on.

## Not in this step

Profiles and portfolios (Phase 2), job posting (Phase 3), messaging and bookings (Phase 4), reviews (Phase 5), the full admin panel (Phase 6), and subscription billing (Phase 7).

## Technical details

- Stack: TanStack Start, Lovable Cloud (Postgres + Auth + Storage), Tailwind v4 tokens in `src/styles.css`.
- Phase 1 tables: `profiles`, `user_roles` (enum `app_role`) + a `has_role()` security definer function, `audit_logs` (insert via trigger/server only), `categories`, `subscription_plans`, `feature_flags`, `platform_settings`. Signup trigger creates the profile and the chosen customer/worker role. Elevated roles are only granted through an admin server function.
- RLS is on for all tables. Admin reads/writes use `has_role(auth.uid(),'admin')`.
- Routes: public marketing routes, `/auth`, `_authenticated/` layout with `/dashboard` (redirects by role), `/customer`, `/worker`, `/admin/users`, `/admin/audit`.
- Server functions use `requireSupabaseAuth`. Business rules live in `src/lib/rules/`, config is read from the database.
- Every public route has its own head() metadata branded "Jobloom". Canonical URLs are relative until the domain is connected.
- `AGENTS.md` records the architecture rules. Memory records the brand name, domain and the "no job payments or commission" rule.
