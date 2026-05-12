-- Fix: payment_methods public SELECT should filter by active = true
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods
FOR SELECT
TO anon, authenticated
USING (active = true);

-- Fix: revoke EXECUTE from anon on SECURITY DEFINER helper get_booked_slots
REVOKE EXECUTE ON FUNCTION public.get_booked_slots(date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(date) TO authenticated;