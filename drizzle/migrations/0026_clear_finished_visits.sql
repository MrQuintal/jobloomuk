-- A visit can be cancelled after the job is finished, so the calendar can be cleared. Both people are still notified.

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
    IF auth.uid() IS DISTINCT FROM convo.customer_id AND auth.uid() IS DISTINCT FROM convo.worker_id THEN
      RAISE EXCEPTION 'only the people in this conversation can cancel';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'booking already decided';
END $$;
