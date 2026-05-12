
-- Reviews table (image + video reviews)
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image','video')),
  media_url TEXT,
  video_id TEXT,
  client_name TEXT NOT NULL DEFAULT '',
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active reviews" ON public.reviews FOR SELECT USING (active = true);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Consultation schedules
CREATE TABLE public.consultation_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_submission_id UUID,
  user_id UUID,
  appointment_id UUID,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT,
  customer_email TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  meet_link TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  admin_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- unique active schedule per slot
CREATE UNIQUE INDEX consultation_schedules_unique_active_slot
  ON public.consultation_schedules (scheduled_at)
  WHERE status = 'scheduled';

ALTER TABLE public.consultation_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own schedules" ON public.consultation_schedules FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Admins view all schedules" ON public.consultation_schedules FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert schedules" ON public.consultation_schedules FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update schedules" ON public.consultation_schedules FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete schedules" ON public.consultation_schedules FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER consultation_schedules_updated_at BEFORE UPDATE ON public.consultation_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.consultation_schedules REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_schedules;

-- Reviews public storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('reviews','reviews', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read reviews bucket" ON storage.objects FOR SELECT
  USING (bucket_id = 'reviews');
CREATE POLICY "Admins upload reviews" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reviews' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update reviews" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reviews' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete reviews" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'reviews' AND has_role(auth.uid(), 'admin'::app_role));
