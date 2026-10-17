# Requirements register

| ID | Requirement | Priority | Phase | Status |
|---|---|---|---|---|
| ACC-001 | Email/password + Google sign-in, password reset | Must | 1 | Done |
| ACC-002 | Choose customer or worker at signup | Must | 1 | Done |
| ACC-003 | Roles in protected table; no self-escalation | Must | 1 | Done |
| ADM-001 | Admin user list with role management | Must | 1 | Done |
| ADM-002 | Immutable audit log | Must | 1 | Done |
| ADM-004 | Super-admin-only audited complimentary Business upgrades in Users; billing unchanged | Must | 7 | Done |
| ADM-005 | Super-admin-only confirmed job post deletion in Find jobs and Moderation, with audit record and preserved conversations | Must | 6 | Done |
| CFG-001 | Categories, plans, flags, settings in database | Must | 1 | Done |
| STO-001 | Secure storage buckets | Must | 1 | Done |
| PRO-001 | Worker profile builder & public page | Must | 2 | Planned |
| PRO-002 | Portfolio projects with media | Must | 2 | Planned |
| PRO-003 | "What I do most" specialisms | Must | 2 | Planned |
| PRO-004 | Service area & travel radius | Must | 2 | Planned |
| JOB-001 | Customers create/publish/edit jobs | Must | 3 | Planned |
| JOB-002 | Workers discover and respond to jobs | Must | 3 | Planned |
| MSG-001 | Direct messaging after introduction | Must | 4 | Planned |
| BKG-001 | Availability & booking requests | Should | 4 | Planned |
| REP-001 | Reviews only after confirmed completion | Must | 5 | Done |
| REP-002 | Newcomer fairness in ranking | Must | 5 | Done |
| REP-003 | Tradesperson credential verification and badges | Removed | 5 | Out of scope — owner decision, 16 Oct 2026 |
| PRC-001 | Category-specific indicative pricing tips when posting jobs | Could | 5 | Built — qualitative tips; historical monetary ranges deferred |
| ADM-003 | Full admin modules (A–P in spec §17) | Must | 6 | Partial |
| SUB-001 | Worker subscriptions billing | Must | 7 | Done |
| SUB-002 | Pro tools: analytics, AI writing, quote templates, job filters/saved searches/alerts, unlimited portfolio (free = 3) | Must | 7 | Done |
| SUB-003 | Business tools: team members on public profile, lead pipeline with assignment, CSV report | Must | 7 | Done |
| BIZ-001 | No job payments or commission, ever | Must | All | Enforced |
| PRV-001 | Data export & account deletion | Must | 8 | Done |
| MOD-001 | Reports on profiles, reviews and people | Must | 5 | Done |
| NOT-001 | In-app notifications | Must | 4 | Done |
| BKG-002 | Mutual completion confirmation | Must | 4 | Done |

## Build status (Oct 2026)
- Phase 2 built: worker profile editor, specialisms, availability, portfolio with photos; public directory `/professionals` and profile `/pro/:slug`.
- Phase 3 built: customers post/pause/close jobs and accept or decline responses; workers browse open jobs (`/jobs`), respond and withdraw.
- Phase 4 built: conversations and messages (`/messages`), visit requests with accept/decline/cancel rules mirrored in `src/lib/rules/marketplace.ts`.
- Phase 5 built: two-sided completion confirmation, 4-part reviews with public reply, average hidden below 3 reviews, newcomer interleaving in the directory, reports.
- Phase 6 partial: admin overview, categories, feature switches, moderation queue, suspend/reactivate, deletion requests.
- REP-003 removed: Jobloom provides introductions, not tradesperson vetting. No ID, insurance or trade-licence approval or verification badges. Customers check credentials directly with the professional and relevant register. Reviews based on mutual completion confirmation remain in scope.
- PRC-001: job posting now shows category-specific cost drivers and quote questions, editable in admin settings. These are general tips, not quotations or historical price estimates. Monetary ranges remain deferred until sufficient genuine completed-job pricing data exists.
- Launch: jobloom.co.uk and www.jobloom.co.uk are connected; the app is not published. Stripe still needs owner onboarding and live app installation. The managed sender notify.jobloom.co.uk is configured and awaiting DNS verification, with sending support and a job-match template prepared; external job alerts still need per-recipient event wiring and a live-send check. The verified requesting owner has the first super-admin role; existing professional access is retained. Removing verification does not remove Jobloom's other legal or data-protection responsibilities; legal pages still need solicitor review.

- Plan features: gated by `plan_tier()` in the database (RLS + portfolio trigger); `/tools` page. Banners, video, service-area map, printable profile, branches, shared team calendar and sponsored placement are implemented; email alerts remain pending (in-app alerts only). Implementation status is not a claim of complete end-to-end verification.
