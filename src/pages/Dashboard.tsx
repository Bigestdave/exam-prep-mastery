import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";

import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";
import { SemesterReadiness } from "@/components/quiz/SemesterReadiness";
import { TextShimmer } from "@/components/ui/text-shimmer";

interface CourseWithCount {
  id: string;
  code: string;
  title: string;
  faculty: string;
  level: string;
  price: number;
  questionCount: number;
}

export default function Dashboard() {
  const { user, profile, isLoading, purchases } = useAuth();
  const { courses, isLoading: coursesLoading } = useCourses();
  const [coursesWithCounts, setCoursesWithCounts] = useState<CourseWithCount[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (!isLoading && user && profile && (!profile.faculty || !profile.level)) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, isLoading, profile, navigate]);

  // Welcome back toast — once per session
  useEffect(() => {
    if (!isLoading && user && profile?.full_name) {
      const key = `welcomed_${user.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        toast({
          title: `Welcome back, ${profile.full_name.split(' ')[0]} 👋`,
          description: "Let's get you exam ready.",
        });
      }
    }
  }, [isLoading, user, profile, toast]);

  useEffect(() => {
    const fetchQuestionCounts = async () => {
      if (courses.length === 0) return;
      const courseIds = courses.map(c => c.id);
      const { data: countData, error } = await supabase
        .rpc('get_course_question_counts', { p_course_ids: courseIds });

      if (error) {
        console.error('Error fetching question counts:', error);
        setCoursesWithCounts(courses.map(c => ({ ...c, questionCount: 0 })));
        return;
      }

      const countMap = new Map<string, number>();
      countData?.forEach((row: { course_id: string; question_count: number }) => {
        countMap.set(row.course_id, row.question_count);
      });

      const results = courses.map(course => ({
        ...course,
        questionCount: countMap.get(course.id) || 0
      }));

      setCoursesWithCounts(results);
    };

    fetchQuestionCounts();
  }, [courses]);

  const isProcessing = courses.length > 0 && coursesWithCounts.length === 0;
  
  if (isLoading || coursesLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 md:px-6">
          <div className="mb-10 space-y-3">
             <TextShimmer as="h1" className="text-2xl font-display font-bold" duration={1.2}>Preparing your semester</TextShimmer>
             <div className="h-4 w-64 bg-card rounded-xl animate-pulse"></div>
          </div>

          {/* Semester Readiness skeleton */}
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

          <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-card rounded-3xl card-float animate-pulse"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const filteredCourses = coursesWithCounts.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );

  const departmentHasCoursesInDb = coursesWithCounts.some(c => c.faculty === profile?.faculty);
  const displayCourses = filteredCourses;
  const ownedCount = displayCourses.filter(c => purchases.includes(c.id)).length;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 page-enter relative">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 px-4 md:px-6">
        {/* Greeting + Stats */}
        <div className="mb-10">
          <div className="chapter-mark">
            <span className="roman">§</span>
            <span className="label">{profile?.faculty} · {profile?.level}</span>
            <span className="rule" />
          </div>
          <h1 className="text-[34px] md:text-[44px] font-display font-bold text-foreground leading-[0.95] tracking-[-0.02em]">
            <span className="text-muted-foreground font-normal">Welcome,</span>{" "}
            <span className="font-serif italic text-accent">{profile?.full_name?.split(' ')[0] || 'Student'}.</span>
          </h1>
        </div>

        {displayCourses.length > 0 ? (
          <>
            {/* Semester Readiness */}
            <SemesterReadiness courses={displayCourses.map(c => ({ id: c.id, code: c.code, title: c.title }))} />

            <div className="flex items-end justify-between mb-5 mt-10 pb-3 border-b border-border">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-1.5">The Catalog</p>
                <h2 className="text-xl font-display font-bold tracking-[-0.02em]">Your Courses</h2>
              </div>
              <span className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground tabular-nums">
                <span className="font-bold text-foreground text-base">{ownedCount}</span>
                <span className="mx-1">/</span>
                {displayCourses.length} unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
              {displayCourses.map((course, i) => (
                <div 
                  key={course.id} 
                  className="opacity-0 animate-fade-in h-full"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <CourseCard
                    id={course.id}
                    code={course.code}
                    title={course.title}
                    isOwned={purchases.includes(course.id)}
                    questionsCount={course.questionCount}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 md:py-24 border-y border-border">
            <div className="max-w-md">
              <div className="chapter-mark">
                <span className="roman">∅</span>
                <span className="label">No Catalog Yet</span>
                <span className="rule" />
              </div>
              <h3 className="text-[28px] md:text-[36px] font-display font-bold text-foreground leading-[1.05] tracking-[-0.02em] mb-4">
                {departmentHasCoursesInDb
                  ? <>No <span className="font-serif italic text-accent">{profile?.level}</span> courses yet.</>
                  : <>Your department is <span className="font-serif italic text-accent">on the way.</span></>}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-sm">
                {departmentHasCoursesInDb
                  ? `We don't have ${profile?.level} courses for your department this semester. Request the ones you need and we'll prioritise them.`
                  : `Courses for ${profile?.faculty || "your department"} are being prepared. Request the ones you need first.`}
              </p>
              <button
                onClick={() => navigate("/request-course")}
                className="inline-flex items-center gap-3 px-6 py-3.5 bg-foreground text-background font-display font-bold text-sm tracking-[-0.01em] rounded-none border border-foreground hover:bg-background hover:text-foreground transition-colors"
              >
                Request a Course
                <span className="font-serif italic">→</span>
              </button>
            </div>
          </div>
        )}
      </main>

      
      
    </div>
  );
}
