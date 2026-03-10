import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useSemesterReadiness } from "@/hooks/useQuizData";
import { calcSemesterReadiness, getTier, courseContribution } from "@/lib/readinessTiers";
import { ChevronLeft, Lock, CheckCircle2, Zap } from "lucide-react";

export default function QuizHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, purchases, isLoading: authLoading } = useAuth();
  const { courses, isLoading: coursesLoading } = useCourses();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const departmentCourses = courses.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );
  const courseIds = departmentCourses.map(c => c.id);
  const { readiness, isLoading: readinessLoading, refetch } = useSemesterReadiness(user?.id, courseIds);

  useEffect(() => { refetch(); }, [location.key]);

  const isLoading = authLoading || coursesLoading || readinessLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const totalReadiness = calcSemesterReadiness(courseIds, readiness);
  const ownedCourses = departmentCourses.filter(c => purchases.includes(c.id));
  const lockedCourses = departmentCourses.filter(c => !purchases.includes(c.id));

  const ringRadius = 50;
  const circumference = 2 * Math.PI * ringRadius;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground" style={{ letterSpacing: '-0.05em' }}>
              Semester Readiness
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {profile?.faculty} · {profile?.level}
            </p>
          </div>
        </div>
      </div>

      <main className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Readiness Ring Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 mb-6 relative overflow-hidden bg-gradient-to-br from-espresso via-espresso-deep to-espresso-ink"
        >
          <div className="relative z-10 flex items-center gap-5">
            {/* Ring */}
            <div className="relative w-28 h-28 flex-shrink-0">
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

            {/* Legend */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {(["gold", "silver", "bronze"] as const).map(tierName => {
                const t = getTier(tierName === "gold" ? 80 : tierName === "silver" ? 50 : 1);
                const count = courseIds.filter(id => {
                  const pct = readiness.get(id) ?? 0;
                  return getTier(pct).name === tierName;
                }).length;
                return (
                  <div key={tierName} className="flex items-center gap-2 text-xs text-cream/60">
                    <span>{t.emoji}</span>
                    <span className="font-mono">{t.label}</span>
                    <span className={`ml-auto font-bold ${count > 0 ? "text-cream" : "text-cream/25"}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segment bar */}
          <div className="flex items-center gap-1.5 mt-5 relative z-10">
            {departmentCourses.map(c => {
              const pct = readiness.get(c.id) ?? 0;
              const tier = getTier(pct);
              return (
                <div
                  key={c.id}
                  className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: tier.ringHsl }}
                  title={`${c.code}: ${pct}% (${tier.label})`}
                />
              );
            })}
          </div>

          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-16 -mt-16 bg-academic-green/[0.08]" />
        </motion.div>

        {/* Unlocked Courses */}
        {ownedCourses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2" style={{ letterSpacing: '-0.03em' }}>
              <Zap className="w-4 h-4 text-accent" />
              Your Courses
            </h2>
            <div className="space-y-2">
              {ownedCourses.map((course, i) => {
                const pct = readiness.get(course.id) ?? 0;
                const tier = getTier(pct);
                const contribution = courseContribution(pct, departmentCourses.length);
                return (
                  <motion.button
                    key={course.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/course/${course.id}/quiz`)}
                    className="w-full bg-card border border-border rounded-2xl p-4 text-left shadow-card hover:shadow-card-hover transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg">{tier.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-display font-bold text-foreground truncate" style={{ letterSpacing: '-0.03em' }}>
                            {course.code}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {course.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {pct > 0 ? (
                          <div className="text-right">
                            <p className={`text-sm font-bold ${tier.color}`}>{pct}%</p>
                            <p className="text-[10px] text-muted-foreground font-mono">+{contribution}%</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">Take quiz →</span>
                        )}
                        {tier.name === "gold" && <CheckCircle2 className="w-4 h-4 text-accent" />}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Courses */}
        {lockedCourses.length > 0 && (
          <div>
            <h2 className="text-sm font-display font-bold text-muted-foreground mb-3 flex items-center gap-2" style={{ letterSpacing: '-0.03em' }}>
              <Lock className="w-3.5 h-3.5" />
              Locked Courses
            </h2>
            <div className="space-y-2">
              {lockedCourses.map((course, i) => {
                const slotSize = Math.round(100 / departmentCourses.length);
                return (
                  <motion.button
                    key={course.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (ownedCourses.length + i) * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="w-full bg-card/50 border border-border/50 rounded-2xl p-4 text-left opacity-60 hover:opacity-80 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Lock className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-display font-bold text-foreground truncate" style={{ letterSpacing: '-0.03em' }}>
                            {course.code}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {course.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-muted-foreground font-mono">Worth {slotSize}%</p>
                        <p className="text-xs text-accent font-bold">Preview →</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
