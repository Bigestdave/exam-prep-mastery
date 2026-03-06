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

  const firstOwnedCourse = courses.find(c => purchases.includes(c.id));

  const circumference = 2 * Math.PI * 38;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(160 40% 12%) 0%, hsl(160 30% 8%) 50%, hsl(20 14% 9%) 100%)",
      }}
    >
      <div className="relative z-10 flex items-center gap-6">
        {/* Ring — larger, cleaner */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
            <circle
              cx="48" cy="48" r="38"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="5"
            />
            <motion.circle
              cx="48" cy="48" r="38"
              fill="none"
              stroke="#4ADE80"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
              transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-bold text-white">{pct}%</span>
            <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 font-bold mt-0.5">
              Secured
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-display font-bold text-white leading-tight">
            Semester{"\n"}Readiness
          </h2>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">
            {hasAnyAttempt
              ? `${secured} of ${totalCourses} courses secured.${secured < totalCourses ? " Complete your dossier." : ""}`
              : `${totalCourses} courses to master. Take your first confidence check.`}
          </p>
          {firstOwnedCourse && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/course/${firstOwnedCourse.id}`)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#4ADE80] text-[#0A0A0A] text-xs font-bold hover:bg-[#22C55E] transition-colors"
            >
              Continue →
            </motion.button>
          )}
        </div>
      </div>

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
                      ? "#4ADE80"
                      : cpct > 0
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.06)",
                }}
                title={`${c.code}: ${cpct}%`}
              />
            );
          })}
        </div>
      )}

      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#4ADE80]/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#4ADE80]/5 rounded-full blur-2xl -ml-8 -mb-8" />
    </motion.div>
  );
}
