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

  // Fetch question counts
  useEffect(() => {
    const fetchQuestionCounts = async () => {
      if (courses.length === 0) return;

      const countsPromises = courses.map(async (course) => {
        const { count } = await supabase
          .from('course_questions')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        return {
          ...course,
          questionCount: count || 0
        };
      });

      const results = await Promise.all(countsPromises);
      setCoursesWithCounts(results);
    };

    fetchQuestionCounts();
  }, [courses]);

  // Welcome Toast Logic
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('showWelcomeToast');
    if (justLoggedIn && profile?.full_name) {
      sessionStorage.removeItem('showWelcomeToast');
      toast({
        title: `Welcome back, ${profile.full_name.split(' ')[0]}!`,
        className: "bg-slate-900 text-white border-none",
        description: (
          <div className="flex items-center gap-2 text-white/90">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>You're all set to continue learning.</span>
          </div>
        ) as unknown as string,
      });
    }
  }, [profile, toast]);

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  // Filter Logic
  const filteredCourses = coursesWithCounts.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );
  const displayCourses = filteredCourses.length > 0 ? filteredCourses : coursesWithCounts;

  return (
    // pb-24 ensures content doesn't get hidden behind the bottom nav
    <div className="min-h-screen bg-slate-50/50 pb-24 md:pb-0">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          {/* Explicitly Dark Text for Visibility */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Hi, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-slate-500 font-medium">
            {filteredCourses.length > 0 
              ? `Showing courses for ${profile?.faculty} - ${profile?.level}`
              : 'Browse all available courses'
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
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">No courses available</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              We couldn't find any courses for your specific department and level just yet.
            </p>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
