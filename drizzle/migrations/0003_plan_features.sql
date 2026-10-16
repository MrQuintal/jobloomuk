CREATE OR REPLACE FUNCTION public.plan_tier(_u uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT CASE WHEN price_id LIKE 'business_%' THEN 'business' WHEN price_id LIKE 'pro_%' THEN 'pro' ELSE 'free' END
    FROM subscriptions WHERE user_id=_u AND (
      (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end>now()))
      OR (status='canceled' AND current_period_end>now()))
    ORDER BY (price_id LIKE 'business_%') DESC LIMIT 1),'free')
$$;
CREATE OR REPLACE FUNCTION public.tier_at_least(_u uuid, _t text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE public.plan_tier(_u) WHEN 'business' THEN true WHEN 'pro' THEN _t IN ('pro','free') ELSE _t='free' END
$$;
GRANT EXECUTE ON FUNCTION public.plan_tier(uuid), public.tier_at_least(uuid,text) TO authenticated;

CREATE TABLE public.profile_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), worker_id uuid NOT NULL, kind text NOT NULL CHECK (kind IN ('view','enquiry')), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON public.profile_events(worker_id, created_at);
GRANT INSERT ON public.profile_events TO anon, authenticated; GRANT SELECT ON public.profile_events TO authenticated; GRANT ALL ON public.profile_events TO service_role;
ALTER TABLE public.profile_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone logs events" ON public.profile_events FOR INSERT TO anon, authenticated WITH CHECK (auth.uid() IS DISTINCT FROM worker_id);
CREATE POLICY "pro owners read events" ON public.profile_events FOR SELECT TO authenticated USING (worker_id=auth.uid() AND public.tier_at_least(auth.uid(),'pro'));

CREATE TABLE public.quote_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), worker_id uuid NOT NULL, title text NOT NULL CHECK (length(title) BETWEEN 1 AND 100), body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_templates TO authenticated; GRANT ALL ON public.quote_templates TO service_role;
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own read" ON public.quote_templates FOR SELECT TO authenticated USING (worker_id=auth.uid());
CREATE POLICY "pro write" ON public.quote_templates FOR INSERT TO authenticated WITH CHECK (worker_id=auth.uid() AND public.tier_at_least(auth.uid(),'pro'));
CREATE POLICY "own delete" ON public.quote_templates FOR DELETE TO authenticated USING (worker_id=auth.uid());

CREATE TABLE public.saved_searches (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), worker_id uuid NOT NULL, name text NOT NULL, keyword text, category_id uuid REFERENCES public.categories(id), area text, last_seen_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated; GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own read" ON public.saved_searches FOR SELECT TO authenticated USING (worker_id=auth.uid());
CREATE POLICY "pro write" ON public.saved_searches FOR INSERT TO authenticated WITH CHECK (worker_id=auth.uid() AND public.tier_at_least(auth.uid(),'pro'));
CREATE POLICY "own update" ON public.saved_searches FOR UPDATE TO authenticated USING (worker_id=auth.uid());
CREATE POLICY "own delete" ON public.saved_searches FOR DELETE TO authenticated USING (worker_id=auth.uid());

CREATE TABLE public.lead_stages (conversation_id uuid PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE, worker_id uuid NOT NULL, stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','quoted','booked','completed','lost')), assignee_id uuid, note text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_stages TO authenticated; GRANT ALL ON public.lead_stages TO service_role;
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own read" ON public.lead_stages FOR SELECT TO authenticated USING (worker_id=auth.uid());
CREATE POLICY "business write" ON public.lead_stages FOR INSERT TO authenticated WITH CHECK (worker_id=auth.uid() AND public.tier_at_least(auth.uid(),'business') AND EXISTS (SELECT 1 FROM conversations c WHERE c.id=conversation_id AND c.worker_id=auth.uid()));
CREATE POLICY "business update" ON public.lead_stages FOR UPDATE TO authenticated USING (worker_id=auth.uid() AND public.tier_at_least(auth.uid(),'business'));

CREATE TABLE public.team_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES public.worker_profiles(user_id) ON DELETE CASCADE, name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80), role_title text, team_role text NOT NULL DEFAULT 'member' CHECK (team_role IN ('manager','member')), bio text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.team_members TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated; GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published" ON public.team_members FOR SELECT TO anon, authenticated USING (business_id=auth.uid() OR (public.tier_at_least(business_id,'business') AND EXISTS (SELECT 1 FROM worker_profiles w WHERE w.user_id=business_id AND w.is_published)));
CREATE POLICY "business write" ON public.team_members FOR INSERT TO authenticated WITH CHECK (business_id=auth.uid() AND public.tier_at_least(auth.uid(),'business'));
CREATE POLICY "own delete" ON public.team_members FOR DELETE TO authenticated USING (business_id=auth.uid());
GRANT EXECUTE ON FUNCTION public.tier_at_least(uuid,text) TO anon;

CREATE OR REPLACE FUNCTION public.guard_portfolio_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF public.plan_tier(NEW.worker_id)='free' AND (SELECT count(*) FROM portfolio_projects WHERE worker_id=NEW.worker_id) >= 3 THEN
    RAISE EXCEPTION 'Free plan allows 3 portfolio projects. Upgrade to Pro for unlimited projects.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER portfolio_limit BEFORE INSERT ON public.portfolio_projects FOR EACH ROW EXECUTE FUNCTION public.guard_portfolio_limit();