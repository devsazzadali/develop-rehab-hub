
-- Limit SECURITY DEFINER function execution grants to only what the app needs
REVOKE EXECUTE ON FUNCTION public.book_consultation_slot(uuid, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.book_consultation_slot(uuid, timestamptz) TO authenticated;

-- Slot availability intentionally remains public but returns only scheduled_at + duration_minutes.
-- Re-affirm explicit grants so there is no broad table exposure.
GRANT EXECUTE ON FUNCTION public.get_booked_slots(date) TO anon, authenticated;
