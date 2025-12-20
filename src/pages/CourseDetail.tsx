import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useCourseQuestions } from "@/hooks/useCourseQuestions";
import { ArrowLeft, Lock, ChevronRight, Loader2, BookOpen, CheckCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

declare const PaystackPop: any;

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isLoading, purchases } = useAuth();
  const { getCourseById, isLoading: coursesLoading } = useCourses();
  const { questions, isLoading: questionsLoading } = useCourseQuestions(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const course = id ? getCourseById(id) : undefined;
  const isOwned = id ? purchases.includes(id) : false;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const handleUnlock = async () => {
    if (typeof PaystackPop === 'undefined') {
        toast({ title: "Connection Error", description: "Please check your internet connection.", variant: "destructive" });
        return;
    }

    if (!user?.email || !course) return;

    try {
        const handler = PaystackPop.setup({
            key: 'pk_live_2320cc6bb508955bd07391f75a4c73d757a0d6f6',
            email: user.email,
            amount: course.price * 100,
            currency: 'NGN',
            callback: async function(response: any) {
                const { error } = await supabase.from('purchases').insert([{ 
                    user_id: user.id, 
                    course_id: course.id 
                }]);
                
                if (!error) {
                    toast({ title: "Success!", description: "Course unlocked." });
                    window.location.reload();
                } else {
                    toast({ title: "Error", description: "Payment successful but database update failed.", variant: "destructive" });
                }
            },
            onClose: function() {
                toast({ title: "Cancelled", description: "Payment was cancelled." });
            }
        });
        handler.openIframe();
    } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Could not initialize payment.", variant: "destructive" });
    }
  };

  if (isLoading || coursesLoading || questionsLoading) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!user || !course) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 animate-fade-in relative">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
         <Link to="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
         </Link>
         <span className="font-bold text-slate-900 text-sm">{course.code}</span>
         <div className="w-8"></div>
      </div>

      <main className="container py-6 px-4 md:px-6 max-w-3xl">
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 mb-8">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end">
                     {isOwned ? (
                         <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                             <CheckCircle className="w-3 h-3" /> OWNED
                         </span>
                     ) : (
                         <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">
                             PREMIUM
                         </span>
                     )}
                </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h1>
            <p className="text-slate-500 text-sm font-medium">{course.faculty} • {course.level}</p>
            
            <div className="mt-6 pt-6 border-t border-slate-50 flex gap-6">
                <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Questions</p>
                    <p className="text-lg font-bold text-slate-900">{questions.length}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Exam Match</p>
                    <p className="text-lg font-bold text-slate-900">100%</p>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider ml-1">Course Content</h3>
            
            {questions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                    No questions uploaded yet.
                </div>
            ) : (
                questions.map((q, index) => {
                    // FIX: Use the array index (0, 1, 2) instead of database ID for logic
                    // This forces the VERY FIRST item to be free, regardless of its DB number.
                    const isFree = index === 0;
                    const isUnlocked = isOwned || isFree;
                    
                    // Display Number: Start at 1, go to 15
                    const displayNumber = index + 1;

                    return (
                        <Link 
                            to={isUnlocked ? `/course/${id}/answer/${index}` : '#'} 
                            key={index}
                            onClick={(e) => { if(!isUnlocked) { e.preventDefault(); handleUnlock(); }}}
                        >
                            <div className={`
                                group relative bg-white p-5 rounded-2xl border transition-all duration-200
                                ${isUnlocked 
                                    ? 'border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer' 
                                    : 'border-transparent bg-slate-50/50 opacity-70 cursor-not-allowed'
                                }
                            `}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`
                                                text-[10px] font-bold px-2 py-0.5 rounded-md
                                                ${isUnlocked ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}
                                            `}>
                                                Question {displayNumber}
                                            </span>
                                            {isFree && !isOwned && (
                                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                    FREE PREVIEW
                                                </span>
                                            )}
                                        </div>
                                        <h4 className={`font-serif text-sm line-clamp-2 ${isUnlocked ? 'text-slate-800' : 'text-slate-400 blur-[1px]'}`}>
                                            {q.question_text}
                                        </h4>
                                    </div>
                                    
                                    <div className="mt-1">
                                        {isUnlocked ? (
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <Lock className="w-5 h-5 text-slate-300" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })
            )}
        </div>
      </main>

      {!isOwned && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
            <div className="max-w-md mx-auto">
                <Button 
                    onClick={handleUnlock}
                    size="lg" 
                    className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl h-14 text-lg shadow-lg shadow-blue-500/20"
                >
                    Unlock Full Access • ₦{course.price.toLocaleString()}
                </Button>
                <p className="text-center text-[10px] text-slate-400 font-medium mt-3 flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3 text-green-500" />
                    100% Money-back guarantee
                </p>
            </div>
        </div>
      )}
    </div>
  );
}
