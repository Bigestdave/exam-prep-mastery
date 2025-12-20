import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Watermark } from "@/components/Watermark";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useCourseQuestions } from "@/hooks/useCourseQuestions";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

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
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !questionsLoading && user && course && !isOwned && !isFreePreview) {
      navigate(`/course/${id}`);
    }
  }, [isLoading, questionsLoading, user, course, isOwned, isFreePreview, id, navigate]);

  // Redirect if question not found after loading
  useEffect(() => {
    if (!questionsLoading && !question && course) {
      navigate(`/course/${id}`);
    }
  }, [questionsLoading, question, course, id, navigate]);

  if (isLoading || coursesLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !course || !question) return null;

  const hasPrev = questionIndex > 0;
  const hasNext = questions.some(q => q.question_index === questionIndex + 1);
  const canNavigate = isOwned || (questionIndex === 0);

  // Simple markdown-like rendering
  const renderAnswer = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-4">{line.replace('## ', '')}</h2>;
      }
      if (line.match(/^\d+\./)) {
        return <p key={i} className="text-foreground mb-2 ml-4">{line}</p>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="text-foreground mb-3 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-background relative">
      {user && <Watermark name={profile?.full_name || ''} email={user.email || ''} />}
      
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 max-w-3xl relative z-10">
        <Link 
          to={`/course/${id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {course.code}
        </Link>

        <div className="bg-card rounded-2xl p-6 md:p-10 card-shadow border border-border/50 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              Question {questionIndex + 1} of {questions.length}
            </span>
            {isFreePreview && !isOwned && (
              <span className="text-xs font-medium text-success bg-success-light px-2.5 py-1 rounded-lg">
                Free Preview
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-8">
            {question.question_text}
          </h1>

          <div className="prose-content">
            {renderAnswer(question.answer_text)}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {hasPrev && canNavigate ? (
            <Link to={`/course/${id}/answer/${questionIndex - 1}`}>
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {hasNext && isOwned ? (
            <Link to={`/course/${id}/answer/${questionIndex + 1}`}>
              <Button className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : hasNext && !isOwned ? (
            <Button variant="outline" disabled className="gap-2">
              Unlock to continue
            </Button>
          ) : (
            <Link to={`/course/${id}`}>
              <Button variant="outline">
                Back to questions
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
