import { useEffect, useState } from "react";
import { useSemesterReadiness } from "@/hooks/useQuizData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calcSemesterReadiness, getTier } from "@/lib/readinessTiers";
import { ReadinessRing } from "@/components/quiz/ReadinessRing";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

interface SemesterReadinessProps {
  courses: Array<{ id: string; code: string; title: string }>;
}

export function SemesterReadiness({ courses }: SemesterReadinessProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [quizCourseIds, setQuizCourseIds] = useState<Set<string>>(new Set());
  const [countsLoaded, setCountsLoaded] = useState(false);

  // Fetch which courses have actual quiz data (not just tutorial answers)
  useEffect(() => {
    const fetchQuizCourses = async () => {
      if (courses.length === 0) { setCountsLoaded(true); return; }
      const ids = courses.map(c => c.id);
      const { data } = await supabase.rpc('get_courses_with_quizzes' as any, { p_course_ids: ids });
      const withQuiz = new Set<string>();
      (data as any[])?.forEach((row: { course_id: string }) => {
        withQuiz.add(row.course_id);
      });
      setQuizCourseIds(withQuiz);
      setCountsLoaded(true);
    };
    fetchQuizCourses();
  }, [courses.map(c => c.id).join(',')]);

  const quizCourses = courses.filter(c => quizCourseIds.has(c.id));
  const courseIds = quizCourses.map(c => c.id);
  const { readiness, isLoading, refetch } = useSemesterReadiness(user?.id, courseIds);

  useEffect(() => { refetch(); }, [location.key]);

  useEffect(() => {
    const handleFocus = () => refetch();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  if (isLoading || !countsLoaded) {
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

  // Don't render at all if no courses have quizzes
  if (quizCourses.length === 0) return null;

  const hasAnyAttempt = courseIds.some(id => (readiness.get(id) ?? 0) > 0);
  const totalReadiness = hasAnyAttempt ? calcSemesterReadiness(courseIds, readiness) : 0;
  const goldCount = courseIds.filter(id => getTier(readiness.get(id) ?? 0).name === "gold").length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/quiz-hub")}
      className="rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden w-full text-left bg-gradient-to-br from-espresso via-espresso-deep to-espresso-ink"
    >
      <div className="relative z-10 flex items-center gap-6">
        <ReadinessRing percentage={totalReadiness} variant="dark" sizeClass="w-32 h-32" />

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-display font-bold leading-tight text-cream">
            Semester Readiness
          </h2>
          <p className="text-xs mt-1 leading-relaxed text-cream/45">
            {hasAnyAttempt
              ? `${goldCount} of ${quizCourses.length} courses mastered.${goldCount < quizCourses.length ? " Test yourself →" : " Well done!"}`
              : `${quizCourses.length} quizzes waiting. Prove you're exam ready →`}
          </p>
        </div>
      </div>

      {/* Segment bar */}
      {quizCourses.length > 0 && (
        <div className="flex items-center gap-1.5 mt-6 relative z-10">
          {quizCourses.map(c => {
            const cpct = readiness.get(c.id) ?? 0;
            const tier = getTier(cpct);
            const hasAttempt = cpct > 0;
            return (
              <div
                key={c.id}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: hasAttempt ? tier.ringHsl : 'hsl(var(--muted-foreground) / 0.15)' }}
                title={hasAttempt ? `${c.code}: ${cpct}% (${tier.label})` : `${c.code}: Take quiz to reveal`}
              />
            );
          })}
        </div>
      )}

      <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-16 -mt-16 bg-academic-green/[0.08]" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl -ml-8 -mb-8 bg-espresso/10" />
    </motion.button>
  );
}
