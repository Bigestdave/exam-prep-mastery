-- Create table to store course requests
CREATE TABLE public.course_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  department TEXT NOT NULL,
  course_rep_name TEXT NOT NULL,
  course_rep_phone TEXT NOT NULL,
  extra_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.course_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own course requests
CREATE POLICY "Users can create course requests"
ON public.course_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.course_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.course_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests (e.g., change status)
CREATE POLICY "Admins can update requests"
ON public.course_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
ON public.course_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_course_requests_updated_at
BEFORE UPDATE ON public.course_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();