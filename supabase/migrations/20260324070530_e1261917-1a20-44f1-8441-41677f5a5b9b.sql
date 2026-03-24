CREATE POLICY "Authenticated users can update own uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course_materials' AND (storage.foldername(name))[2] = auth.uid()::text)
WITH CHECK (bucket_id = 'course_materials');