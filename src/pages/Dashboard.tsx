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

  // Loading State (Skeleton)
  const isProcessing = courses.length > 0 && coursesWithCounts.length === 0;
  
  if (isLoading || coursesLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 md:px-6">
          <div className="mb-10 space-y-3">
             <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
             <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 p-6 animate-pulse shadow-sm"></div>
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
    // Added 'page-enter' for animation
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-0 page-enter relative">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          {/* Forced Dark Text */}
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2 tracking-tight">
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
              <div key={course.id} style={{ animationDelay: `${i * 50}ms` }}>
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
            <h3 className="font-bold text-[#0F172A] mb-2">No courses available</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              We couldn't find any courses for your specific faculty and level just yet.
            </p>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
