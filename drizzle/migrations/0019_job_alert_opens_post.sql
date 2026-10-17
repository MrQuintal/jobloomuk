-- A matching job alert opens that post, not the whole jobs list.
create or replace function public.trg_job_alerts() returns trigger language plpgsql security definer set search_path=public as $$
declare s record;
begin
  for s in select distinct on (worker_id) worker_id, name from public.saved_searches
    where worker_id <> new.customer_id
      and (category_id is null or category_id = new.category_id)
      and (keyword is null or keyword = '' or new.title ilike '%'||keyword||'%' or new.description ilike '%'||keyword||'%')
      and (area is null or area = '' or new.area ilike '%'||area||'%')
  loop
    if public.tier_at_least(s.worker_id,'pro') then
      perform public.notify(s.worker_id, 'New job matching "'||s.name||'": '||new.title, '/jobs?job='||new.id);
    end if;
  end loop;
  return new;
end $$;
