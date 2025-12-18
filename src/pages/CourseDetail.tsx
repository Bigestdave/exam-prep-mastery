import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { QuestionItem } from "@/components/QuestionItem";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getCourseById } from "@/data/courses";
import { ArrowLeft, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading, purchases, addPurchase } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const course = id ? getCourseById(id) : undefined;
  const isOwned = id ? purchases.includes(id) : false;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
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
        <Header isLoggedIn userName={user.fullName} />
        <main className="container py-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Course not found</h1>
          <Link to="/dashboard" className="text-primary hover:underline mt-4 inline-block">
            Go back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment - in production, this would use Paystack
    setTimeout(() => {
      addPurchase(course.id);
      setIsProcessing(false);
      setShowPaymentModal(false);
      toast({
        title: "Payment successful!",
        description: `You now have full access to ${course.code}.`,
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header isLoggedIn userName={user.fullName} />
      
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
            {course.questions.length} Tutorial Questions • {course.faculty} • {course.level}
          </p>
        </div>

        <div className="space-y-3">
          {course.questions.map((q, index) => (
            <QuestionItem
              key={index}
              courseId={course.id}
              questionIndex={index}
              question={q.q}
              isUnlocked={isOwned}
              isFreePreview={index === 0}
              onLockedClick={() => setShowPaymentModal(true)}
            />
          ))}
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      {!isOwned && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 md:hidden">
          <Button 
            className="w-full h-12" 
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
              Get instant access to all {course.questions.length} tutorial answers.
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
              disabled={isProcessing}
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                `Pay ₦${course.price.toLocaleString()}`
              )}
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
