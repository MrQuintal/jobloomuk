DROP POLICY IF EXISTS "workers respond to open jobs" ON public.job_responses;
CREATE POLICY "members respond to open jobs" ON public.job_responses FOR INSERT TO authenticated
WITH CHECK (worker_id = auth.uid() AND status = 'sent' AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_responses.job_id AND j.status = 'open' AND j.customer_id <> auth.uid()));

CREATE OR REPLACE FUNCTION public.express_interest(_job_id uuid, _body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare j public.jobs; conv uuid; b text := trim(coalesce(_body,''));
begin
  if auth.uid() is null then raise exception 'please log in'; end if;
  select * into j from public.jobs where id = _job_id;
  if j.id is null or j.status <> 'open' then raise exception 'this job is no longer open'; end if;
  if j.customer_id = auth.uid() then raise exception 'you cannot respond to your own job'; end if;
  if char_length(b) < 1 or char_length(b) > 2000 then raise exception 'message must be 1-2000 characters'; end if;
  if not exists (select 1 from public.job_responses where job_id = j.id and worker_id = auth.uid()) then
    insert into public.job_responses(job_id, worker_id, message) values (j.id, auth.uid(), b);
  end if;
  select id into conv from public.conversations where job_id = j.id and worker_id = auth.uid();
  if conv is null then
    insert into public.conversations(job_id, customer_id, worker_id) values (j.id, j.customer_id, auth.uid()) returning id into conv;
  end if;
  insert into public.messages(conversation_id, sender_id, body) values (conv, auth.uid(), b);
  return conv;
end $$;
REVOKE ALL ON FUNCTION public.express_interest(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.express_interest(uuid, text) TO authenticated;