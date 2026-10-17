-- A finished, reviewed conversation can be archived. The next job with the same person starts on a new thread.
alter table public.conversations add column if not exists archived_at timestamptz;

create or replace function public.start_conversation_with_worker(_worker_id uuid, _body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare conv uuid;
begin
  if not public.has_role(auth.uid(),'customer') then raise exception 'only customers can contact professionals'; end if;
  if _worker_id = auth.uid() then raise exception 'you cannot message yourself'; end if;
  if not exists (select 1 from public.worker_profiles where user_id = _worker_id and is_published) then raise exception 'professional not found'; end if;
  if char_length(coalesce(_body,'')) < 1 then raise exception 'message is empty'; end if;
  select id into conv from public.conversations
    where job_id is null and customer_id = auth.uid() and worker_id = _worker_id and archived_at is null
    order by created_at desc limit 1;
  if conv is null then
    insert into public.conversations(customer_id, worker_id) values (auth.uid(), _worker_id) returning id into conv;
  end if;
  insert into public.messages(conversation_id, sender_id, body) values (conv, auth.uid(), _body);
  return conv;
end $$;

create or replace function public.start_new_job(_conv uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  c public.conversations;
  done boolean;
  reviewed boolean;
  fresh uuid;
begin
  select * into c from public.conversations where id = _conv;
  if c.id is null or (c.customer_id <> auth.uid() and c.worker_id <> auth.uid()) then raise exception 'forbidden'; end if;
  if c.archived_at is not null then raise exception 'this job is already archived'; end if;
  select customer_confirmed_at is not null and worker_confirmed_at is not null into done
    from public.job_completions where conversation_id = _conv;
  select exists (select 1 from public.reviews where conversation_id = _conv and status = 'published') into reviewed;
  if not coalesce(done, false) or not coalesce(reviewed, false) then
    raise exception 'finish the job and publish the review first';
  end if;
  update public.conversations set archived_at = now() where id = _conv;
  select id into fresh from public.conversations
    where customer_id = c.customer_id and worker_id = c.worker_id and archived_at is null
    order by created_at desc limit 1;
  if fresh is null then
    insert into public.conversations(customer_id, worker_id) values (c.customer_id, c.worker_id) returning id into fresh;
  end if;
  return fresh;
end $$;

revoke all on function public.start_new_job(uuid) from public;
grant execute on function public.start_new_job(uuid) to authenticated;
