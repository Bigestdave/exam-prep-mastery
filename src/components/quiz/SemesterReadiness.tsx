import { useSemesterReadiness } from "@/hooks/useQuizData";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SemesterReadinessProps {
  courses: Array<{ id: string; code: string; title: string }>;
}

export function SemesterReadiness({ courses }: SemesterReadinessProps) {
  const { user, purchases } = useAuth();
  const navigate = useNavigate();
  const courseIds = courses.map(c => c.id);
  const { readiness, totalPercentage, isLoading } = useSemesterReadiness(user?.id, courseIds);

  if (isLoading) return null;

  const hasAnyAttempt = courseIds.some(id => (readiness.get(id) ?? 0) > 0);
  const readyCourses = courseIds.filter(id => (readiness.get(id) ?? 0) >= 80).length;
  const totalCourses = courses.length;
  const secured = hasAnyAttempt ? readyCourses : 0;
  const pct = hasAnyAttempt ? totalPercentage : 0;

  // Find first course with a quiz to suggest
  const firstOwnedCourse = courses.find(c => purchases.includes(c.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-foreground rounded-3xl p-6 text-background shadow-elevated mb-8 relative overflow-hidden"
    >
      <div className="relative z-10 flex items-center gap-5">
        {/* Ring */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-display font-bold text-background">{pct}%</span>
            <span className="text-[8px] uppercase tracking-wider text-background/50 font-bold">Secured</span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <h2 className="text-base font-display font-bold text-background mb-0.5">
            Semester Readiness
          </h2>
          <p className="text-xs text-background/50 leading-relaxed">
            {hasAnyAttempt
              ? `${secured} of ${totalCourses} courses secured. ${secured < totalCourses ? "Complete your dossier." : ""}`
              : `${totalCourses} courses to master. Take your first confidence check.`
            }
          </p>
          {firstOwnedCourse && (
            <button
              onClick={() => navigate(`/course/${firstOwnedCourse.id}`)}
              className="mt-3 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      </div>

      {/* Course mini segments */}
      {hasAnyAttempt && (
        <div className="flex items-center gap-1.5 mt-5 relative z-10">
          {courses.map(c => {
            const cpct = readiness.get(c.id) ?? 0;
            return (
              <div
                key={c.id}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor:
                    cpct >= 80
                      ? "hsl(var(--accent))"
                      : cpct > 0
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.08)",
                }}
                title={`${c.code}: ${cpct}%`}
              />
            );
          })}
        </div>
      )}

      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/15 rounded-full blur-3xl -mr-10 -mt-10" />
    </motion.div>
  );
}
