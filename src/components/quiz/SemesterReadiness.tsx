import { useEffect } from "react";
import { useSemesterReadiness } from "@/hooks/useQuizData";
import { useAuth } from "@/contexts/AuthContext";
import { calcSemesterReadiness, getTier } from "@/lib/readinessTiers";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

interface SemesterReadinessProps {
  courses: Array<{ id: string; code: string; title: string }>;
}

export function SemesterReadiness({ courses }: SemesterReadinessProps) {
  const { user, purchases } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const courseIds = courses.map(c => c.id);
  const { readiness, isLoading, refetch } = useSemesterReadiness(user?.id, courseIds);

  useEffect(() => { refetch(); }, [location.key]);

  useEffect(() => {
    const handleFocus = () => refetch();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="rounded-3xl p-6 md:p-8 mb-8 animate-pulse bg-gradient-to-br from-espresso via-espresso-deep to-espresso-ink">
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-full flex-shrink-0 border-[5px] border-cream/[0.08]" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 rounded-lg bg-cream/10" />
            <div className="h-3 w-56 rounded bg-cream/[0.06]" />
          </div>
        </div>
        <div className="mt-6 h-11 w-full rounded-xl bg-cream/[0.08]" />
      </div>
    );
  }

  const hasAnyAttempt = courseIds.some(id => (readiness.get(id) ?? 0) > 0);
  const totalReadiness = hasAnyAttempt ? calcSemesterReadiness(courseIds, readiness) : 0;
  const goldCount = courseIds.filter(id => getTier(readiness.get(id) ?? 0).name === "gold").length;

  const ringRadius = 50;
  const circumference = 2 * Math.PI * ringRadius;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/quiz-hub")}
      className="rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden w-full text-left bg-gradient-to-br from-espresso via-espresso-deep to-espresso-ink"
    >
      <div className="relative z-10 flex items-center gap-6">
        {/* Ring */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60" cy="60" r={ringRadius}
              fill="none"
              stroke="hsl(var(--cream) / 0.08)"
              strokeWidth="5"
              {...(totalReadiness === 0 ? { strokeDasharray: "4 6" } : {})}
            />
            <motion.circle
              cx="60" cy="60" r={ringRadius}
              fill="none"
              stroke="hsl(var(--academic-green))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - totalReadiness / 100) }}
              transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-bold text-cream">{totalReadiness}%</span>
            <span className="text-[7px] uppercase tracking-[0.15em] font-bold mt-0.5 text-cream/35">
              Readiness
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-display font-bold leading-tight text-cream">
            Semester Readiness
          </h2>
          <p className="text-xs mt-1 leading-relaxed text-cream/45">
            {hasAnyAttempt
              ? `${goldCount} of ${courses.length} courses at Gold.${goldCount < courses.length ? " Tap to view all." : " Well done!"}`
              : `${courses.length} courses to master. Tap to begin.`}
          </p>
        </div>
      </div>

      {/* Segment bar */}
      {hasAnyAttempt && (
        <div className="flex items-center gap-1.5 mt-6 relative z-10">
          {courses.map(c => {
            const cpct = readiness.get(c.id) ?? 0;
            const tier = getTier(cpct);
            return (
              <div
                key={c.id}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: tier.ringHsl }}
                title={`${c.code}: ${cpct}% (${tier.label})`}
              />
            );
          })}
        </div>
      )}

      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-16 -mt-16 bg-academic-green/[0.08]" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl -ml-8 -mb-8 bg-espresso/10" />
    </motion.button>
  );
}
