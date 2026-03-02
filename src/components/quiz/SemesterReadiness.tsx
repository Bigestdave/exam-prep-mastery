import { useSemesterReadiness } from "@/hooks/useQuizData";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface SemesterReadinessProps {
  courses: Array<{ id: string; code: string; title: string }>;
}

export function SemesterReadiness({ courses }: SemesterReadinessProps) {
  const { user, purchases } = useAuth();
  const courseIds = courses.map(c => c.id);
  const { readiness, totalPercentage, isLoading } = useSemesterReadiness(user?.id, courseIds);

  if (isLoading) return null;

  // Only show if user has at least one quiz attempt
  const hasAnyAttempt = courseIds.some(id => (readiness.get(id) ?? 0) > 0);
  if (!hasAnyAttempt) return null;

  const readyCourses = courseIds.filter(id => (readiness.get(id) ?? 0) >= 80).length;
  const totalCourses = courses.length;
  const remaining = totalCourses - readyCourses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-foreground rounded-3xl p-6 text-background shadow-elevated mb-8 relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-[10px] font-bold text-background/40 uppercase tracking-widest mb-1">
              Semester Preparedness
            </h2>
            <h1 className="text-4xl font-display font-bold">
              {totalPercentage}<span className="text-xl text-background/40">%</span>
            </h1>
          </div>
          <div className="text-right">
            {remaining > 0 ? (
              <>
                <p className="text-[11px] text-background/50">Master {remaining} more to</p>
                <p className="text-xs font-bold text-accent">reach 100% readiness.</p>
              </>
            ) : (
              <p className="text-xs font-bold text-accent">All courses mastered! 🏆</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-background/10 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${totalPercentage}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.3 }}
          />
        </div>

        {/* Course mini-ring */}
        <div className="flex items-center gap-1.5 mt-4">
          {courses.map(c => {
            const pct = readiness.get(c.id) ?? 0;
            return (
              <div
                key={c.id}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor:
                    pct >= 80
                      ? "hsl(var(--accent))"
                      : pct > 0
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.08)",
                }}
                title={`${c.code}: ${pct}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/15 rounded-full blur-3xl -mr-10 -mt-10" />
    </motion.div>
  );
}
