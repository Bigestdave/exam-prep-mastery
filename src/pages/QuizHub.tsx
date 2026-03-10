import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useSemesterReadiness } from "@/hooks/useQuizData";
import { supabase } from "@/integrations/supabase/client";
import { calcSemesterReadiness, getTier, courseContribution } from "@/lib/readinessTiers";
import { ReadinessRing } from "@/components/quiz/ReadinessRing";
import { ChevronLeft, Lock, CheckCircle2, Zap, BookOpen } from "lucide-react";

export default function QuizHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, purchases, isLoading: authLoading } = useAuth();
  const { courses, isLoading: coursesLoading } = useCourses();
  const [quizCourseIds, setQuizCourseIds] = useState<Set<string>>(new Set());
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const departmentCourses = courses.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );

  // Fetch which courses actually have quiz data (not just tutorial answers)
  useEffect(() => {
    const fetchQuizCourses = async () => {
      if (coursesLoading || authLoading) return; // Don't run until deps are ready
      if (departmentCourses.length === 0) { setCountsLoading(false); return; }
      const ids = departmentCourses.map(c => c.id);
      const { data } = await supabase.rpc('get_courses_with_quizzes' as any, { p_course_ids: ids });
      const withQuiz = new Set<string>();
      (data as any[])?.forEach((row: { course_id: string }) => {
        withQuiz.add(row.course_id);
      });
      setQuizCourseIds(withQuiz);
      setCountsLoading(false);
    };
    fetchQuizCourses();
  }, [coursesLoading, authLoading, courses, profile?.faculty, profile?.level]);

  // Only include courses that have quiz data
  const quizEnabledCourses = departmentCourses.filter(c => quizCourseIds.has(c.id));
  const courseIds = quizEnabledCourses.map(c => c.id);
  const { readiness, isLoading: readinessLoading, refetch } = useSemesterReadiness(user?.id, courseIds);

  useEffect(() => { refetch(); }, [location.key]);

  const isLoading = authLoading || coursesLoading || countsLoading || readinessLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 md:pb-0">
        {/* Header skeleton */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="container flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-2xl bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-5 w-40 rounded-lg bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
        <main className="container px-4 py-6 max-w-2xl mx-auto">
          {/* Readiness card skeleton */}
          <div className="rounded-3xl p-6 mb-6 relative overflow-hidden bg-gradient-to-br from-espresso via-espresso-deep to-espresso-ink">
            <div className="flex items-center gap-5">
              <div className="w-28 h-28 rounded-full flex-shrink-0 border-[5px] border-cream/[0.08]" />
              <div className="flex-1 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-3 w-16 rounded bg-cream/10 animate-pulse" />
                    <div className="h-3 w-12 rounded bg-cream/[0.06] animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-cream/[0.08] animate-pulse" />
              ))}
            </div>
          </div>
          {/* Course list skeleton */}
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-40 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const totalReadiness = calcSemesterReadiness(courseIds, readiness);
  const ownedCourses = quizEnabledCourses.filter(c => purchases.includes(c.id));
  const lockedCourses = quizEnabledCourses.filter(c => !purchases.includes(c.id));

  // Empty state — no quiz-enabled courses
  if (quizEnabledCourses.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-32 md:pb-0">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="container flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-display font-bold text-foreground" style={{ letterSpacing: '-0.05em' }}>
              Semester Readiness
            </h1>
          </div>
        </div>
        <main className="container px-4 py-16 max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2" style={{ letterSpacing: '-0.05em' }}>
            No quizzes yet
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Quizzes for your courses are being prepared. Check back soon — your readiness score will appear here once they're live.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-2xl bg-foreground text-background font-display font-bold text-sm"
            style={{ letterSpacing: '-0.05em' }}
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

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
            <ReadinessRing percentage={totalReadiness} variant="dark" sizeClass="w-28 h-28" />

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
                      {count} {count === 1 ? "course" : "courses"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segment bar */}
          <div className="flex items-center gap-1.5 mt-5 relative z-10">
            {quizEnabledCourses.map(c => {
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
                const contribution = courseContribution(pct, quizEnabledCourses.length);
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
                const slotSize = Math.round(100 / quizEnabledCourses.length);
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
