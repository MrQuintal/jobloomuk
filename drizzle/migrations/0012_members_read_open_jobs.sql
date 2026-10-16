DROP POLICY IF EXISTS "owner reads jobs" ON public.jobs;
CREATE POLICY "owner reads jobs" ON public.jobs FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR is_admin(auth.uid()) OR status = 'open');