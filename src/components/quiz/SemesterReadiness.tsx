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

  if (isLoading) {
    return (
      <div className="rounded-3xl p-6 md:p-8 mb-8 animate-pulse" style={{ background: "linear-gradient(135deg, hsl(20 14% 11%) 0%, hsl(20 12% 8%) 60%, hsl(25 10% 6%) 100%)" }}>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-full flex-shrink-0" style={{ border: "5px solid rgba(253,251,247,0.08)" }} />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 rounded-lg" style={{ backgroundColor: "rgba(253,251,247,0.1)" }} />
            <div className="h-3 w-56 rounded" style={{ backgroundColor: "rgba(253,251,247,0.06)" }} />
          </div>
        </div>
        <div className="mt-6 h-11 w-full rounded-xl" style={{ backgroundColor: "rgba(253,251,247,0.08)" }} />
      </div>
    );
  }

  const hasAnyAttempt = courseIds.some(id => (readiness.get(id) ?? 0) > 0);
  const readyCourses = courseIds.filter(id => (readiness.get(id) ?? 0) >= 80).length;
  const totalCourses = courses.length;
  const secured = hasAnyAttempt ? readyCourses : 0;
  const pct = hasAnyAttempt ? totalPercentage : 0;

  const firstOwnedCourse = courses.find(c => purchases.includes(c.id));

  const ringRadius = 50;
  const circumference = 2 * Math.PI * ringRadius;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(20 14% 11%) 0%, hsl(20 12% 8%) 60%, hsl(25 10% 6%) 100%)",
      }}
    >
      <div className="relative z-10 flex items-center gap-6">
        {/* Ring — warm espresso palette */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60" cy="60" r={ringRadius}
              fill="none"
              stroke="rgba(253,251,247,0.08)"
              strokeWidth="5"
              {...(pct === 0 ? { strokeDasharray: "4 6" } : {})}
            />
            <motion.circle
              cx="60" cy="60" r={ringRadius}
              fill="none"
              stroke="hsl(142 64% 24%)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
              transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-bold" style={{ color: "#FDFBF7" }}>{pct}%</span>
            <span className="text-[7px] uppercase tracking-[0.15em] font-bold mt-0.5" style={{ color: "rgba(253,251,247,0.35)" }}>
              Secured
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-display font-bold leading-tight" style={{ color: "#FDFBF7" }}>
            Semester Readiness
          </h2>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(253,251,247,0.45)" }}>
            {hasAnyAttempt
              ? `${secured} of ${totalCourses} courses secured.${secured < totalCourses ? " Complete your dossier." : ""}`
              : firstOwnedCourse
                ? `${totalCourses} courses to master. Take your first confidence check.`
                : `${totalCourses} courses available. Test your knowledge free.`}
          </p>
        </div>
      </div>

      {/* Full-width CTA button */}
      {firstOwnedCourse ? (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(`/course/${firstOwnedCourse.id}`)}
          className="mt-6 w-full py-3 rounded-xl text-sm font-bold transition-colors relative z-10"
          style={{
            backgroundColor: "hsl(142 64% 24%)",
            color: "#FDFBF7",
          }}
        >
          Continue →
        </motion.button>
      ) : courses.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(`/course/${courses[0].id}`)}
          className="mt-6 w-full py-3 rounded-xl text-sm font-bold transition-colors relative z-10"
          style={{
            backgroundColor: "hsl(142 64% 24%)",
            color: "#FDFBF7",
          }}
        >
          Try a Free Diagnostic →
        </motion.button>
      )}

      {/* Course segment bar */}
      {hasAnyAttempt && (
        <div className="flex items-center gap-1.5 mt-6 relative z-10">
          {courses.map(c => {
            const cpct = readiness.get(c.id) ?? 0;
            return (
              <div
                key={c.id}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor:
                    cpct >= 80
                      ? "hsl(142 64% 24%)"
                      : cpct > 0
                        ? "rgba(253,251,247,0.2)"
                        : "rgba(253,251,247,0.06)",
                }}
                title={`${c.code}: ${cpct}%`}
              />
            );
          })}
        </div>
      )}

      {/* Ambient glow — warm, not neon */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-16 -mt-16" style={{ backgroundColor: "hsla(142,64%,24%,0.08)" }} />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl -ml-8 -mb-8" style={{ backgroundColor: "hsla(30,20%,30%,0.1)" }} />
    </motion.div>
  );
}
