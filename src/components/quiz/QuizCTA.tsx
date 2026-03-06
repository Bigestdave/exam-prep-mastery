import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useBestQuizAttempt, useQuizData } from "@/hooks/useQuizData";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

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

  // SVG circular progress
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-3xl p-5 mb-6 shadow-card"
    >
      <div className="flex items-center gap-4 mb-4">
        {/* Circular readiness indicator */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
            {/* Background circle */}
            <circle
              cx="25" cy="25" r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="3"
              {...(percentage === 0 ? { strokeDasharray: "3 5" } : {})}
            />
            {/* Progress arc */}
            <circle
              cx="25" cy="25" r={radius}
              fill="none"
              stroke={percentage >= 80 ? "hsl(var(--accent))" : percentage > 0 ? "hsl(30, 70%, 60%)" : "hsl(var(--border))"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-display font-bold text-foreground">{percentage}%</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-display font-bold text-foreground text-sm" style={{ letterSpacing: '-0.05em' }}>
            Exam Readiness: {percentage}%
          </h3>
          <p className="text-xs text-muted-foreground font-serif italic mt-0.5">
            {hasAttempted
              ? percentage >= 80
                ? "You've locked this course in."
                : "You haven't fully locked this in yet."
              : "You haven't locked this course in yet."
            }
          </p>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={() => navigate(`/course/${courseId}/quiz`)}
        className="w-full h-12 bg-foreground text-background rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 shadow-card"
        style={{ letterSpacing: '-0.05em' }}
      >
        {hasAttempted ? "Retake" : "Take"} Confidence Check
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
