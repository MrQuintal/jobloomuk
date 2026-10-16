CREATE TABLE public.business_access_grants (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_access_grants TO authenticated;
GRANT ALL ON public.business_access_grants TO service_role;
ALTER TABLE public.business_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or super admin read" ON public.business_access_grants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.admin_set_business_access(_user_id uuid, _grant boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can change Business access' USING ERRCODE = '42501';
  END IF;
  IF _grant AND NOT public.has_role(_user_id, 'worker') THEN
    RAISE EXCEPTION 'Business access can only be granted to a professional';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF _grant THEN
    INSERT INTO public.business_access_grants(user_id, granted_by)
    VALUES (_user_id, auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM public.business_access_grants WHERE user_id = _user_id;
  END IF;
  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), CASE WHEN _grant THEN 'grant_business_access' ELSE 'revoke_business_access' END,
    'profile', _user_id, jsonb_build_object('complimentary', true, 'billing_changed', false));
END $$;
REVOKE ALL ON FUNCTION public.admin_set_business_access(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_business_access(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.plan_tier(_u uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN EXISTS (SELECT 1 FROM public.business_access_grants WHERE user_id = _u)
    THEN 'business'
    ELSE COALESCE((SELECT CASE WHEN price_id LIKE 'business_%' THEN 'business' WHEN price_id LIKE 'pro_%' THEN 'pro' ELSE 'free' END
      FROM public.subscriptions WHERE user_id = _u AND (
        (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now()))
      ORDER BY (price_id LIKE 'business_%') DESC LIMIT 1), 'free') END
$$;
GRANT EXECUTE ON FUNCTION public.plan_tier(uuid) TO authenticated;
COMMENT ON TABLE public.business_access_grants IS 'Complimentary Business feature access; never modifies Stripe subscription or billing state.';