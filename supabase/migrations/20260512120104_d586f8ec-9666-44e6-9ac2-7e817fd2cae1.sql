
DROP POLICY IF EXISTS "Public read reviews bucket" ON storage.objects;
-- public bucket already serves files via public URL; restrict listing to admins
CREATE POLICY "Admins list reviews bucket" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'reviews' AND has_role(auth.uid(), 'admin'::app_role));
