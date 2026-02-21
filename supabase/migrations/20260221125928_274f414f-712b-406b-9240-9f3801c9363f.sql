
-- Survey responses table
CREATE TABLE public.survey_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  q1_buy_reason text NOT NULL,
  q2_buy_timing text NOT NULL,
  q3_question_overlap text NOT NULL,
  q4_hesitation text NOT NULL,
  q5_return_intent text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- One response per user
CREATE UNIQUE INDEX idx_survey_responses_user ON public.survey_responses(user_id);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own survey response"
ON public.survey_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own survey response"
ON public.survey_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all survey responses"
ON public.survey_responses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete survey responses"
ON public.survey_responses FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
