import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, ChevronRight, CheckCircle2, X } from 'lucide-react';

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
    options: ['Weeks before exam', '2–3 days before', 'Night before', 'Morning of the exam'],
  },
  {
    key: 'q3_question_overlap',
    title: 'Did any tutorial questions resemble what came out in your exam?',
    options: ['Yes, very similar', 'Somewhat related', 'Not really', "I haven't written the exam yet"],
  },
  {
    key: 'q4_hesitation',
    title: 'If you hesitated before buying, why?',
    options: ['Not sure it would help', 'Price', 'Wanted to ask friends first', "Didn't feel urgent yet", "I didn't hesitate"],
  },
  {
    key: 'q5_return_intent',
    title: 'Would you use LCU Prep again next semester?',
    options: ['Definitely', 'Maybe', 'Only if it improves', 'No'],
  },
] as const;

export function SurveyDialog() {
  const { user, purchases } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [checked, setChecked] = useState(false);

  // Check if user has purchases and hasn't completed survey
  useEffect(() => {
    if (!user || purchases.length === 0) return;

    const checkSurvey = async () => {
      const { data } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) {
        // No survey completed — show it
        setOpen(true);
      }
      setChecked(true);
    };

    checkSurvey();
  }, [user, purchases]);

  if (!checked || purchases.length === 0) return null;

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const canProceed = !!answers[current?.key];

  const handleNext = async () => {
    if (!canProceed) return;

    if (isLast) {
      setSubmitting(true);
      const { error } = await supabase.from('survey_responses').insert({
        user_id: user!.id,
        q1_buy_reason: answers.q1_buy_reason,
        q2_buy_timing: answers.q2_buy_timing,
        q3_question_overlap: answers.q3_question_overlap,
        q4_hesitation: answers.q4_hesitation,
        q5_return_intent: answers.q5_return_intent,
      });
      setSubmitting(false);

      if (error) {
        if (error.code === '23505') {
          toast({ title: "You've already submitted this survey!" });
          setOpen(false);
        } else {
          toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' });
        }
        return;
      }
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleDismiss = () => {
    // Just close for this session — will show again next login
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="text-center space-y-4 py-6">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Thank you! 🙏</h2>
            <p className="text-muted-foreground text-sm">
              Your feedback will directly shape the next update.
            </p>
            <p className="text-xs text-muted-foreground">
              3 random respondents get <strong>free access to 2 courses</strong> next semester.
            </p>
            <Button onClick={() => setOpen(false)} size="lg">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Search className="h-3.5 w-3.5" />
                <span>After-Exam Feedback (Be Honest)</span>
              </div>
              <DialogTitle className="text-lg">
                {step + 1}. {current.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Takes 45 seconds · 3 random people get free access to 2 courses next semester
              </DialogDescription>
            </DialogHeader>

            {/* Progress */}
            <div className="flex gap-1.5">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Options */}
            <RadioGroup
              value={answers[current.key] || ''}
              onValueChange={(val) => setAnswers(prev => ({ ...prev, [current.key]: val }))}
              className="space-y-2"
            >
              {current.options.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    answers[current.key] === option
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <RadioGroupItem value={option} id={`survey-${option}`} />
                  <Label htmlFor={`survey-${option}`} className="cursor-pointer flex-1 text-sm font-normal">
                    {option}
                  </Label>
                </label>
              ))}
            </RadioGroup>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed || submitting}
                size="sm"
                className="gap-1"
              >
                {submitting ? 'Submitting...' : isLast ? 'Submit' : 'Next'}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
