REVOKE EXECUTE ON FUNCTION public.book_consultation_slot(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_consultation_slot(uuid, timestamptz) TO authenticated;