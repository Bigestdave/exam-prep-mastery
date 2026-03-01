import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useCourseQuestions } from "@/hooks/useCourseQuestions";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";

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
  const [paperMode, setPaperMode] = useState(false);
  const [showHint, setShowHint] = useState(() => !localStorage.getItem('lcu_paper_hint_seen'));

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem('lcu_paper_hint_seen', '1');
  };

  const handleToggle = () => {
    setPaperMode(!paperMode);
    if (showHint) dismissHint();
  };

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
      <div className="min-h-screen bg-background">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 max-w-3xl">
          <div className="h-4 w-28 bg-muted rounded-lg animate-pulse mb-6"></div>
          <div className="bg-card rounded-3xl p-6 md:p-10 shadow-card border border-border mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-full bg-secondary rounded-lg animate-pulse mb-3"></div>
            <div className="h-6 w-3/4 bg-muted rounded-lg animate-pulse mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-4/5 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pb-20">
            <div className="h-10 w-28 bg-muted rounded-xl animate-pulse"></div>
            <div className="h-10 w-32 bg-secondary rounded-xl animate-pulse"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!user || !course || !question) return null;

  // --- RENDER ANSWER TEXT ---
  const renderAnswer = (text: string) => {
    // First, split out %%% explanation %%% blocks
    const segments = text.split(/(%%%[\s\S]*?%%%)/g);

    return segments.map((segment, segIdx) => {
      const trimmedSeg = segment.trim();
      if (!trimmedSeg) return null;

      // Check if this is a %%% explanation %%% block
      if (trimmedSeg.startsWith('%%%') && trimmedSeg.endsWith('%%%')) {
        const explanationText = trimmedSeg.slice(3, -3).trim();
        return (
          <div key={`exp-${segIdx}`} className="mb-6 pl-4 border-l-2 border-primary/30 bg-primary/[0.03] rounded-r-xl py-3 pr-4">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 inline-block">
              Why This Is Correct
            </span>
            <p className="text-muted-foreground leading-relaxed font-serif text-base whitespace-pre-wrap">
              {explanationText}
            </p>
          </div>
        );
      }

      // Then handle ### headers within normal text segments
      const parts = trimmedSeg.split(/(?=### )/g);
      return parts.map((part, i) => {
        const trimmed = part.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('### ')) {
          const [title, ...body] = trimmed.replace('### ', '').split('\n');
          return (
            <div key={`${segIdx}-${i}`} className="mb-8 pl-4 border-l-2 border-primary/20 relative">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded mb-2 inline-block">
                {title}
              </span>
              <div className="text-muted-foreground leading-relaxed font-serif text-lg whitespace-pre-wrap">
                {body.join('\n').trim()}
              </div>
            </div>
          );
        }
        return <div key={`${segIdx}-${i}`} className="text-muted-foreground leading-relaxed font-serif text-lg mb-6 whitespace-pre-wrap">{trimmed}</div>;
      });
    });
  };

  // --- WATERMARK COMPONENT (Inside file for simplicity) ---
  const WatermarkOverlay = () => (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
      <div className="grid grid-cols-2 gap-20 rotate-[-30deg] scale-150">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="text-xl font-black whitespace-nowrap select-none" style={{ color: '#F5F2ED' }}>
            {profile?.full_name?.toUpperCase() || user.email}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden page-enter">
      
      {user && <WatermarkOverlay />}
      
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 px-4 max-w-3xl relative z-10">
        <Link to={`/course/${id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {course.code}
        </Link>

        {/* Question Card */}
        <div
          className={`rounded-3xl p-6 md:p-10 shadow-card border mb-8 transition-all duration-500 ease-in-out ${
            paperMode
              ? 'bg-[#FFFBF0] border-[#E8E0D0]'
              : 'bg-card border-border'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-display font-bold uppercase tracking-wider transition-colors duration-500 ${paperMode ? 'text-[#1C1917]/50' : 'text-muted-foreground'}`}>
                Question {questionIndex + 1}
              </span>
              {isFreePreview && !isOwned && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">FREE PREVIEW</span>}
            </div>

            {/* Paper Mode Toggle */}
            <div className="relative">
              <button
                onClick={handleToggle}
                className={`relative flex items-center justify-center w-9 h-9 rounded-xl text-sm font-serif font-bold transition-all duration-300 ${
                  paperMode
                    ? 'bg-foreground text-background shadow-md'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                } ${showHint ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-card' : ''}`}
                title={paperMode ? 'Switch to Default Mode' : 'Switch to Paper Mode'}
              >
                Aa
              </button>

              {/* One-time hint tooltip */}
              {showHint && (
                <div className="absolute right-0 top-full mt-2.5 z-20 w-56 animate-fade-in">
                  <div className="bg-foreground text-background rounded-xl px-4 py-3 text-xs leading-relaxed shadow-elevated relative">
                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-foreground rotate-45 rounded-sm" />
                    <p className="font-medium mb-1">👀 Easy on your eyes</p>
                    <p className="opacity-80">Tap to switch to Paper Mode — a warm, book-like reading experience.</p>
                    <button onClick={dismissHint} className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <h1 className={`text-xl md:text-2xl font-display font-bold leading-snug mb-8 transition-colors duration-500 ${
            paperMode ? 'text-[#1C1917]' : 'text-foreground'
          }`}>
            {question.question_text}
          </h1>

          <div className={`prose-content relative transition-colors duration-500 ${paperMode ? 'paper-mode' : ''}`}>
            {renderAnswer(question.answer_text)}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pb-20">
          <Link to={questionIndex > 0 ? `/course/${id}/answer/${questionIndex - 1}` : '#'}>
             <Button variant="outline" disabled={questionIndex === 0} className="gap-2 rounded-xl">
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
      <Button className="gap-2 rounded-xl shadow-glow font-display font-bold">
        Next Question <ChevronRight className="w-4 h-4" />
      </Button>
    );
  } else if (hasNext && !isOwned) {
    return (
       <Link to={`/course/${id}`}>
         <Button variant="outline" className="gap-2 rounded-xl font-display font-bold">
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
