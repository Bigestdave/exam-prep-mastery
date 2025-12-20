import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePaystackPayment } from "react-paystack";
import { Header } from "@/components/Header";
import { QuestionItem } from "@/components/QuestionItem";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useCourseQuestions } from "@/hooks/useCourseQuestions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Lock, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAYSTACK_PUBLIC_KEY = "pk_live_2320cc6bb508955bd07391f75a4c73d757a0d6f6";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isLoading, purchases, addPurchase } = useAuth();
  const { getCourseById, isLoading: coursesLoading } = useCourses();
  const { questions, isLoading: questionsLoading } = useCourseQuestions(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  const course = id ? getCourseById(id) : undefined;
  const isOwned = id ? purchases.includes(id) : false;

  // Fetch total question count for display (admin can see all)
  useEffect(() => {
    const fetchQuestionCount = async () => {
      if (!id) return;
      
      const { count, error } = await supabase
        .from('course_questions')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', id);
      
      if (!error && count !== null) {
        setQuestionCount(count);
      }
    };

    // If user owns course, use questions length, otherwise fetch count as admin
    if (isOwned) {
      setQuestionCount(questions.length);
    } else {
      // For non-owners, we need to get the count differently since RLS limits what they see
      fetchQuestionCount();
    }
  }, [id, isOwned, questions.length]);

  const config = {
    reference: `${course?.id}_${Date.now()}`,
    email: user?.email || "",
    amount: (course?.price || 0) * 100,
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      course_id: course?.id || "",
      course_code: course?.code || "",
      custom_fields: [
        {
          display_name: "Course",
          variable_name: "course",
          value: course?.title || "",
        },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header isLoggedIn userName={profile?.full_name || ''} />
        <main className="container py-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Course not found</h1>
          <Link to="/dashboard" className="text-primary hover:underline mt-4 inline-block">
            Go back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const onSuccess = () => {
    addPurchase(course.id);
    setShowPaymentModal(false);
    toast({
      title: "Payment successful! 🎉",
      description: `You now have full access to ${course.code}.`,
    });
  };

  const onClose = () => {
    toast({
      title: "Payment cancelled",
      description: "You can try again when you're ready.",
      variant: "destructive",
    });
  };

  const handlePayment = () => {
    setShowPaymentModal(false);
    initializePayment({ onSuccess, onClose });
  };

  // Determine display count - if not owned, show at least 1 for free preview
  const displayCount = isOwned ? questions.length : Math.max(questionCount, questions.length);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to courses
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
              {course.code}
            </span>
            {isOwned && (
              <span className="text-sm font-medium text-success bg-success-light px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Full Access
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {course.title}
          </h1>
          <p className="text-muted-foreground">
            {displayCount} Tutorial Questions • {course.faculty} • {course.level}
          </p>
        </div>

        {questionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show available questions (RLS filtered) */}
            {questions.map((q) => (
              <QuestionItem
                key={q.id}
                courseId={course.id}
                questionIndex={q.question_index}
                question={q.question_text}
                isUnlocked={isOwned}
                isFreePreview={q.question_index === 0}
                onLockedClick={() => setShowPaymentModal(true)}
              />
            ))}
            
            {/* Show locked placeholders for remaining questions */}
            {!isOwned && displayCount > questions.length && (
              Array.from({ length: displayCount - questions.length }).map((_, i) => (
                <div 
                  key={`locked-${i}`}
                  className="bg-card rounded-xl p-4 border border-border/50 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Question {questions.length + i + 1} - Unlock to view</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Mobile Sticky Footer */}
      {!isOwned && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 p-4 shadow-elevated z-50">
          <Button 
            className="w-full h-12 shadow-glow" 
            onClick={() => setShowPaymentModal(true)}
          >
            <Lock className="w-4 h-4" />
            Unlock Full Access • ₦{course.price.toLocaleString()}
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock {course.code}</DialogTitle>
            <DialogDescription>
              Get instant access to all {displayCount} tutorial answers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-secondary rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium text-foreground">{course.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-lg text-foreground">₦{course.price.toLocaleString()}</span>
              </div>
            </div>

            <Button 
              className="w-full h-12" 
              onClick={handlePayment}
            >
              Pay ₦{course.price.toLocaleString()}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-3">
              Secured by Paystack
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
