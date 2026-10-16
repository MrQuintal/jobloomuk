# Role-permission matrix

| Capability | Visitor | Customer | Worker | Moderator | Admin | Super admin |
|---|---|---|---|---|---|---|
| Browse public pages, categories, plans | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Read/edit own profile | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Post & manage own jobs (P3) | | ✓ | | | | |
| Build portfolio, respond to jobs (P2–3) | | | ✓ | | | |
| Leave review after verified completion (P5) | | ✓ | ✓ | | | |
| Moderate content & reports (P6) | | | | ✓ | ✓ | ✓ |
| View all users, audit log | | | | | ✓ | ✓ |
| Grant customer/worker/moderator | | | | | ✓ | ✓ |
| Grant/revoke admin roles | | | | | | ✓ |
| Change categories, plans, flags, settings | | | | | ✓ | ✓ |

Rules enforced in the database:
- Users choose customer or worker once (signup or `choose_initial_role`); they can never self-assign elevated roles.
- Admins cannot remove their own admin role.
- Only admins can change `account_status`.

## Creating the first super admin
Run once (via Lovable Cloud SQL): `insert into user_roles(user_id, role) values ('<your user id>', 'super_admin');`
