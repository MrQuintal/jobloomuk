# Security & privacy

- RLS enabled on every table; roles in a separate table checked by `has_role` / `is_admin` security-definer functions.
- Elevated actions run in security-definer functions that re-check the caller.
- Audit log is append-only via triggers; no client insert/update/delete.
- Storage buckets are private; paths are prefixed with the owner's user id.
- Customer exact addresses/contact details will be shared only after the customer accepts an introduction (P4).
- Abuse prevention (P5–6): rate limits on posting and messaging, review eligibility only after both parties confirm completion, report & moderation queue, no paid influence on reviews or ranking.
- UK GDPR: privacy notice, data export & account deletion (before launch), minimal data collection, retention schedule, ICO registration.
- Leaked-password protection and email confirmation enabled for accounts.
