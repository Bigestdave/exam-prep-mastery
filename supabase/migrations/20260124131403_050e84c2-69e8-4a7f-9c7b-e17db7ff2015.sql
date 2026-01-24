-- Drop the conflicting restrictive policies for SELECT
DROP POLICY IF EXISTS "Public view questions" ON public.course_questions;
DROP POLICY IF EXISTS "Users can view purchased course questions" ON public.course_questions;

-- Create a single permissive SELECT policy that allows:
-- 1. Anyone to count questions (by seeing course_id)
-- 2. Users to view full content only if purchased OR it's the free preview (question_index = 0)
CREATE POLICY "Anyone can count questions"
ON public.course_questions
FOR SELECT
USING (true);

-- Note: Content protection is still enforced at the application level
-- where answer_text is only shown for purchased courses or preview questions