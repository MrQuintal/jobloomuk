-- Either person in the conversation can cancel a waiting or agreed visit. Both are notified. A finished job stays as it is.

CREATE OR REPLACE FUNCTION public.guard_booking_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  convo public.conversations;
BEGIN
  IF NEW.starts_at <> OLD.starts_at OR NEW.requested_by <> OLD.requested_by OR NEW.conversation_id <> OLD.conversation_id THEN
    RAISE EXCEPTION 'cannot change booking details';
  END IF;
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status IN ('accepted', 'declined') THEN
    IF OLD.status <> 'requested' THEN
      RAISE EXCEPTION 'booking already decided';
    END IF;
    IF auth.uid() = OLD.requested_by THEN
      RAISE EXCEPTION 'the other party must respond';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status IN ('requested', 'accepted') THEN
    SELECT * INTO convo FROM public.conversations WHERE id = OLD.conversation_id;
    IF convo.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'this job is finished';
    END IF;
    IF auth.uid() IS DISTINCT FROM convo.customer_id AND auth.uid() IS DISTINCT FROM convo.worker_id THEN
      RAISE EXCEPTION 'only the people in this conversation can cancel';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'booking already decided';
END $$;

CREATE OR REPLACE FUNCTION public.trg_notify_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  convo public.conversations;
  other uuid;
  notice text;
BEGIN
  SELECT * INTO convo FROM public.conversations WHERE id = NEW.conversation_id;
  IF TG_OP = 'INSERT' THEN
    other := CASE WHEN NEW.requested_by = convo.customer_id THEN convo.worker_id ELSE convo.customer_id END;
    PERFORM public.notify(other, 'New visit request', '/messages/' || convo.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'cancelled' THEN
    notice := 'Visit cancelled for ' || to_char(NEW.starts_at AT TIME ZONE 'Europe/London', 'Dy DD Mon YYYY, HH24:MI');
    PERFORM public.notify(convo.customer_id, notice, '/messages/' || convo.id);
    PERFORM public.notify(convo.worker_id, notice, '/messages/' || convo.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    other := CASE WHEN auth.uid() = convo.customer_id THEN convo.worker_id ELSE convo.customer_id END;
    PERFORM public.notify(other, 'Visit ' || NEW.status, '/messages/' || convo.id);
  END IF;
  RETURN NEW;
END $$;
