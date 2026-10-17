-- The business records what was agreed for a visit. Jobloom does not collect it.

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS amount_pence integer
  CHECK (amount_pence IS NULL OR amount_pence BETWEEN 1 AND 100000000);

CREATE OR REPLACE FUNCTION public.guard_booking_amount() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.amount_pence IS NOT DISTINCT FROM OLD.amount_pence THEN
    RETURN NEW;
  END IF;
  IF NEW.amount_pence IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = NEW.conversation_id
      AND c.worker_id = auth.uid()
      AND public.tier_at_least(auth.uid(), 'business')
  ) THEN
    RAISE EXCEPTION 'Only the business records the agreed amount';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS booking_amount ON public.booking_requests;
CREATE TRIGGER booking_amount BEFORE INSERT OR UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_booking_amount();

NOTIFY pgrst, 'reload schema';
