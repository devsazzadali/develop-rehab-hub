
-- Payment methods (admin-configurable: bKash, Nagad, Rocket, Bank)
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mobile',
  account_number TEXT NOT NULL DEFAULT '',
  account_name TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'personal',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods FOR SELECT
USING (true);

CREATE POLICY "Admins manage payment methods"
ON public.payment_methods FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payment submissions (TRX from customer)
CREATE TABLE public.payment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.consultation_packages(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  payment_method_name TEXT NOT NULL DEFAULT '',
  package_name TEXT NOT NULL DEFAULT '',
  amount TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  sender_number TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_submissions_status ON public.payment_submissions(status);
CREATE INDEX idx_payment_submissions_created ON public.payment_submissions(created_at DESC);

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit payment"
ON public.payment_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins view payment submissions"
ON public.payment_submissions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update payment submissions"
ON public.payment_submissions FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete payment submissions"
ON public.payment_submissions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_submissions_updated_at
BEFORE UPDATE ON public.payment_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default payment methods
INSERT INTO public.payment_methods (name, type, account_number, account_name, instructions, account_type, sort_order) VALUES
('bKash', 'mobile', '01700000000', 'Develop Care', 'Send Money করে TRX ID দিন', 'personal', 1),
('Nagad', 'mobile', '01700000000', 'Develop Care', 'Send Money করে TRX ID দিন', 'personal', 2),
('Rocket', 'mobile', '01700000000-1', 'Develop Care', 'Send Money করে TRX ID দিন', 'personal', 3),
('Bank Transfer', 'bank', 'A/C: 0000000000000', 'Develop Care, Dutch Bangla Bank', 'ব্যাংক ট্রান্সফার করে রেফারেন্স নাম্বার দিন', 'business', 4);

-- Site settings for payment page content
INSERT INTO public.site_settings (key, value) VALUES
('payment_page_title', 'পেমেন্ট সম্পূর্ণ করুন'),
('payment_page_subtitle', 'নিচের যেকোনো মাধ্যমে পেমেন্ট করে TRX ID সাবমিট করুন। আমরা কনফার্ম করার পর সার্ভিস শুরু হবে।'),
('payment_success_message', 'পেমেন্ট সাবমিট হয়েছে! আমরা কনফার্ম করে আপনাকে জানাবো ইনশাআল্লাহ।')
ON CONFLICT (key) DO NOTHING;
