
-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT,
  problem_type TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link appointments + payment_submissions to user
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Allow users to view their own appointments + payments
CREATE POLICY "Users view own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users view own payments" ON public.payment_submissions
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Storage bucket for payment proofs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload a payment proof
CREATE POLICY "Anyone upload payment proof" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment_proofs');

-- Admins can view all payment proofs
CREATE POLICY "Admins view payment proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment_proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete payment proofs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment_proofs' AND public.has_role(auth.uid(), 'admin'));

-- Enable realtime on payment_submissions
ALTER TABLE public.payment_submissions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_submissions;
