## 1. Hero — remove the LCU × LCU Prep partnership block

In `src/components/landing/LandingHero.tsx`, delete the entire "Partnership badge" `motion.div` (lines 88–104) that renders the LCU logo × LCU Prep lockup and the "Built for Lead City University students" mono caption. The header already establishes this, so the block is redundant.

No other hero copy or layout changes.

## 2. Admin premium generator — critical issues found

The new `admin-generate-course` edge function and `FrictionlessBuilderTab` look clean on the surface, but they will fail at runtime against the current Supabase schema and secrets. These need to be fixed before the feature is usable.

### Issue A — Missing secret: `TOKENROUTER_API_KEY`
The function reads `Deno.env.get("TOKENROUTER_API_KEY")` and throws "TOKENROUTER_API_KEY not configured" if absent. The configured secrets list shows only `LOVABLE_API_KEY` (Lovable AI Gateway). Two options:
- **Recommended:** Refactor the function to use the existing **Lovable AI Gateway** (`LOVABLE_API_KEY` + `https://ai.gateway.lovable.dev/v1/chat/completions`) with a Gemini or Claude model already supported there. This matches the project's existing AI pipeline convention.
- Or have the user add a `TOKENROUTER_API_KEY` secret if they truly want TokenRouter.

### Issue B — `question_quizzes` table does not exist
The function inserts into `public.question_quizzes` and `useQuizData` already reads from it, but there is no such table in the schema. Every generation run will fail at the quiz insert step, and the quiz hook silently logs an error and falls back. Need a migration:

```sql
CREATE TABLE public.question_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.course_questions(id) ON DELETE CASCADE,
  quiz_index integer NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation_text text,
  hint_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, quiz_index)
);
ALTER TABLE public.question_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quizzes" ON public.question_quizzes FOR SELECT USING (true);
CREATE POLICY "Admins manage quizzes" ON public.question_quizzes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_question_quizzes_question_id ON public.question_quizzes(question_id);
```

### Issue C — `course_questions` insert references columns that don't exist
The function inserts `explanation_text`, `key_points`, `exam_tip`, `answer_confidence` into `course_questions`, but the current schema only has: `course_id, status, content, quiz_options, structured_content, answer_text, question_text, question_index, id, created_at, updated_at`. The insert will fail with an "unknown column" error.

Two options:
- **Recommended (simpler):** Drop those extra fields from the insert and pack `explanation_text / key_points / exam_tip / answer_confidence` into the existing `content` JSONB blob alongside `quizzes`. No schema change needed.
- Or add the columns via migration if they're meant to be first-class fields.

### Issue D — Quiz fallback verified OK
`useQuizData` is fine: it reads `question_quizzes` first, then falls back to `content.quizzes`, then legacy `quiz_options`. Once Issues B/C are resolved, the data will render correctly.

### Issue E — Minor
- `FrictionlessBuilderTab.tsx` looks correct and matches the function payload contract.
- The function uses `npm:pdf-parse@1.1.1` which historically has had Deno compatibility issues — worth a smoke test with a real PDF after deploy.

## Order of execution (once approved & in build mode)

1. Patch `LandingHero.tsx` to remove the partnership block.
2. Create migration for `question_quizzes` table + RLS.
3. Refactor `admin-generate-course/index.ts` to:
   - Use Lovable AI Gateway + `LOVABLE_API_KEY` (or confirm with user if they prefer TokenRouter).
   - Pack premium answer metadata into the `content` JSONB instead of non-existent columns.
4. Smoke-test the generator via the admin UI with a small raw-text payload.

## Question for you before I build

For the admin generator AI calls, do you want me to:
- **(A)** Switch to Lovable AI Gateway (already configured, free-ish, uses `LOVABLE_API_KEY`), or
- **(B)** Keep TokenRouter and you'll add a `TOKENROUTER_API_KEY` secret?