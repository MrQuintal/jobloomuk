
-- Completion confirmations (both parties must confirm)
create table public.job_completions (
  conversation_id uuid primary key references public.conversations(id) on delete cascade,
  customer_confirmed_at timestamptz,
  worker_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.job_completions to authenticated;
grant all on public.job_completions to service_role;
alter table public.job_completions enable row level security;
create policy "parties read completions" on public.job_completions for select to authenticated using (public.is_conversation_party(conversation_id) or public.is_admin(auth.uid()));

create or replace function public.confirm_completion(_conv uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c public.conversations;
begin
  select * into c from public.conversations where id = _conv;
  if c.id is null or (c.customer_id <> auth.uid() and c.worker_id <> auth.uid()) then raise exception 'forbidden'; end if;
  insert into public.job_completions(conversation_id) values (_conv) on conflict do nothing;
  if c.customer_id = auth.uid() then
    update public.job_completions set customer_confirmed_at = coalesce(customer_confirmed_at, now()) where conversation_id = _conv;
  else
    update public.job_completions set worker_confirmed_at = coalesce(worker_confirmed_at, now()) where conversation_id = _conv;
  end if;
end $$;

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  customer_id uuid not null,
  worker_id uuid not null,
  quality int not null check (quality between 1 and 5),
  reliability int not null check (reliability between 1 and 5),
  communication int not null check (communication between 1 and 5),
  value int not null check (value between 1 and 5),
  body text not null check (char_length(body) between 10 and 2000),
  worker_reply text check (worker_reply is null or char_length(worker_reply) <= 1000),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.reviews to authenticated;
grant select on public.reviews to anon;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "published reviews public" on public.reviews for select to anon, authenticated
  using (status = 'published' or customer_id = auth.uid() or worker_id = auth.uid() or public.is_admin(auth.uid()));
create policy "customers review confirmed work" on public.reviews for insert to authenticated
  with check (
    customer_id = auth.uid() and status = 'published'
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.customer_id = auth.uid() and c.worker_id = reviews.worker_id)
    and exists (select 1 from public.job_completions jc where jc.conversation_id = reviews.conversation_id and jc.customer_confirmed_at is not null and jc.worker_confirmed_at is not null)
  );
create policy "worker replies or admin moderates" on public.reviews for update to authenticated
  using (worker_id = auth.uid() or public.is_admin(auth.uid()))
  with check (worker_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.guard_review_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin(auth.uid()) then
    if new.status is distinct from old.status then
      insert into public.audit_logs(actor_id, action, target_type, target_id, details)
      values (auth.uid(), 'review.'||new.status, 'review', new.id, '{}'::jsonb);
    end if;
    return new;
  end if;
  if new.quality <> old.quality or new.reliability <> old.reliability or new.communication <> old.communication
     or new.value <> old.value or new.body <> old.body or new.status <> old.status
     or new.customer_id <> old.customer_id or new.worker_id <> old.worker_id or new.conversation_id <> old.conversation_id then
    raise exception 'professionals can only add a reply';
  end if;
  return new;
end $$;
create trigger trg_review_guard before update on public.reviews for each row execute function public.guard_review_update();

-- Public review listing with reviewer first name only
create or replace function public.worker_reviews(_worker uuid)
returns table(id uuid, reviewer text, quality int, reliability int, communication int, value int, body text, worker_reply text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, split_part(coalesce(p.display_name,'Customer'),' ',1), r.quality, r.reliability, r.communication, r.value, r.body, r.worker_reply, r.created_at
  from public.reviews r left join public.profiles p on p.id = r.customer_id
  where r.worker_id = _worker and r.status = 'published'
  order by r.created_at desc limit 50
$$;
grant execute on function public.worker_reviews(uuid) to anon, authenticated;

-- Reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  target_type text not null check (target_type in ('profile','job','review','message','user')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
grant select, insert, update on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reporters create" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');
create policy "reporter or admin reads" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin(auth.uid()) or public.has_role(auth.uid(),'moderator'));
create policy "admins handle" on public.reports for update to authenticated using (public.is_admin(auth.uid()) or public.has_role(auth.uid(),'moderator')) with check (public.is_admin(auth.uid()) or public.has_role(auth.uid(),'moderator'));

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "mark own read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notify(_user uuid, _title text, _link text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, title, link) values (_user, _title, _link)
$$;
revoke execute on function public.notify(uuid,text,text) from public, anon, authenticated;

create or replace function public.trg_notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.conversations;
begin
  select * into c from public.conversations where id = new.conversation_id;
  perform public.notify(case when new.sender_id = c.customer_id then c.worker_id else c.customer_id end, 'New message', '/messages/'||c.id);
  return new;
end $$;
create trigger trg_notify_message after insert on public.messages for each row execute function public.trg_notify_message();

create or replace function public.trg_notify_response() returns trigger
language plpgsql security definer set search_path = public as $$
declare j public.jobs;
begin
  select * into j from public.jobs where id = new.job_id;
  if tg_op = 'INSERT' then
    perform public.notify(j.customer_id, 'A professional responded to "'||j.title||'"', '/customer');
  elsif new.status is distinct from old.status and new.status in ('accepted','declined') then
    perform public.notify(new.worker_id, 'Your response to "'||j.title||'" was '||new.status, '/jobs');
  end if;
  return new;
end $$;
create trigger trg_notify_response after insert or update on public.job_responses for each row execute function public.trg_notify_response();

create or replace function public.trg_notify_booking() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.conversations; other uuid;
begin
  select * into c from public.conversations where id = new.conversation_id;
  if tg_op = 'INSERT' then
    other := case when new.requested_by = c.customer_id then c.worker_id else c.customer_id end;
    perform public.notify(other, 'New visit request', '/messages/'||c.id);
  elsif new.status is distinct from old.status then
    other := case when auth.uid() = c.customer_id then c.worker_id else c.customer_id end;
    perform public.notify(other, 'Visit '||new.status, '/messages/'||c.id);
  end if;
  return new;
end $$;
create trigger trg_notify_booking after insert or update on public.booking_requests for each row execute function public.trg_notify_booking();

create or replace function public.trg_notify_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform public.notify(new.worker_id, 'You received a new review', '/worker'); return new; end $$;
create trigger trg_notify_review after insert on public.reviews for each row execute function public.trg_notify_review();

-- Privacy requests
create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('deletion')),
  reason text,
  status text not null default 'pending' check (status in ('pending','completed','rejected')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
grant select, insert, update on public.privacy_requests to authenticated;
grant all on public.privacy_requests to service_role;
alter table public.privacy_requests enable row level security;
create policy "own create" on public.privacy_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "own or admin read" on public.privacy_requests for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "admin handle" on public.privacy_requests for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Admin: suspend/reactivate with audit
create or replace function public.admin_set_account_status(_user uuid, _status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'forbidden'; end if;
  if _status not in ('active','suspended') then raise exception 'invalid status'; end if;
  if _user = auth.uid() then raise exception 'you cannot suspend yourself'; end if;
  update public.profiles set account_status = _status where id = _user;
  if _status = 'suspended' then update public.worker_profiles set is_published = false where user_id = _user; end if;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details) values (auth.uid(), 'account.'||_status, 'user', _user, '{}'::jsonb);
end $$;

-- Admin reads profiles already allowed; worker_profiles admin read allowed. Admin read conversations not granted (privacy).
