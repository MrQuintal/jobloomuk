# Role-permission matrix

| Capability | Visitor | Customer | Worker | Moderator | Admin | Super admin |
|---|---|---|---|---|---|---|
| Browse public pages, categories, plans | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Read/edit own profile | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Post & manage own jobs (P3) | | ✓ | | | | |
| Build portfolio, respond to jobs (P2–3) | | | ✓ | | | |
| Leave review after verified completion (P5) | | ✓ | ✓ | | | |
| Moderate content & reports (P6) | | | | ✓ | ✓ | ✓ |
| Delete any job post from Find jobs or Moderation | | | | | | ✓ |
| View all users, audit log | | | | | ✓ | ✓ |
| Grant customer/worker/moderator | | | | | ✓ | ✓ |
| Grant/revoke admin roles | | | | | | ✓ |
| See and grant/revoke complimentary Business access | | | | | | ✓ |
| Change categories, plans, flags, settings | | | | | ✓ | ✓ |

Rules enforced in the database:
- Only super admins can call `super_admin_delete_job`; deletion is atomic with an audit entry (title, customer and optional reason). Conversations/messages survive deletion; related job responses are deleted with the job.
- Users choose customer or worker once (signup or `choose_initial_role`); they can never self-assign elevated roles.
- Admins cannot remove their own admin role.
- Only admins can change `account_status`.
- Only super admins can see Business upgrade controls and call `admin_set_business_access`; grants require a professional role and all changes are audited. Removing a grant restores paid-plan/Free access without altering billing.

## Creating the first super admin
The verified requesting owner's account was bootstrapped once through privileged Lovable Cloud tooling on 16 October 2026, only while no super admin existed. The existing professional role was retained. Future elevated changes must use the protected `admin_set_role` function, not self-service metadata or direct browser writes.
