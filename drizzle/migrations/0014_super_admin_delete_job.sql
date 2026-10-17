CREATE OR REPLACE FUNCTION public.super_admin_delete_job(_job_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE j public.jobs;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can delete job posts' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO j FROM public.jobs WHERE id = _job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'Job post not found'; END IF;
  IF char_length(coalesce(_reason, '')) > 500 THEN RAISE EXCEPTION 'Reason must be at most 500 characters'; END IF;
  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'delete_job_post', 'job', j.id,
    jsonb_build_object('title', j.title, 'customer_id', j.customer_id, 'reason', nullif(trim(_reason), '')));
  DELETE FROM public.jobs WHERE id = j.id;
END;
$$;
REVOKE ALL ON FUNCTION public.super_admin_delete_job(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.super_admin_delete_job(uuid, text) TO authenticated;
COMMENT ON FUNCTION public.super_admin_delete_job(uuid, text) IS 'Super-admin-only audited post deletion. Existing conversations and messages remain; job responses cascade with the deleted job.';