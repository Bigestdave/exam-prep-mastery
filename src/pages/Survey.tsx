import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, ChevronRight, CheckCircle2 } from 'lucide-react';

const QUESTIONS = [
  {
    key: 'q1_buy_reason',
    title: 'What made you decide to buy LCU Prep?',
    options: [
      'I believed tutorial questions might repeat',
      'A course rep recommended it',
      'My friends were using it',
      'I panicked close to exam',
      'I just wanted to try it',
    ],
  },
  {
    key: 'q2_buy_timing',
    title: 'When did you buy?',
    options: [
      'Weeks before exam',
      '2–3 days before',
      'Night before',
      'Morning of the exam',
    ],
  },
  {
    key: 'q3_question_overlap',
    title: 'Did any tutorial questions resemble what came out in your exam?',
    options: [
      'Yes, very similar',
      'Somewhat related',
      'Not really',
      "I haven't written the exam yet",
    ],
  },
  {
    key: 'q4_hesitation',
    title: 'If you hesitated before buying, why?',
    options: [
      'Not sure it would help',
      'Price',
      'Wanted to ask friends first',
      "Didn't feel urgent yet",
      "I didn't hesitate",
    ],
  },
  {
    key: 'q5_return_intent',
    title: 'Would you use LCU Prep again next semester?',
    options: [
      'Definitely',
      'Maybe',
      'Only if it improves',
      'No',
    ],
  },
] as const;

export default function Survey() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const canProceed = !!answers[current.key];

  const handleNext = async () => {
    if (!canProceed) return;

    if (isLast) {
      setSubmitting(true);
      const { error } = await supabase.from('survey_responses').insert({
        user_id: user.id,
        q1_buy_reason: answers.q1_buy_reason,
        q2_buy_timing: answers.q2_buy_timing,
        q3_question_overlap: answers.q3_question_overlap,
        q4_hesitation: answers.q4_hesitation,
        q5_return_intent: answers.q5_return_intent,
      });
      setSubmitting(false);

      if (error) {
        if (error.code === '23505') {
          toast({ title: "You've already submitted this survey. Thank you!", variant: 'default' });
        } else {
          toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' });
          return;
        }
      }
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Thank you! 🙏</h1>
          <p className="text-muted-foreground">
            Your feedback will directly shape the next update of LCU Prep.
          </p>
          <p className="text-sm text-muted-foreground">
            3 random respondents will get <strong>free access to 2 courses</strong> next semester.
          </p>
          <Button onClick={() => navigate('/dashboard')} size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Search className="h-4 w-4" />
            <span>After-Exam Feedback (Be Honest)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Takes 45 seconds · Your answers shape the next update · 3 random people get free access to 2 courses next semester
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Question */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            {step + 1}. {current.title}
          </h2>

          <RadioGroup
            value={answers[current.key] || ''}
            onValueChange={(val) => setAnswers(prev => ({ ...prev, [current.key]: val }))}
            className="space-y-3"
          >
            {current.options.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  answers[current.key] === option
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="cursor-pointer flex-1 text-sm font-normal">
                  {option}
                </Label>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className="gap-1"
          >
            {submitting ? 'Submitting...' : isLast ? 'Submit' : 'Next'}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
