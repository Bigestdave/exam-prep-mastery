import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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

      // Use database function to get counts efficiently (avoids 1000 row limit)
      const courseIds = courses.map(c => c.id);
      const { data: countData, error } = await supabase
        .rpc('get_course_question_counts', { p_course_ids: courseIds });

      if (error) {
        console.error('Error fetching question counts:', error);
        // Fallback: set all counts to 0
        setCoursesWithCounts(courses.map(c => ({ ...c, questionCount: 0 })));
        return;
      }

      // Build count map from results
      const countMap = new Map<string, number>();
      countData?.forEach((row: { course_id: string; question_count: number }) => {
        countMap.set(row.course_id, row.question_count);
      });

      // Map courses with their counts
      const results = courses.map(course => ({
        ...course,
        questionCount: countMap.get(course.id) || 0
      }));

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

  // Filter courses by user's department
  const filteredCourses = coursesWithCounts.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );

  // Check if this department has ANY courses in the database (not just based on static mapping)
  const departmentHasCoursesInDb = coursesWithCounts.some(c => c.faculty === profile?.faculty);
  
  // Show filtered courses if any exist for their department, otherwise show empty state
  const displayCourses = filteredCourses;

  return (
    // Added 'page-enter' for animation and 'pb-32' for the floating nav
    <div className="min-h-screen bg-[#F8FAFC] pb-32 md:pb-0 page-enter relative">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2 tracking-tight">
            Hi, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-slate-500 font-medium">
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
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-[#0F172A] mb-2">
              {departmentHasCoursesInDb ? "No courses for this level" : "Coming Soon"}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              {departmentHasCoursesInDb 
                ? `We couldn't find any courses for ${profile?.level} in your department just yet.`
                : `Tutorial courses for ${profile?.faculty || "your department"} are being prepared and will be available soon.`
              }
            </p>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
