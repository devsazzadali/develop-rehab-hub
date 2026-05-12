
-- 1) Restrict public SELECT on consultation_packages and consultation_faqs to active rows only
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.consultation_packages;
CREATE POLICY "Anyone can view active packages"
ON public.consultation_packages
FOR SELECT
USING (active = true);

DROP POLICY IF EXISTS "Anyone can view faqs" ON public.consultation_faqs;
CREATE POLICY "Anyone can view active faqs"
ON public.consultation_faqs
FOR SELECT
USING (active = true);

-- 2) Lock down Realtime channel subscriptions to admins only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can subscribe to realtime" ON realtime.messages;
CREATE POLICY "Admins can subscribe to realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can broadcast realtime" ON realtime.messages;
CREATE POLICY "Admins can broadcast realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
