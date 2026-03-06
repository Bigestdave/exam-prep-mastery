import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { SurveyDialog } from "@/components/SurveyDialog";
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
    }
  }, [user, isLoading, navigate]);

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
        <div className="mb-8">
          <p className="text-xs text-muted-foreground font-mono tracking-wider uppercase mb-1">
            {profile?.faculty} · {profile?.level}
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            {profile?.full_name?.split(' ')[0] || 'Student'}
          </h1>
          
        </div>

        {displayCourses.length > 0 ? (
          <>
            {/* Semester Readiness */}
            <SemesterReadiness courses={displayCourses.map(c => ({ id: c.id, code: c.code, title: c.title }))} />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-foreground">Your Courses</h2>
              <span className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{ownedCount}</span>/{displayCourses.length} unlocked
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
          <div className="text-center py-16 bg-card rounded-3xl card-float">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-2">
              {departmentHasCoursesInDb ? "No courses for this level" : "Coming Soon"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {departmentHasCoursesInDb 
                ? `No courses for ${profile?.level} in your department yet.`
                : `Courses for ${profile?.faculty || "your department"} are being prepared.`
              }
            </p>
          </div>
        )}
      </main>

      <SurveyDialog />
      
    </div>
  );
}
