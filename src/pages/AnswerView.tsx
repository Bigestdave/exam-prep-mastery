import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useCourseQuestions } from "@/hooks/useCourseQuestions";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useQuizData } from "@/hooks/useQuizData";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

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
  const { hasQuizData } = useQuizData(id);
  const [paperMode, setPaperMode] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleToggle = () => {
    setPaperMode(!paperMode);
  };

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !questionsLoading && user && course && !isOwned && !isFreePreview) {
      navigate(`/course/${id}`);
    }
  }, [isLoading, questionsLoading, user, course, isOwned, isFreePreview, id, navigate]);

  // Tap edges + swipe gestures to navigate
  const goPrev = () => {
    if (questionIndex > 0) navigate(`/course/${id}/answer/${questionIndex - 1}`);
  };
  const goNext = () => {
    if (!isOwned) return; // guard preview
    if (questionIndex < questions.length - 1) navigate(`/course/${id}/answer/${questionIndex + 1}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, questions.length, isOwned, id]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return; // require horizontal swipe
    if (dx < 0) goNext();
    else goPrev();
  };

  if (isLoading || coursesLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 max-w-3xl">
          <TextShimmer className="text-sm font-display font-semibold mb-6" duration={1.2}>Fetching answer</TextShimmer>
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
    if (!text) return null;

    // Split the text into segments by ### headers
    const segments = text.split(/(?=### )/g);

    return segments.map((segment, index) => {
      const trimmed = segment.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('### ')) {
        const lines = trimmed.split('\n');
        const headerLine = lines[0].replace('### ', '').trim();
        const bodyText = lines.slice(1).join('\n').trim();

        const headerUpper = headerLine.toUpperCase();

        if (headerUpper.includes('EXPLANATION') || headerUpper.includes('WHY THIS IS CORRECT')) {
          return (
            <div
              key={index}
              className="mb-12 relative"
            >
              <div className="chapter-mark mb-5">
                <span className="label">EXPLANATION</span>
                <div className="rule"></div>
              </div>
              <div className="prose-content text-foreground/80 leading-relaxed font-serif text-base md:text-lg whitespace-pre-wrap">
                {renderWithMath(bodyText)}
              </div>
            </div>
          );
        } else if (headerUpper.includes('KEY POINTS') || headerUpper.includes('POINTS TO REMEMBER')) {
          return (
            <div
              key={index}
              className="mb-12 relative"
            >
              <div className="chapter-mark mb-5">
                <span className="label">KEY POINTS TO REMEMBER</span>
                <div className="rule"></div>
              </div>
              <div className="prose-content text-foreground/80 leading-relaxed font-serif text-base md:text-lg whitespace-pre-wrap">
                {renderWithMath(bodyText)}
              </div>
            </div>
          );
        } else if (headerUpper.includes('EXAM WRITING TIP') || headerUpper.includes('EXAM TIP')) {
          return (
            <div
              key={index}
              className="mb-12 relative"
            >
              <div className="chapter-mark mb-5">
                <span className="label">EXAM WRITING TIP</span>
                <div className="rule"></div>
              </div>
              <div className="prose-content text-foreground/80 leading-relaxed font-serif text-base md:text-lg whitespace-pre-wrap">
                {renderWithMath(bodyText)}
              </div>
            </div>
          );
        } else {
          // Sub-answer style
          let partLabel = "";
          const matchPart = headerLine.match(/\b(part\s+)?(\d+[a-z]|[a-z])\b/i);
          if (matchPart) {
            partLabel = matchPart[2].toUpperCase();
          }

          return (
            <div
              key={index}
              className="mb-12 p-8 bg-card/40 border border-border/50 rounded-2xl shadow-sm transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5 border-b border-border/40 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest font-display text-muted-foreground">
                  {headerLine}
                </span>
                {partLabel && (
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded-sm">
                    PART {partLabel}
                  </span>
                )}
              </div>
              <div className="text-foreground/90 leading-relaxed font-serif text-base md:text-lg whitespace-pre-wrap">
                {renderWithMath(bodyText)}
              </div>
            </div>
          );
        }
      }

      // Default segment (direct answer before any headers, or legacy text)
      const percentParts = trimmed.split(/(%%%[\s\S]*?%%%)/g);
      return percentParts.map((part, pIdx) => {
        const trimmedPart = part.trim();
        if (!trimmedPart) return null;

        if (trimmedPart.startsWith('%%%') && trimmedPart.endsWith('%%%')) {
          const expText = trimmedPart.slice(3, -3).trim();
          return (
            <div
              key={`exp-${index}-${pIdx}`}
              className="mb-12 relative"
            >
              <div className="chapter-mark mb-5">
                <span className="label">EXPLANATION</span>
                <div className="rule"></div>
              </div>
              <div className="prose-content text-foreground/80 leading-relaxed font-serif text-base md:text-lg whitespace-pre-wrap">
                {renderWithMath(expText)}
              </div>
            </div>
          );
        }

        return (
          <div
            key={`text-${index}-${pIdx}`}
            className="text-foreground/90 leading-relaxed font-serif text-base md:text-lg mb-8 whitespace-pre-wrap px-1"
          >
            {renderWithMath(trimmedPart)}
          </div>
        );
      });
    });
  };

  // --- WATERMARK COMPONENT (Inside file for simplicity) ---
  const WatermarkOverlay = () => (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
      <div className="grid grid-cols-2 gap-20 rotate-[-30deg] scale-150 opacity-[0.025]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="text-xl font-black text-foreground whitespace-nowrap select-none">
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
      
      <main
        className="container py-8 px-4 max-w-3xl relative z-10"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Persistent Header Navigation */}
        <div className="flex items-center justify-between mb-4 px-1">
          <Link to={`/course/${id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to {course.code}
          </Link>

          <div className="flex items-center gap-4 bg-secondary/40 border border-border/40 px-3 py-1.5 rounded-full shadow-sm">
            {questionIndex > 0 ? (
              <button
                onClick={goPrev}
                className="flex items-center gap-0.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Q{questionIndex}
              </button>
            ) : (
              <span className="w-8" />
            )}

            <span className="text-[10px] font-display font-black uppercase tracking-widest text-muted-foreground select-none">
              Q{questionIndex + 1} OF {questions.length}
            </span>

            {hasNext(questionIndex, questions.length) && isOwned ? (
              <button
                onClick={goNext}
                className="flex items-center gap-0.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Q{questionIndex + 2} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="w-8" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[#6C63FF] transition-all duration-500 ease-out"
            style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

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
              {isFreePreview && !isOwned && <span className="text-[10px] font-bold text-[#6C63FF] bg-[#6C63FF]/10 px-2.5 py-0.5 rounded-full font-display">FREE PREVIEW</span>}
            </div>

            {/* Paper Mode Toggle */}
            <div className="relative">
              <button
                onClick={handleToggle}
                className={`relative flex items-center justify-center w-9 h-9 rounded-xl text-sm font-serif font-bold transition-all duration-300 ${
                  paperMode
                    ? 'bg-foreground text-background shadow-md'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
                title={paperMode ? 'Switch to Default Mode' : 'Switch to Paper Mode'}
              >
                Aa
              </button>
            </div>
          </div>

          {/* Visually Boxed Question */}
          <div className={`mb-8 p-6 rounded-xl border-l-4 transition-colors duration-500 ${
            paperMode
              ? 'bg-[#FDF6E3] border-[#1a1a2e] text-[#1C1917]'
              : 'bg-[#FFF8F0] border-[#1a1a2e] text-[#1D1B18]'
          }`}>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block font-display">
              THE QUESTION
            </span>
            <h1 className="text-lg md:text-xl font-display font-bold leading-snug">
              {renderWithMath(question.question_text)}
            </h1>
          </div>

          <div className={`prose-content relative transition-colors duration-500 ${paperMode ? 'paper-mode' : ''}`}>
            {renderAnswer(question.answer_text)}
          </div>
        </div>

        {/* WhatsApp-story style tap zones */}
        <button
          aria-label="Previous question"
          onClick={goPrev}
          disabled={questionIndex === 0}
          className="fixed left-0 top-44 bottom-0 w-[22vw] z-10 md:hidden disabled:opacity-0 bg-transparent"
        />
        <button
          aria-label="Next question"
          onClick={goNext}
          disabled={!isOwned || questionIndex >= questions.length - 1}
          className="fixed right-0 top-44 bottom-0 w-[22vw] z-10 md:hidden disabled:opacity-0 bg-transparent"
        />
        {/* Footer Navigation Group */}
        <div className="flex items-center justify-between pb-20 mt-8 pt-8 border-t border-border/40 px-1">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={questionIndex === 0}
            className="gap-2 rounded-xl font-display font-bold border-border hover:bg-secondary/40 transition-all h-10 px-4"
          >
            <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest select-none bg-secondary/50 px-3 py-1.5 rounded-full border border-border/20">
            {questionIndex + 1} / {questions.length}
          </div>

          <NextButton 
            hasNext={hasNext(questionIndex, questions.length)} 
            isOwned={isOwned} 
            id={id!}
            hasQuiz={hasQuizData}
            onClick={goNext}
          />
        </div>
      </main>
    </div>
  );
}

// Render text with inline $...$ and block $$...$$ math via KaTeX.
function renderWithMath(text: string): React.ReactNode {
  if (!text) return text;
  // Split on $$...$$ first, then $...$
  const blockParts = text.split(/(\$\$[\s\S]+?\$\$)/g);
  return blockParts.map((bp, bi) => {
    if (bp.startsWith("$$") && bp.endsWith("$$")) {
      const tex = bp.slice(2, -2).trim();
      try { return <BlockMath key={`b${bi}`} math={tex} />; } catch { return bp; }
    }
    const inlineParts = bp.split(/(\$[^$\n]+?\$)/g);
    return inlineParts.map((ip, ii) => {
      if (ip.startsWith("$") && ip.endsWith("$") && ip.length > 2) {
        const tex = ip.slice(1, -1);
        try { return <InlineMath key={`b${bi}-i${ii}`} math={tex} />; } catch { return ip; }
      }
      return <span key={`b${bi}-t${ii}`}>{ip}</span>;
    });
  });
}

// Helper to clean up render logic
function hasNext(current: number, total: number) {
  return current < total - 1;
}

function NextButton({ hasNext, isOwned, id, hasQuiz, onClick }: { hasNext: boolean, isOwned: boolean, id: string, hasQuiz?: boolean, onClick?: () => void }) {
  if (hasNext && isOwned) {
    return (
      <Button onClick={onClick} className="gap-2 rounded-xl shadow-glow font-display font-bold bg-[#6C63FF] hover:bg-[#5b52e6] text-white transition-all h-10 px-4">
        Next Question <ChevronRight className="w-4 h-4" />
      </Button>
    );
  } else if (hasNext && !isOwned) {
    return (
       <Link to={`/course/${id}`}>
         <Button variant="outline" className="gap-2 rounded-xl font-display font-bold border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF]/10 transition-all h-10 px-4">
           Unlock Full Course <ChevronRight className="w-4 h-4" />
         </Button>
       </Link>
    );
  } else if (!hasNext && isOwned && hasQuiz) {
    // Last question + owned + has quiz → "Prove You Are Exam Ready" pulsing green CTA
    return (
      <Link to={`/course/${id}/quiz`}>
        <Button
          className="gap-2 rounded-xl font-display font-bold bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse transition-all h-10 px-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          Prove You Are Exam Ready <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    );
  } else {
    return (
      <Link to={`/course/${id}`}>
        <Button variant="outline" className="gap-2 rounded-xl h-10 px-4">
          Back to List
        </Button>
      </Link>
    );
  }
}
