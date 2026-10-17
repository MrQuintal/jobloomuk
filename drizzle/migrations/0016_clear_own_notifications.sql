-- Owners may empty their own notification list. Messages and jobs stay in place.
grant delete on public.notifications to authenticated;
create policy "delete own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());
