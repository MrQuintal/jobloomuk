<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules
- Product docs live in `docs/` (requirements register, data model, roles matrix); update them when a phase changes scope — they are the owner's source of truth.
- Roles live only in `public.user_roles`; elevated changes go through security-definer DB functions (`admin_set_role`) — prevents privilege escalation.
- Pure business rules live in `src/lib/rules/` with unit tests and must mirror DB enforcement — UI and DB stay consistent.
- Tunable business values go in `platform_settings` / `feature_flags`, not code — owner can change them without a deploy.
- Signed-in pages live under `src/routes/_authenticated/`; `RoleGate` is UI-only, RLS is the real guard.
- Shared marketing layout is `PageShell`/`ContentPage` in `src/components/site/`; app layout is `AppShell` — keeps pages consistent.
- Payments: subscription state comes only from the signed payments webhook into public.subscriptions; plan tier is derived in src/lib/rules/plans.ts — client never decides access.
- Pricing guidance reads the category-keyed tips from platform_settings through a shared parser and editor; no inferred historical amounts — keeps customer guidance owner-editable and avoids fabricated estimates.
