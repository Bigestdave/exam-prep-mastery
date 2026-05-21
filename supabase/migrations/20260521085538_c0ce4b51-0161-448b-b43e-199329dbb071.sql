-- 1. Remove client-side INSERT policy on purchases (only server-side via service role should insert)
DROP POLICY IF EXISTS "Allow students to save purchases" ON public.purchases;

-- 2. Remove public read access on department_milestones (sensitive bonus data)
DROP POLICY IF EXISTS "Anyone can view milestones" ON public.department_milestones;

-- 3. Tighten storage INSERT policy: enforce path contains user's own ID
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;

CREATE POLICY "Authenticated users can upload PDFs to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course_materials'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- Also tighten UPDATE WITH CHECK to prevent moving file out of own folder
DROP POLICY IF EXISTS "Authenticated users can update own uploads" ON storage.objects;

CREATE POLICY "Authenticated users can update own uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course_materials'
  AND (storage.foldername(name))[2] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'course_materials'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);