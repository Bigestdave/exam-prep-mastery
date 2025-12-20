import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle } from "lucide-react";

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
      const countsPromises = courses.map(async (course) => {
        const { count } = await supabase
          .from('course_questions')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);
        return { ...course, questionCount: count || 0 };
      });
      const results = await Promise.all(countsPromises);
      setCoursesWithCounts(results);
    };
    fetchQuestionCounts();
  }, [courses]);

  // Loading State: Render Skeletons
  if (isLoading || coursesLoading || (courses.length > 0 && coursesWithCounts.length === 0)) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-6">
          <div className="mb-10 space-y-3">
             <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
             <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 p-6 animate-pulse shadow-sm">
                <div className="flex justify-between mb-4">
                   <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                   <div className="w-16 h-6 bg-slate-100 rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-100 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-slate-50 rounded"></div>
              </div>
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
  const displayCourses = filteredCourses.length > 0 ? filteredCourses : coursesWithCounts;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 font-sans animate-fade-in">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container max-w-5xl py-8 px-6">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-2 tracking-tight">
            Hi, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-muted-foreground font-medium">
            {filteredCourses.length > 0 
              ? `Showing courses for ${profile?.faculty} - ${profile?.level}`
              : 'Browse all available courses'
            }
          </p>
        </div>

        {displayCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayCourses.map((course, i) => (
              <div 
                key={course.id} 
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
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
          <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-premium">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-secondary mb-2">No courses available</h3>
            <p className="text-muted-foreground">
              Courses for your faculty and level will appear here.
            </p>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
