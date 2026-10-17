-- Hide a conversation from one person's inbox. Messages, visits and reviews stay.
alter table public.conversations
  add column if not exists customer_hidden_at timestamptz,
  add column if not exists worker_hidden_at timestamptz;

create or replace function public.hide_conversation_from_inbox(_conv uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c public.conversations;
begin
  select * into c from public.conversations where id = _conv;
  if c.id is null or (c.customer_id <> auth.uid() and c.worker_id <> auth.uid()) then
    raise exception 'forbidden';
  end if;
  if auth.uid() = c.customer_id then
    update public.conversations set customer_hidden_at = now() where id = _conv;
  else
    update public.conversations set worker_hidden_at = now() where id = _conv;
  end if;
end $$;

revoke all on function public.hide_conversation_from_inbox(uuid) from public;
grant execute on function public.hide_conversation_from_inbox(uuid) to authenticated;

create or replace function public.trg_unhide_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
    set customer_hidden_at = null, worker_hidden_at = null
    where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists trg_unhide_conversation_message on public.messages;
create trigger trg_unhide_conversation_message
  after insert on public.messages
  for each row execute function public.trg_unhide_conversation();

drop trigger if exists trg_unhide_conversation_booking on public.booking_requests;
create trigger trg_unhide_conversation_booking
  after insert on public.booking_requests
  for each row execute function public.trg_unhide_conversation();
