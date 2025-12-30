import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, profile, isLoading, purchases } = useAuth();
  const { courses, isLoading: coursesLoading } = useCourses();
  const [coursesWithCounts, setCoursesWithCounts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => { if (!isLoading && !user) navigate("/login"); }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (courses.length === 0) return;
      const results = await Promise.all(courses.map(async (course) => {
        const { count } = await supabase.from('course_questions').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
        return { ...course, questionCount: count || 0 };
      }));
      setCoursesWithCounts(results);
    };
    fetchCounts();
  }, [courses]);

  if (isLoading || coursesLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return null;

  // STRICT FILTER: Match Department & Level
  const displayCourses = coursesWithCounts.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      <main className="container py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Hi, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500">{profile?.faculty} • {profile?.level}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {displayCourses.map((c) => (
            <CourseCard key={c.id} id={c.id} code={c.code} title={c.title} isOwned={purchases.includes(c.id)} questionsCount={c.questionCount} />
          ))}
        </div>
        {displayCourses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border shadow-sm">
            <BookOpen className="mx-auto mb-4 text-slate-300" size={40} />
            <h3 className="font-bold">No courses yet</h3>
            <p className="text-sm text-slate-400 px-10">We haven't added tutorials for {profile?.faculty} yet.</p>
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}
