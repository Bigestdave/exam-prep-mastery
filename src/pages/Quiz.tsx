import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useQuizData, QuizOption } from "@/hooks/useQuizData";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import QuizResult from "@/components/quiz/QuizResult";

type FeedbackState = "idle" | "correct" | "incorrect";

export default function Quiz() {
  const { id } = useParams<{ id: string }>();
  const { user, purchases } = useAuth();
  const { getCourseById } = useCourses();
  const { questions, isLoading, hasQuizData } = useQuizData(id);
  const navigate = useNavigate();

  const course = id ? getCourseById(id) : undefined;
  const isOwned = id ? purchases.includes(id) : false;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showSeniorNote, setShowSeniorNote] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
    if (!isLoading && !hasQuizData && id) navigate(`/course/${id}`);
    if (!isLoading && !isOwned && id) navigate(`/course/${id}`);
  }, [user, isLoading, hasQuizData, isOwned, id, navigate]);

  const currentQuestion = questions[currentIndex];
  const options = currentQuestion?.quiz_options ?? [];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const correctIndex = options.findIndex(o => o.is_correct);

  const handleSelect = (index: number) => {
    if (feedback !== "idle") return;
    setSelectedOption(index);
  };

  const handleCheck = () => {
    if (selectedOption === null || feedback !== "idle") return;

    const isCorrect = options[selectedOption]?.is_correct;
    if (isCorrect) {
      setFeedback("correct");
      setScore(s => s + 1);
    } else {
      setFeedback("incorrect");
      setShowSeniorNote(true);
    }
  };

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setFeedback("idle");
      setShowSeniorNote(false);
    } else {
      // Quiz complete — save attempt
      const percentage = Math.round((score / questions.length) * 100);
      if (user && id) {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          course_id: id,
          score,
          total_questions: questions.length,
          percentage,
        });
      }
      setShowResult(true);
    }
  }, [currentIndex, questions.length, score, user, id]);

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
      />
    );
  }

  const getOptionStyle = (index: number) => {
    const base = "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4";

    if (feedback === "idle") {
      if (selectedOption === index) {
        return `${base} border-foreground bg-card shadow-card`;
      }
      return `${base} border-border bg-card hover:border-foreground/30`;
    }

    // After checking
    if (index === correctIndex) {
      return `${base} border-accent bg-accent/5`;
    }
    if (index === selectedOption && feedback === "incorrect") {
      return `${base} border-border bg-secondary`;
    }
    return `${base} border-border/50 bg-card opacity-50`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Zen Mode Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-border">
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 30 }}
        />
      </div>

      {/* Close button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => navigate(`/course/${id}`)}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-card"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Question counter */}
      <div className="fixed top-4 left-4 z-50">
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-5 py-20 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Question */}
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground text-center mb-10 leading-snug">
              {currentQuestion.question_text}
            </h2>

            {/* Option Cards */}
            <div className="space-y-3 mb-8">
              {options.map((option, i) => (
                <motion.button
                  key={i}
                  whileTap={feedback === "idle" ? { scale: 0.98 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={getOptionStyle(i)}
                  onClick={() => handleSelect(i)}
                  disabled={feedback !== "idle"}
                >
                  {/* Radio dot */}
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    feedback === "idle" && selectedOption === i
                      ? "border-foreground"
                      : feedback !== "idle" && i === correctIndex
                        ? "border-accent"
                        : "border-border"
                  }`}>
                    {((feedback === "idle" && selectedOption === i) ||
                      (feedback !== "idle" && i === correctIndex)) && (
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        feedback !== "idle" && i === correctIndex
                          ? "bg-accent"
                          : "bg-foreground"
                      }`} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground leading-relaxed">
                    {option.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Correct feedback toast */}
        <AnimatePresence>
          {feedback === "correct" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mb-6"
            >
              <p className="text-sm font-medium text-accent">
                Solid. You own this concept. ✓
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Senior's Note bottom sheet */}
        <AnimatePresence>
          {showSeniorNote && feedback === "incorrect" && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-card"
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                Senior's Note
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                The correct answer is: <span className="font-semibold text-accent">{options[correctIndex]?.text}</span>.
                {" "}Review this topic in Question {currentQuestion.question_index + 1} to lock it in.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={feedback === "idle" ? handleCheck : handleNext}
          disabled={feedback === "idle" && selectedOption === null}
          className={`w-full h-14 rounded-2xl font-display font-bold text-base transition-all ${
            feedback === "idle"
              ? selectedOption !== null
                ? "bg-foreground text-background shadow-card"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
              : "bg-foreground text-background shadow-card"
          }`}
        >
          {feedback === "idle"
            ? "Check Answer"
            : currentIndex < questions.length - 1
              ? "Next Question →"
              : "See Results →"
          }
        </motion.button>
      </div>
    </div>
  );
}
