import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useCourseQuestions } from "@/hooks/useCourseQuestions";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnswerView() {
  const { id, questionId } = useParams<{ id: string; questionId: string }>();
  const { user, profile, isLoading, purchases } = useAuth();
  const { getCourseById, isLoading: coursesLoading } = useCourses();
  const { questions, isLoading: questionsLoading, getQuestionByIndex } = useCourseQuestions(id);
  const navigate = useNavigate();

  const course = id ? getCourseById(id) : undefined;
  const questionIndex = questionId ? parseInt(questionId) : 0;
  const isOwned = id ? purchases.includes(id) : false;
  const isFreePreview = questionIndex === 0;
  const question = getQuestionByIndex(questionIndex);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !questionsLoading && user && course && !isOwned && !isFreePreview) {
      navigate(`/course/${id}`);
    }
  }, [isLoading, questionsLoading, user, course, isOwned, isFreePreview, id, navigate]);

  if (isLoading || coursesLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 max-w-3xl">
          <Skeleton className="h-4 w-28 mb-6" />
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg shadow-slate-200/50 border border-slate-100 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-full mb-3" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          <div className="flex items-center justify-between pb-20">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!user || !course || !question) return null;

  // --- RENDER ANSWER TEXT ---
  const renderAnswer = (text: string) => {
    const parts = text.split(/(?=### )/g);
    
    return parts.map((part, i) => {
      const trimmed = part.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('### ')) {
        const [title, ...body] = trimmed.replace('### ', '').split('\n');
        return (
          <div key={i} className="mb-8 pl-4 border-l-2 border-primary/20 relative">
             <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded mb-2 inline-block">
               {title}
             </span>
             <div className="text-slate-600 leading-relaxed font-serif text-lg whitespace-pre-wrap">
               {body.join('\n').trim()}
             </div>
          </div>
        );
      }
      return <div key={i} className="text-slate-600 leading-relaxed font-serif text-lg mb-6 whitespace-pre-wrap">{trimmed}</div>;
    });
  };

  // --- WATERMARK COMPONENT (Inside file for simplicity) ---
  const WatermarkOverlay = () => (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
      <div className="grid grid-cols-2 gap-20 opacity-10 rotate-[-30deg] scale-150">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="text-xl font-black text-slate-900 whitespace-nowrap select-none">
            {profile?.full_name?.toUpperCase() || user.email}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    // FIX: overflow-hidden prevents the page from zooming out due to watermark
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden page-enter">
      
      {/* THE NEW WATERMARK */}
      {user && <WatermarkOverlay />}
      
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 px-4 max-w-3xl relative z-10">
        <Link to={`/course/${id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 mb-6 font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {course.code}
        </Link>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg shadow-slate-200/50 border border-slate-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question {questionIndex + 1}</span>
            {isFreePreview && !isOwned && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">FREE PREVIEW</span>}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] leading-snug mb-8 font-serif">
            {question.question_text}
          </h1>

          <div className="prose-content relative">
            {renderAnswer(question.answer_text)}
          </div>
        </div>

        {/* REMOVED EXAM TIP CARD HERE */}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pb-20">
          <Link to={questionIndex > 0 ? `/course/${id}/answer/${questionIndex - 1}` : '#'}>
             <Button variant="outline" disabled={questionIndex === 0} className="gap-2 rounded-xl bg-white">
               <ChevronLeft className="w-4 h-4" /> Previous
             </Button>
          </Link>

          <Link to={hasNext(questionIndex, questions.length) ? `/course/${id}/answer/${questionIndex + 1}` : '#'}>
            {/* Logic to show Unlock or Next */}
             <NextButton 
               hasNext={hasNext(questionIndex, questions.length)} 
               isOwned={isOwned} 
               id={id} 
             />
          </Link>
        </div>
      </main>
    </div>
  );
}

// Helper to clean up render logic
function hasNext(current: number, total: number) {
  return current < total - 1;
}

function NextButton({ hasNext, isOwned, id }: { hasNext: boolean, isOwned: boolean, id: string }) {
  if (hasNext && isOwned) {
    return (
      <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white font-bold">
        Next Question <ChevronRight className="w-4 h-4" />
      </Button>
    );
  } else if (hasNext && !isOwned) {
    // If they don't own it, send them back to course page to buy
    return (
       <Link to={`/course/${id}`}>
         <Button className="gap-2 rounded-xl bg-slate-900 text-white font-bold">
           Unlock Full Course <ChevronRight className="w-4 h-4" />
         </Button>
       </Link>
    );
  } else {
    // End of questions
    return (
      <Link to={`/course/${id}`}>
        <Button variant="outline" className="gap-2 rounded-xl">
          Back to List
        </Button>
      </Link>
    );
  }
}
