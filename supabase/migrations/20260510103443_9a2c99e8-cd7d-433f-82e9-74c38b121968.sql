-- Extend appointments with CRM fields
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS business_category text,
  ADD COLUMN IF NOT EXISTS problem_category text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS meeting_date date,
  ADD COLUMN IF NOT EXISTS meeting_time text,
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS follow_up_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS call_status text NOT NULL DEFAULT 'not_called',
  ADD COLUMN IF NOT EXISTS interest_status text,
  ADD COLUMN IF NOT EXISTS next_followup_date date,
  ADD COLUMN IF NOT EXISTS labels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS admin_notes text;

CREATE INDEX IF NOT EXISTS idx_appointments_meeting_date ON public.appointments(meeting_date);
CREATE INDEX IF NOT EXISTS idx_appointments_next_followup ON public.appointments(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_appointments_problem_category ON public.appointments(problem_category);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Activity / notes log per lead
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_appointment ON public.lead_activities(appointment_id, created_at DESC);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view activities" ON public.lead_activities
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert activities" ON public.lead_activities
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update activities" ON public.lead_activities
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete activities" ON public.lead_activities
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activities;
ALTER TABLE public.lead_activities REPLICA IDENTITY FULL;