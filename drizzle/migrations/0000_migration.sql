
create type public.app_role as enum ('customer','worker','moderator','admin','super_admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  postcode text,
  phone text,
  account_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','super_admin'))
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin(auth.uid())) with check (id = auth.uid() or public.is_admin(auth.uid()));
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- non-admins cannot change their own account status
create or replace function public.protect_profile_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.account_status is distinct from old.account_status and not public.is_admin(auth.uid()) and auth.uid() is not null then
    raise exception 'only admins can change account status';
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger trg_profiles_protect before update on public.profiles for each row execute function public.protect_profile_status();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admins read audit" on public.audit_logs for select to authenticated using (public.is_admin(auth.uid()));

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public read active categories" on public.categories for select to anon, authenticated using (is_active or public.is_admin(auth.uid()));
create policy "admins manage categories" on public.categories for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  monthly_price_pence int not null default 0,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.subscription_plans to anon, authenticated;
grant insert, update, delete on public.subscription_plans to authenticated;
grant all on public.subscription_plans to service_role;
alter table public.subscription_plans enable row level security;
create policy "public read plans" on public.subscription_plans for select to anon, authenticated using (is_active or public.is_admin(auth.uid()));
create policy "admins manage plans" on public.subscription_plans for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);
grant select on public.feature_flags to anon, authenticated;
grant insert, update, delete on public.feature_flags to authenticated;
grant all on public.feature_flags to service_role;
alter table public.feature_flags enable row level security;
create policy "public read flags" on public.feature_flags for select to anon, authenticated using (true);
create policy "admins manage flags" on public.feature_flags for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "admins manage settings" on public.platform_settings for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create or replace function public.audit_user_roles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(actor_id, action, target_type, target_id, details)
  values (auth.uid(),
          case when tg_op = 'INSERT' then 'role.granted' else 'role.revoked' end,
          'user', case when tg_op = 'INSERT' then new.user_id else old.user_id end,
          jsonb_build_object('role', case when tg_op = 'INSERT' then new.role else old.role end));
  return case when tg_op = 'INSERT' then new else old end;
end $$;
create trigger trg_audit_user_roles after insert or delete on public.user_roles
for each row execute function public.audit_user_roles();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _role text := new.raw_user_meta_data->>'signup_role';
begin
  insert into public.profiles(id, display_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'avatar_url');
  if _role in ('customer','worker') then
    insert into public.user_roles(user_id, role) values (new.id, _role::public.app_role);
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.choose_initial_role(_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _role not in ('customer','worker') then raise exception 'role not allowed'; end if;
  if exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('customer','worker')) then
    raise exception 'role already chosen';
  end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), _role);
end $$;
revoke execute on function public.choose_initial_role(public.app_role) from public, anon;
grant execute on function public.choose_initial_role(public.app_role) to authenticated;

create or replace function public.admin_set_role(_user_id uuid, _role public.app_role, _grant boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden'; end if;
  if _role in ('admin','super_admin') and not public.has_role(auth.uid(),'super_admin') then
    raise exception 'only super admins can change admin roles';
  end if;
  if _user_id = auth.uid() and not _grant and _role in ('admin','super_admin') then
    raise exception 'you cannot remove your own admin role';
  end if;
  if _grant then
    insert into public.user_roles(user_id, role) values (_user_id, _role) on conflict do nothing;
  else
    delete from public.user_roles where user_id = _user_id and role = _role;
  end if;
end $$;
revoke execute on function public.admin_set_role(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.admin_set_role(uuid, public.app_role, boolean) to authenticated;

insert into public.categories(slug,name,sort_order) values
 ('plumbing','Plumbing',1),('electrical','Electrical',2),('carpentry','Carpentry & joinery',3),
 ('painting','Painting & decorating',4),('gardening','Gardening & landscaping',5),('cleaning','Cleaning',6),
 ('building','Building & renovation',7),('roofing','Roofing',8),('tiling','Tiling',9),('handyman','Handyman',10);
insert into public.subscription_plans(slug,name,description,monthly_price_pence,features,sort_order) values
 ('free','Starter','Get listed and respond to jobs',0,'["Public profile","Up to 5 portfolio projects","Respond to customer jobs"]',1),
 ('pro','Professional','Stand out with a full portfolio',0,'["Unlimited portfolio projects","Profile customisation","Availability calendar","Profile analytics"]',2),
 ('business','Business','For teams and growing firms',0,'["Everything in Professional","Multiple team members","Business branding","Priority support"]',3);
insert into public.feature_flags(key,enabled,description) values
 ('subscriptions_billing',false,'Charge worker subscriptions (Phase 7)'),
 ('customer_jobs',false,'Customers can post jobs (Phase 3)'),
 ('messaging',false,'Direct messaging (Phase 4)'),
 ('reviews',false,'Reviews and reputation (Phase 5)');
insert into public.platform_settings(key,value,description) values
 ('newcomer_boost_days','90','Days a new worker receives a fair-exposure boost'),
 ('review_min_days_after_completion','1','Days after completion before a review can be left');

create policy "portfolio read" on storage.objects for select to anon, authenticated using (bucket_id = 'portfolio');
create policy "portfolio owner write" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portfolio owner update" on storage.objects for update to authenticated using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portfolio owner delete" on storage.objects for delete to authenticated using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents owner read" on storage.objects for select to authenticated using (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid())));
create policy "documents owner write" on storage.objects for insert to authenticated with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents owner delete" on storage.objects for delete to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
