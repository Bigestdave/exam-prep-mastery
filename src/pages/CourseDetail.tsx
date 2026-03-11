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
import { ArrowLeft, Lock, CheckCircle, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuizCTA } from "@/components/quiz/QuizCTA";
import { TextShimmer } from "@/components/ui/text-shimmer";

const PAYSTACK_PUBLIC_KEY = "pk_live_2320cc6bb508955bd07391f75a4c73d757a0d6f6";

// ⚡ BUNDLE FEATURE FLAG — set to true to re-enable semester bundle upsell
const ENABLE_BUNDLE_UPSELL = false;

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isLoading, purchases, addPurchase, addPurchases } = useAuth();
  const { getCourseById, courses, isLoading: coursesLoading } = useCourses();
  const { questions, isLoading: questionsLoading } = useCourseQuestions(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'single' | 'bundle'>('single');
  const [questionCount, setQuestionCount] = useState(0);
  const [extraCourseIds, setExtraCourseIds] = useState<string[]>([]);
  const [showMoreCourses, setShowMoreCourses] = useState(false);

  const course = id ? getCourseById(id) : undefined;
  const isOwned = id ? purchases.includes(id) : false;

  // Other unowned courses in same faculty & level (for multi-buy)
  const otherUnownedCourses = courses.filter(c => 
    c.faculty === course?.faculty && 
    c.level === course?.level && 
    c.id !== course?.id &&
    !purchases.includes(c.id)
  );

  // Bundle upsell logic (kept behind flag)
  const unownedCourses = ENABLE_BUNDLE_UPSELL ? courses.filter(c => 
    c.faculty === course?.faculty && 
    c.level === course?.level && 
    !purchases.includes(c.id)
  ) : [];
  const singlePrice = course?.price || 1000;
  const extraTotal = extraCourseIds.reduce((sum, cId) => {
    const c = courses.find(x => x.id === cId);
    return sum + (c?.price || 1000);
  }, 0);
  const bundleTotal = unownedCourses.reduce((sum, c) => sum + c.price, 0);
  const bundleDiscounted = Math.floor(bundleTotal * 0.8);
  const bundleSavings = bundleTotal - bundleDiscounted;
  const activeAmount = paymentOption === 'single' ? (singlePrice + extraTotal) : bundleDiscounted;

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

  const allSelectedIds = extraCourseIds.length > 0 
    ? [course?.id || "", ...extraCourseIds] 
    : (paymentOption === 'bundle' ? unownedCourses.map(c => c.id) : []);
  const isMultiBuy = extraCourseIds.length > 0 || paymentOption === 'bundle';

  const config = {
    reference: `${course?.id}_${Date.now()}`,
    email: user?.email || "",
    amount: activeAmount * 100,
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      course_id: course?.id || "",
      course_code: course?.code || "",
      payment_type: isMultiBuy ? 'bundle' : 'single',
      bundle_course_ids: isMultiBuy ? allSelectedIds : undefined,
      custom_fields: [
        {
          display_name: "Course",
          variable_name: "course",
          value: isMultiBuy
            ? `${allSelectedIds.length} courses`
            : (course?.title || ""),
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
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4">
          <div className="h-4 w-28 bg-muted rounded-lg animate-pulse mb-6"></div>
          <div className="mb-8 space-y-3">
            <TextShimmer as="h1" className="text-xl font-display font-bold" duration={1.2}>Getting things ready</TextShimmer>
            <div className="h-4 w-48 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-full bg-card border border-border rounded-xl animate-pulse shadow-card"></div>
            ))}
          </div>
        </main>
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

  const onSuccess = async (response: { reference: string }) => {
    console.log('Payment completed, reference:', response.reference);
    
    if (isMultiBuy) {
      await addPurchases(allSelectedIds);
      toast({
        title: "All courses unlocked! 🎉",
        description: `You now have access to ${allSelectedIds.length} courses.`,
      });
    } else {
      addPurchase(course.id);
      toast({
        title: "Payment successful! 🎉",
        description: `Your purchase is being processed. Refresh the page if the course doesn't appear in your library.`,
      });
    }
    setShowPaymentModal(false);
    setExtraCourseIds([]);
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

  const openPaymentModal = () => {
    setPaymentOption('single');
    setExtraCourseIds([]);
    setShowMoreCourses(false);
    setShowPaymentModal(true);
  };

  const toggleExtraCourse = (courseId: string) => {
    setExtraCourseIds(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId) 
        : [...prev, courseId]
    );
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

        {/* Quiz CTA - shows for all users; free users get preview, paid users get full quiz */}
        <QuizCTA courseId={course.id} courseCode={course.code} />

        {questionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-full bg-card border border-border rounded-xl animate-pulse shadow-card"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show available questions (RLS filtered) */}
            {questions.map((q, i) => (
              <div 
                key={q.id}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
              >
                <QuestionItem
                  courseId={course.id}
                  questionIndex={q.question_index}
                  question={q.question_text}
                  isUnlocked={isOwned}
                  isFreePreview={q.question_index === 0}
                  onLockedClick={openPaymentModal}
                />
              </div>
            ))}
            
            {/* Show locked placeholders for remaining questions */}
            {!isOwned && displayCount > questions.length && (
              Array.from({ length: displayCount - questions.length }).map((_, i) => (
                <div 
                  key={`locked-${i}`}
                  className="opacity-0 animate-fade-in bg-card rounded-xl p-4 border border-border/50 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ animationDelay: `${(questions.length + i) * 50}ms`, animationFillMode: 'forwards' }}
                  onClick={openPaymentModal}
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
            onClick={openPaymentModal}
          >
            <Lock className="w-4 h-4" />
            Unlock {displayCount} Answers + Quiz • ₦{course.price.toLocaleString()}
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[85vh] flex flex-col">
          <DialogHeader className="p-6 pb-3">
            <DialogTitle className="text-center">
              {`Unlock ${course.code}`}
            </DialogTitle>
            <DialogDescription className="text-center">
              Get instant access to all {displayCount} tutorial answers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4 overflow-y-auto">
            {/* Current course */}
            <div className="p-4 rounded-xl border-2 border-primary bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{course.code}: {course.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{course.faculty} • {course.level}</p>
                </div>
                <p className="font-bold text-foreground">₦{singlePrice.toLocaleString()}</p>
              </div>
            </div>

            {/* Multi-course add-on */}
            {otherUnownedCourses.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowMoreCourses(!showMoreCourses)}
                  className="w-full flex items-center justify-between text-sm font-medium text-primary hover:text-primary/80 transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Want to grab more courses while you're here?
                  </span>
                  <ArrowLeft className={`w-4 h-4 transition-transform ${showMoreCourses ? '-rotate-90' : 'rotate-180'}`} />
                </button>
                
                {showMoreCourses && (
                  <div className="space-y-2 animate-fade-in">
                    {otherUnownedCourses.map(c => {
                      const isSelected = extraCourseIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleExtraCourse(c.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border bg-card hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{c.code}: {c.title}</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground shrink-0">₦{c.price.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Total summary when extra courses selected */}
            {extraCourseIds.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{1 + extraCourseIds.length} courses selected</span>
                  <span className="font-bold text-foreground">₦{activeAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button 
              className="w-full h-12" 
              onClick={handlePayment}
            >
              <Lock className="w-4 h-4" />
              {extraCourseIds.length > 0 
                ? `Unlock ${1 + extraCourseIds.length} Courses • ₦${activeAmount.toLocaleString()}`
                : `Unlock ${displayCount} Answers + Quiz • ₦${activeAmount.toLocaleString()}`
              }
            </Button>
            
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Check className="w-3 h-3 text-success" /> One-time payment • Secured by Paystack
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
