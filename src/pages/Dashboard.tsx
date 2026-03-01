import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SurveyDialog } from "@/components/SurveyDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

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
             <div className="h-8 w-48 bg-secondary rounded-lg animate-pulse"></div>
             <div className="h-4 w-64 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-card rounded-2xl border border-border p-6 animate-pulse shadow-card"></div>
            ))}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (!user) return null;

  const filteredCourses = coursesWithCounts.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );

  const departmentHasCoursesInDb = coursesWithCounts.some(c => c.faculty === profile?.faculty);
  const displayCourses = filteredCourses;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 page-enter relative">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Hi, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-muted-foreground font-medium">
            {displayCourses.length > 0 
              ? `Showing courses for ${profile?.faculty} - ${profile?.level}`
              : departmentHasCoursesInDb 
                ? `No courses found for ${profile?.level} yet`
                : `Tutorial courses for your department are coming soon`
            }
          </p>
        </div>

        {displayCourses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayCourses.map((course, i) => (
              <div 
                key={course.id} 
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
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
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-2">
              {departmentHasCoursesInDb ? "No courses for this level" : "Coming Soon"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {departmentHasCoursesInDb 
                ? `We couldn't find any courses for ${profile?.level} in your department just yet.`
                : `Tutorial courses for ${profile?.faculty || "your department"} are being prepared and will be available soon.`
              }
            </p>
          </div>
        )}
      </main>

      <SurveyDialog />
      <MobileBottomNav />
    </div>
  );
}
