# Data model

## Built (Phase 1)
| Table | Purpose |
|---|---|
| profiles | One per user: display name, avatar, postcode, phone, account_status |
| user_roles | user_id + app_role (customer, worker, moderator, admin, super_admin) |
| business_access_grants | Complimentary Business entitlement per professional; owner/super-admin reads, audited super-admin function writes; no billing changes |
| audit_logs | Immutable record of sensitive actions (written by triggers/functions only) |
| categories | Service categories (admin-managed) |
| subscription_plans | Plan names, features, price (admin-managed) |
| feature_flags | On/off switches for unfinished modules |
| platform_settings | Tunable business rules (newcomer boost days, review delay, …) |

Storage buckets (private): `portfolio` (readable, owner writes into `<user_id>/…`), `documents` (owner + admin only).

## Planned
Job post moderation: the protected `super_admin_delete_job` function permanently deletes any job post and records the actor, job ID, title, customer and optional reason in `audit_logs`. Existing conversations retain messages with their job reference cleared by the foreign key; job responses cascade.

- **Phase 2**: worker_profiles, worker_services, worker_specialisms, portfolio_projects, portfolio_media, service_areas (centre point + radius).
- **Phase 3**: jobs, job_requirements, job_media, job_status_history.
- **Phase 4**: job_responses (interest), conversations, messages, availability_slots, booking_requests, introductions.
- **Phase 5**: completions (both-party confirmation), reviews, review_reports, worker_metrics. Credential collection, verification records and badges are excluded by the owner's REP-003 scope decision (16 Oct 2026).
- **Phase 6**: moderation_cases, complaints, content_pages, notifications.
- **Phase 7**: worker_subscriptions, billing_events (subscription billing only).
- **Price guidance**: aggregated from completed jobs, shown only above a minimum sample size.
