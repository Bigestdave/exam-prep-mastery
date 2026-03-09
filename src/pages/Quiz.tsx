import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useQuizData, QuizOption } from "@/hooks/useQuizData";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft } from "lucide-react";
import QuizResult from "@/components/quiz/QuizResult";

export default function Quiz() {
  const { id } = useParams<{ id: string }>();
  const { user, purchases } = useAuth();
  const { getCourseById } = useCourses();
  const { questions, isLoading, hasQuizData } = useQuizData(id);
  const navigate = useNavigate();

  const course = id ? getCourseById(id) : undefined;
  const isOwned = id ? purchases.includes(id) : false;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
    if (!isLoading && !hasQuizData && id) navigate(`/course/${id}`);
    if (!isLoading && !isOwned && id) navigate(`/course/${id}`);
  }, [user, isLoading, hasQuizData, isOwned, id, navigate]);

  const currentQuestion = questions[currentIndex];
  const options = currentQuestion?.quiz_options ?? [];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleSelect = useCallback(async (optionIndex: number) => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    const newAnswers = new Map(answers);
    newAnswers.set(currentIndex, optionIndex);
    setAnswers(newAnswers);

    const isCorrect = options[optionIndex]?.is_correct;

    await new Promise(r => setTimeout(r, 600));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
    setIsTransitioning(false);
  }, [currentIndex, questions.length, answers, options, isTransitioning]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0 && !isTransitioning) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex, isTransitioning]);

  const handleFinish = useCallback(async () => {
    // Calculate score from all answers
    let finalScore = 0;
    answers.forEach((optionIndex, questionIndex) => {
      const q = questions[questionIndex];
      const opts = q?.quiz_options ?? [];
      if (opts[optionIndex]?.is_correct) finalScore++;
    });

    setScore(finalScore);

    const percentage = Math.round((finalScore / questions.length) * 100);
    if (user && id) {
      await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        course_id: id,
        score: finalScore,
        total_questions: questions.length,
        percentage,
      });
    }
    setShowResult(true);
  }, [answers, questions, user, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!course || !currentQuestion) return null;

  if (showResult) {
    return (
      <QuizResult
        courseId={id!}
        courseCode={course.code}
        courseTitle={course.title}
        score={score}
        total={questions.length}
        questions={questions}
        answers={answers}
      />
    );
  }

  const selectedOption = answers.get(currentIndex) ?? null;

  const getOptionStyle = (index: number) => {
    const base = "w-full text-left p-5 rounded-2xl transition-all duration-200";

    if (selectedOption === index) {
      return `${base} border-2 border-foreground bg-card shadow-card`;
    }
    if (selectedOption !== null) {
      return `${base} border border-border/30 bg-card opacity-40`;
    }
    return `${base} border border-border bg-card hover:bg-secondary/50`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Zen Mode — 2px Academic Green progress line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-border">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 30 }}
        />
      </div>

      {/* Close button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => navigate(`/course/${id}`)}
          className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-card"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Question counter */}
      <div className="fixed top-4 left-5 z-50">
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Main content — A4 Paper rule */}
      <div className="flex-1 flex flex-col justify-center px-5 py-24 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {/* Question */}
            <h2
              className="text-xl md:text-2xl font-display font-bold text-foreground text-center mb-10 leading-snug"
              style={{ letterSpacing: '-0.05em' }}
            >
              {currentQuestion.quiz_question_text}
            </h2>

            {/* Option Cards — NO radio dots, entire card is the button */}
            <div className="space-y-3 mb-8">
              {options.map((option, i) => (
                <motion.button
                  key={i}
                  whileTap={selectedOption === null ? { scale: 0.97 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={getOptionStyle(i)}
                  onClick={() => handleSelect(i)}
                  disabled={selectedOption !== null || isTransitioning}
                >
                  <span className="text-sm font-medium text-foreground leading-relaxed">
                    {option.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
