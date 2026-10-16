DROP POLICY "availability public" ON public.availability_slots;
CREATE POLICY "availability of published pros" ON public.availability_slots FOR SELECT TO anon, authenticated
USING (worker_id = auth.uid() OR EXISTS (SELECT 1 FROM public.worker_profiles w WHERE w.user_id = availability_slots.worker_id AND w.is_published));