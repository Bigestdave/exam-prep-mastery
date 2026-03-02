import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useBestQuizAttempt, useQuizData } from "@/hooks/useQuizData";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Zap } from "lucide-react";

interface QuizCTAProps {
  courseId: string;
  courseCode: string;
}

export function QuizCTA({ courseId, courseCode }: QuizCTAProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasQuizData, isLoading: quizLoading } = useQuizData(courseId);
  const { best, isLoading: attemptLoading } = useBestQuizAttempt(courseId, user?.id);

  if (quizLoading || attemptLoading || !hasQuizData) return null;

  const percentage = best?.percentage ?? 0;
  const hasAttempted = best !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Confidence Check
          </span>
        </div>
        <span className={`text-xs font-mono font-bold ${
          percentage >= 80 ? "text-accent" : percentage > 0 ? "text-amber-600" : "text-muted-foreground"
        }`}>
          {hasAttempted ? `${percentage}%` : "Not taken"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {hasAttempted
          ? percentage >= 80
            ? "You've locked this course in. Retake to stay sharp."
            : "You haven't fully locked this in yet."
          : `Prove you're ready for ${courseCode}.`
        }
      </p>

      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={() => navigate(`/course/${courseId}/quiz`)}
        className="w-full h-11 bg-foreground text-background rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 shadow-card"
      >
        {hasAttempted ? "Retake" : "Take"} Confidence Check
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
