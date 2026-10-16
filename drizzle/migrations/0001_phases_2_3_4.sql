
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.worker_profiles (
  user_id uuid primary key,
  slug text not null unique,
  business_name text not null,
  headline text,
  bio text,
  base_area text,
  travel_radius_miles int not null default 15,
  years_experience int,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.worker_profiles to anon;
grant select, insert, update, delete on public.worker_profiles to authenticated;
grant all on public.worker_profiles to service_role;
alter table public.worker_profiles enable row level security;
create policy "published profiles public" on public.worker_profiles for select to anon, authenticated using (is_published or user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "workers insert own" on public.worker_profiles for insert to authenticated with check (user_id = auth.uid() and public.has_role(auth.uid(),'worker'));
create policy "workers update own" on public.worker_profiles for update to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid())) with check (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "workers delete own" on public.worker_profiles for delete to authenticated using (user_id = auth.uid());
create trigger trg_wp_updated before update on public.worker_profiles for each row execute function public.touch_updated_at();

create table public.worker_specialisms (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles(user_id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  unique (worker_id, category_id)
);
grant select on public.worker_specialisms to anon;
grant select, insert, update, delete on public.worker_specialisms to authenticated;
grant all on public.worker_specialisms to service_role;
alter table public.worker_specialisms enable row level security;
create policy "specialisms readable with profile" on public.worker_specialisms for select to anon, authenticated using (exists (select 1 from public.worker_profiles w where w.user_id = worker_id and (w.is_published or w.user_id = auth.uid())));
create policy "workers manage own specialisms" on public.worker_specialisms for all to authenticated using (worker_id = auth.uid()) with check (worker_id = auth.uid());

create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles(user_id) on delete cascade,
  title text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  location_text text,
  completed_on date,
  image_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.portfolio_projects to anon;
grant select, insert, update, delete on public.portfolio_projects to authenticated;
grant all on public.portfolio_projects to service_role;
alter table public.portfolio_projects enable row level security;
create policy "projects readable with profile" on public.portfolio_projects for select to anon, authenticated using (exists (select 1 from public.worker_profiles w where w.user_id = worker_id and (w.is_published or w.user_id = auth.uid())));
create policy "workers manage own projects" on public.portfolio_projects for all to authenticated using (worker_id = auth.uid()) with check (worker_id = auth.uid());

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  title text not null,
  description text not null,
  category_id uuid references public.categories(id) on delete set null,
  area text not null,
  timing text,
  budget_note text,
  status text not null default 'open' check (status in ('open','paused','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.jobs to authenticated;
grant all on public.jobs to service_role;
alter table public.jobs enable row level security;
create policy "owner reads jobs" on public.jobs for select to authenticated using (customer_id = auth.uid() or public.is_admin(auth.uid()) or (status = 'open' and public.has_role(auth.uid(),'worker')));
create policy "customers create jobs" on public.jobs for insert to authenticated with check (customer_id = auth.uid() and public.has_role(auth.uid(),'customer'));
create policy "owner updates jobs" on public.jobs for update to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "owner deletes jobs" on public.jobs for delete to authenticated using (customer_id = auth.uid());
create trigger trg_jobs_updated before update on public.jobs for each row execute function public.touch_updated_at();

create table public.job_responses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null,
  message text not null,
  status text not null default 'sent' check (status in ('sent','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  unique (job_id, worker_id)
);
grant select, insert, update on public.job_responses to authenticated;
grant all on public.job_responses to service_role;
alter table public.job_responses enable row level security;
create policy "parties read responses" on public.job_responses for select to authenticated using (worker_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_id and j.customer_id = auth.uid()) or public.is_admin(auth.uid()));
create policy "workers respond to open jobs" on public.job_responses for insert to authenticated with check (worker_id = auth.uid() and status = 'sent' and public.has_role(auth.uid(),'worker') and exists (select 1 from public.jobs j where j.id = job_id and j.status = 'open' and j.customer_id <> auth.uid()));
create policy "workers withdraw own" on public.job_responses for update to authenticated using (worker_id = auth.uid()) with check (worker_id = auth.uid() and status = 'withdrawn');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  customer_id uuid not null,
  worker_id uuid not null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (job_id, worker_id)
);
grant select on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "parties read conversations" on public.conversations for select to authenticated using (customer_id = auth.uid() or worker_id = auth.uid());

create or replace function public.is_conversation_party(_conv uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations c where c.id = _conv and (c.customer_id = auth.uid() or c.worker_id = auth.uid()))
$$;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "parties read messages" on public.messages for select to authenticated using (public.is_conversation_party(conversation_id));
create policy "parties send messages" on public.messages for insert to authenticated with check (sender_id = auth.uid() and public.is_conversation_party(conversation_id));

create or replace function public.bump_conversation() returns trigger language plpgsql security definer set search_path = public as $$
begin update public.conversations set last_message_at = now() where id = new.conversation_id; return new; end $$;
create trigger trg_msg_bump after insert on public.messages for each row execute function public.bump_conversation();

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
grant select on public.availability_slots to anon;
grant select, insert, update, delete on public.availability_slots to authenticated;
grant all on public.availability_slots to service_role;
alter table public.availability_slots enable row level security;
create policy "availability public" on public.availability_slots for select to anon, authenticated using (true);
create policy "workers manage availability" on public.availability_slots for all to authenticated using (worker_id = auth.uid()) with check (worker_id = auth.uid() and public.has_role(auth.uid(),'worker'));

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  requested_by uuid not null,
  starts_at timestamptz not null,
  note text,
  status text not null default 'requested' check (status in ('requested','accepted','declined','cancelled')),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.booking_requests to authenticated;
grant all on public.booking_requests to service_role;
alter table public.booking_requests enable row level security;
create policy "parties read bookings" on public.booking_requests for select to authenticated using (public.is_conversation_party(conversation_id));
create policy "parties request bookings" on public.booking_requests for insert to authenticated with check (requested_by = auth.uid() and status = 'requested' and public.is_conversation_party(conversation_id));
create policy "parties update bookings" on public.booking_requests for update to authenticated using (public.is_conversation_party(conversation_id)) with check (public.is_conversation_party(conversation_id));

create or replace function public.guard_booking_update() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.starts_at <> old.starts_at or new.requested_by <> old.requested_by or new.conversation_id <> old.conversation_id then raise exception 'cannot change booking details'; end if;
  if new.status = old.status then return new; end if;
  if old.status <> 'requested' then raise exception 'booking already decided'; end if;
  if new.status in ('accepted','declined') and auth.uid() = old.requested_by then raise exception 'the other party must respond'; end if;
  if new.status = 'cancelled' and auth.uid() <> old.requested_by then raise exception 'only the requester can cancel'; end if;
  return new;
end $$;
create trigger trg_booking_guard before update on public.booking_requests for each row execute function public.guard_booking_update();

create or replace function public.accept_job_response(_response_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare r public.job_responses; j public.jobs; conv uuid;
begin
  select * into r from public.job_responses where id = _response_id;
  if r.id is null then raise exception 'response not found'; end if;
  select * into j from public.jobs where id = r.job_id;
  if j.customer_id <> auth.uid() then raise exception 'forbidden'; end if;
  if r.status not in ('sent','accepted') then raise exception 'response is no longer available'; end if;
  update public.job_responses set status = 'accepted' where id = r.id;
  select id into conv from public.conversations where job_id = j.id and worker_id = r.worker_id;
  if conv is null then
    insert into public.conversations(job_id, customer_id, worker_id) values (j.id, j.customer_id, r.worker_id) returning id into conv;
    insert into public.messages(conversation_id, sender_id, body) values (conv, auth.uid(), 'Hi! I''d like to talk about this job.');
  end if;
  return conv;
end $$;
revoke execute on function public.accept_job_response(uuid) from public, anon;
grant execute on function public.accept_job_response(uuid) to authenticated;

create or replace function public.decline_job_response(_response_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.job_responses r set status = 'declined'
  from public.jobs j where r.id = _response_id and j.id = r.job_id and j.customer_id = auth.uid() and r.status = 'sent';
  if not found then raise exception 'cannot decline this response'; end if;
end $$;
revoke execute on function public.decline_job_response(uuid) from public, anon;
grant execute on function public.decline_job_response(uuid) to authenticated;

create or replace function public.start_conversation_with_worker(_worker_id uuid, _body text) returns uuid language plpgsql security definer set search_path = public as $$
declare conv uuid;
begin
  if not public.has_role(auth.uid(),'customer') then raise exception 'only customers can contact professionals'; end if;
  if _worker_id = auth.uid() then raise exception 'you cannot message yourself'; end if;
  if not exists (select 1 from public.worker_profiles where user_id = _worker_id and is_published) then raise exception 'professional not found'; end if;
  if char_length(coalesce(_body,'')) < 1 then raise exception 'message is empty'; end if;
  select id into conv from public.conversations where job_id is null and customer_id = auth.uid() and worker_id = _worker_id;
  if conv is null then
    insert into public.conversations(customer_id, worker_id) values (auth.uid(), _worker_id) returning id into conv;
  end if;
  insert into public.messages(conversation_id, sender_id, body) values (conv, auth.uid(), _body);
  return conv;
end $$;
revoke execute on function public.start_conversation_with_worker(uuid, text) from public, anon;
grant execute on function public.start_conversation_with_worker(uuid, text) to authenticated;

create or replace function public.conversation_party_names(_conv uuid) returns table(customer_name text, worker_name text, job_title text) language sql stable security definer set search_path = public as $$
  select pc.display_name, coalesce(w.business_name, pw.display_name), j.title
  from public.conversations c
  left join public.profiles pc on pc.id = c.customer_id
  left join public.profiles pw on pw.id = c.worker_id
  left join public.worker_profiles w on w.user_id = c.worker_id
  left join public.jobs j on j.id = c.job_id
  where c.id = _conv and (c.customer_id = auth.uid() or c.worker_id = auth.uid())
$$;
revoke execute on function public.conversation_party_names(uuid) from public, anon;
grant execute on function public.conversation_party_names(uuid) to authenticated;

alter publication supabase_realtime add table public.messages;
