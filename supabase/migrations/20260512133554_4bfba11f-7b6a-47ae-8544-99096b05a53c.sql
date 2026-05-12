
-- Ensure one schedule per payment submission
ALTER TABLE public.consultation_schedules
  ADD CONSTRAINT consultation_schedules_payment_unique UNIQUE (payment_submission_id);

-- Allow customers to read taken slots (so the booking UI can hide them).
-- We expose only scheduled_at + duration via a SECURITY DEFINER function below,
-- so we DON'T add a broad SELECT policy.

-- SECURITY DEFINER: returns booked slot starts for a given date (UTC date)
CREATE OR REPLACE FUNCTION public.get_booked_slots(_date date)
RETURNS TABLE(scheduled_at timestamptz, duration_minutes integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT scheduled_at, duration_minutes
  FROM public.consultation_schedules
  WHERE status <> 'cancelled'
    AND scheduled_at >= _date::timestamptz
    AND scheduled_at < (_date + INTERVAL '1 day')::timestamptz;
$$;

GRANT EXECUTE ON FUNCTION public.get_booked_slots(date) TO anon, authenticated;

-- SECURITY DEFINER: customer self-books a slot for their confirmed payment
CREATE OR REPLACE FUNCTION public.book_consultation_slot(
  _payment_submission_id uuid,
  _scheduled_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_pay  record;
  v_dow  int;
  v_hour int;
  v_min  int;
  v_id   uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_pay FROM public.payment_submissions WHERE id = _payment_submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_pay.user_id IS DISTINCT FROM v_user THEN
    RAISE EXCEPTION 'not_owner' USING ERRCODE = '42501';
  END IF;
  IF v_pay.status <> 'confirmed' THEN
    RAISE EXCEPTION 'payment_not_confirmed' USING ERRCODE = '22023';
  END IF;

  -- Future only, at least 2 hours ahead
  IF _scheduled_at < (now() + INTERVAL '2 hours') THEN
    RAISE EXCEPTION 'slot_too_soon' USING ERRCODE = '22023';
  END IF;

  -- Business hours: Sat(6)..Thu(4) — Friday(5) off; 10:00..19:30; 30-min aligned
  v_dow  := EXTRACT(DOW FROM _scheduled_at AT TIME ZONE 'Asia/Dhaka')::int;
  v_hour := EXTRACT(HOUR FROM _scheduled_at AT TIME ZONE 'Asia/Dhaka')::int;
  v_min  := EXTRACT(MINUTE FROM _scheduled_at AT TIME ZONE 'Asia/Dhaka')::int;

  IF v_dow = 5 THEN
    RAISE EXCEPTION 'friday_closed' USING ERRCODE = '22023';
  END IF;
  IF v_hour < 10 OR v_hour > 19 OR (v_hour = 19 AND v_min > 30) THEN
    RAISE EXCEPTION 'outside_hours' USING ERRCODE = '22023';
  END IF;
  IF v_min NOT IN (0, 30) THEN
    RAISE EXCEPTION 'invalid_slot' USING ERRCODE = '22023';
  END IF;

  -- One booking per payment
  IF EXISTS (SELECT 1 FROM public.consultation_schedules WHERE payment_submission_id = _payment_submission_id) THEN
    RAISE EXCEPTION 'already_booked' USING ERRCODE = '23505';
  END IF;

  -- No double booking
  IF EXISTS (
    SELECT 1 FROM public.consultation_schedules
    WHERE status <> 'cancelled' AND scheduled_at = _scheduled_at
  ) THEN
    RAISE EXCEPTION 'slot_taken' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.consultation_schedules (
    payment_submission_id, user_id, customer_name, customer_phone, customer_email,
    scheduled_at, duration_minutes, meet_link, status, created_by
  ) VALUES (
    _payment_submission_id, v_user, v_pay.customer_name, v_pay.customer_phone, v_pay.customer_email,
    _scheduled_at, 30, '', 'scheduled', v_user
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_consultation_slot(uuid, timestamptz) TO authenticated;

-- Backfill: link existing payment_submissions.user_id from email if missing (safe no-op otherwise)
