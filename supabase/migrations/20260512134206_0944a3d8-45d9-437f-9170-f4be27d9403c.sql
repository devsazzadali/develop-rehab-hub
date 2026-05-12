
-- 1. Backfill profiles for any auth users that don't have one yet
INSERT INTO public.profiles (user_id, name, email, phone)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), ''),
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'phone', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- 2. Backfill payment_submissions.user_id by matching customer_email to a registered user
UPDATE public.payment_submissions ps
SET user_id = u.id
FROM auth.users u
WHERE ps.user_id IS NULL
  AND ps.customer_email IS NOT NULL
  AND lower(ps.customer_email) = lower(u.email);

-- 3. Backfill appointments.user_id similarly (email or phone match)
UPDATE public.appointments a
SET user_id = u.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE a.user_id IS NULL
  AND (
    (a.email IS NOT NULL AND lower(a.email) = lower(u.email))
    OR (p.phone IS NOT NULL AND a.phone = p.phone)
  );
