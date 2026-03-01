import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseWithCount {
  id: string;
  code: string;
  title: string;
  faculty: string;
  level: string;
  price: number;
  questionCount: number;
}

export default function Library() {
  const { user, profile, isLoading, purchases } = useAuth();
  const { courses, isLoading: coursesLoading } = useCourses();
  const [purchasedCourses, setPurchasedCourses] = useState<CourseWithCount[]>([]);
  const [isFetchingCounts, setIsFetchingCounts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      setIsFetchingCounts(true);
      const filtered = courses.filter(course => purchases.includes(course.id));
      
      const countsPromises = filtered.map(async (course) => {
        const { count } = await supabase
          .from('course_questions')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        return { ...course, questionCount: count || 0 };
      });

      const results = await Promise.all(countsPromises);
      setPurchasedCourses(results);
      setIsFetchingCounts(false);
    };

    if (courses.length > 0 && purchases.length > 0) {
      fetchPurchasedCourses();
    } else if (courses.length > 0) {
      setIsFetchingCounts(false);
    }
  }, [courses, purchases]);

  const isProcessing = isLoading || coursesLoading || (purchases.length > 0 && isFetchingCounts);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 md:px-6">
          <div className="mb-8 space-y-3">
            <div className="h-8 w-32 bg-secondary rounded-lg animate-pulse"></div>
            <div className="h-4 w-48 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                    <div className="h-5 w-full bg-secondary rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            My Library
          </h1>
          <p className="text-muted-foreground">
            {purchasedCourses.length > 0 
              ? `You have ${purchasedCourses.length} course${purchasedCourses.length > 1 ? 's' : ''} in your library`
              : 'Your purchased courses will appear here'
            }
          </p>
        </div>

        {purchasedCourses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {purchasedCourses.map((course, i) => (
              <Link 
                key={course.id}
                to={`/course/${course.id}`}
                className="opacity-0 animate-fade-in bg-card rounded-2xl border border-border shadow-card p-5 hover:shadow-glow transition-all btn-thud"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display font-semibold text-primary uppercase tracking-wide mb-1">
                      {course.code}
                    </p>
                    <h3 className="font-display font-semibold text-foreground line-clamp-2 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {course.questionCount} questions
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-card">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground text-lg mb-2">Your library is empty</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Get your first tutorial questions answers and it will appear here.
            </p>
            <Button asChild>
              <Link to="/dashboard">Browse Courses</Link>
            </Button>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
