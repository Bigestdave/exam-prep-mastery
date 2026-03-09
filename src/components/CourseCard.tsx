import { Lock, CheckCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useBestQuizAttempt } from "@/hooks/useQuizData";
import { useAuth } from "@/contexts/AuthContext";

interface CourseCardProps {
  id: string;
  code: string;
  title: string;
  isOwned?: boolean;
  questionsCount?: number;
}

function MasteryBadge({ courseId, isOwned }: { courseId: string; isOwned: boolean }) {
  const { user } = useAuth();
  const { best, isLoading } = useBestQuizAttempt(courseId, user?.id);

  if (!isOwned || isLoading) return null;
  if (!best) return null;

  const pct = best.percentage;

  if (pct >= 80) {
    return (
      <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
        <Zap className="w-2.5 h-2.5" /> Ready
      </span>
    );
  }

  if (pct > 0) {
    return (
      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
        {best.score}/{best.total_questions} locked
      </span>
    );
  }

  return null;
}

function ProgressLine({ courseId, isOwned }: { courseId: string; isOwned: boolean }) {
  const { user } = useAuth();
  const { best, isLoading } = useBestQuizAttempt(courseId, user?.id);

  if (!isOwned || isLoading) return null;

  const pct = best ? best.percentage : 0;

  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#F5F5F4' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: 'hsl(var(--accent))' }}
      />
    </div>
  );
}

export function CourseCard({ id, code, title, isOwned = false, questionsCount = 15 }: CourseCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="h-full"
    >
      <Link 
        to={`/course/${id}`}
        className="flex flex-col bg-card border border-border rounded-2xl p-5 card-float transition-all duration-200 group h-full"
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
              {code}
            </span>
            {isOwned ? (
              <CheckCircle className="w-4 h-4 text-accent" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
            )}
          </div>
          
          <h3 className="font-display font-extrabold text-foreground text-base leading-snug line-clamp-2">
            {title}
          </h3>
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted-foreground/60">{questionsCount} Questions</span>
            <MasteryBadge courseId={id} isOwned={isOwned} />
          </div>
          
          {/* Progress bar */}
          <ProgressLine courseId={id} isOwned={isOwned} />
        </div>
      </Link>
    </motion.div>
  );
}
