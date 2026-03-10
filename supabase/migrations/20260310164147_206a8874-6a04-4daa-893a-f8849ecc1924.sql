
-- Allow modifiers to view all course uploads
CREATE POLICY "Modifiers can view all uploads"
ON public.course_uploads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'modifier'));

-- Allow modifiers to update upload status
CREATE POLICY "Modifiers can update uploads"
ON public.course_uploads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'modifier'));

-- Allow modifiers to view all courses (already public, but for completeness)
-- Allow modifiers to manage course_questions
CREATE POLICY "Modifiers can insert questions"
ON public.course_questions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'modifier'));

CREATE POLICY "Modifiers can update questions"
ON public.course_questions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'modifier'));

CREATE POLICY "Modifiers can view all questions"
ON public.course_questions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'modifier'));
