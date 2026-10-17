-- Business-plan invoices. Jobloom stores the document only; the customer pays the professional directly.

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.worker_profiles(user_id) ON DELETE CASCADE,
  number integer NOT NULL DEFAULT 0,
  customer_name text NOT NULL CHECK (length(btrim(customer_name)) BETWEEN 1 AND 120),
  customer_email text CHECK (customer_email IS NULL OR length(btrim(customer_email)) BETWEEN 3 AND 200),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 4000),
  amount_pence integer NOT NULL CHECK (amount_pence BETWEEN 1 AND 100000000),
  issued_on date NOT NULL DEFAULT CURRENT_DATE,
  business_name text NOT NULL DEFAULT '',
  business_area text,
  business_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, number)
);

CREATE OR REPLACE FUNCTION public.assign_invoice_details() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  profile public.worker_profiles%ROWTYPE;
BEGIN
  IF NOT public.tier_at_least(NEW.worker_id, 'business') THEN
    RAISE EXCEPTION 'Invoices are part of Business';
  END IF;
  SELECT * INTO profile FROM public.worker_profiles WHERE user_id = NEW.worker_id;
  IF profile.user_id IS NULL THEN
    RAISE EXCEPTION 'Save your business profile first';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(NEW.worker_id::text)::bigint);
  NEW.number := COALESCE((SELECT MAX(number) FROM public.invoices WHERE worker_id = NEW.worker_id), 0) + 1;
  NEW.business_name := profile.business_name;
  NEW.business_area := profile.base_area;
  NEW.business_phone := profile.phone;
  NEW.customer_name := btrim(NEW.customer_name);
  NEW.description := btrim(NEW.description);
  IF NEW.customer_email IS NOT NULL THEN
    NEW.customer_email := NULLIF(btrim(NEW.customer_email), '');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER invoices_assign BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.assign_invoice_details();

GRANT SELECT, INSERT, DELETE ON public.invoices TO authenticated;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads invoices" ON public.invoices FOR SELECT TO authenticated
  USING (worker_id = auth.uid());
CREATE POLICY "business creates invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid() AND public.tier_at_least(auth.uid(), 'business'));
CREATE POLICY "owner deletes invoices" ON public.invoices FOR DELETE TO authenticated
  USING (worker_id = auth.uid());

NOTIFY pgrst, 'reload schema';
