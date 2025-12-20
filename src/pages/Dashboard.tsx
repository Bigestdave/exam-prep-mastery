import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";

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

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('showWelcomeToast');
    if (justLoggedIn && profile?.full_name) {
      sessionStorage.removeItem('showWelcomeToast');
      toast({
        title: `Welcome back, ${profile.full_name.split(' ')[0]}!`,
        className: "bg-[#0F172A] text-white border-none shadow-float",
        description: (
          <div className="flex items-center gap-2 text-white/90">
            <CheckCircle className="w-4 h-4 text-[#10B981]" />
            <span>You're all set to continue learning.</span>
          </div>
        ) as unknown as string,
      });
    }
  }, [profile, toast]);

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const filteredCourses = coursesWithCounts.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );
  const displayCourses = filteredCourses.length > 0 ? filteredCourses : coursesWithCounts;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 font-sans">
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
                  // We assume CourseCard accepts className or uses card styles
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
