-- Allow ambassadors to update their own uploads (to add more PDFs)
CREATE POLICY "Users can update own uploads"
ON public.course_uploads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);