import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Watermark } from "@/components/Watermark";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useCourseQuestions } from "@/hooks/useCourseQuestions";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Lightbulb } from "lucide-react";

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
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user || !course || !question) return null;

  // --- PREMIUM TEXT RENDERER ---
  const renderAnswer = (text: string) => {
    // Split by the "### " headers from your AI
    const parts = text.split(/(?=### )/g);
    
    return parts.map((part, i) => {
      const trimmed = part.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('### ')) {
        const [title, ...body] = trimmed.replace('### ', '').split('\n');
        return (
          <div key={i} className="mb-8 pl-4 border-l-2 border-primary/20 relative">
             {/* Pink/Blue Step Badge */}
             <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded mb-2 inline-block">
               {title}
             </span>
             {/* The Text Content */}
             <div className="text-slate-600 leading-relaxed font-serif text-lg whitespace-pre-wrap">
               {body.join('\n').trim()}
             </div>
          </div>
        );
      }
      // Fallback for intro text (no header)
      return <div key={i} className="text-slate-600 leading-relaxed font-serif text-lg mb-6 whitespace-pre-wrap">{trimmed}</div>;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative page-enter">
      {user && <Watermark name={profile?.full_name || ''} email={user.email || ''} />}
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

          <div className="prose-content">
            {renderAnswer(question.answer_text)}
          </div>
        </div>

        {/* Bonus Exam Tip Card */}
        <div className="bg-[#0F172A] rounded-2xl p-6 text-white shadow-xl flex gap-4 items-start mb-8">
          <div className="p-2 bg-white/10 rounded-lg"><Lightbulb className="w-5 h-5 text-yellow-400" /></div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-1">Exam Tip</h4>
            <p className="text-sm font-medium text-slate-200">
              Lecturers often look for the definition in the first sentence. Make sure your first point is strong!
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pb-20">
          <Link to={questionIndex > 0 ? `/course/${id}/answer/${questionIndex - 1}` : '#'}>
             <Button variant="outline" disabled={questionIndex === 0} className="gap-2 rounded-xl bg-white">
               <ChevronLeft className="w-4 h-4" /> Previous
             </Button>
          </Link>

          <Link to={`/course/${id}/answer/${questionIndex + 1}`}>
             <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white font-bold">
               Next Question <ChevronRight className="w-4 h-4" />
             </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
