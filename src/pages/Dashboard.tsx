import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CourseCard } from "@/components/CourseCard";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getCoursesByFacultyAndLevel, courses } from "@/data/courses";
import { BookOpen, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { user, profile, isLoading, purchases } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  // Show welcome toast when profile loads after successful login
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('showWelcomeToast');
    if (justLoggedIn && profile?.full_name) {
      sessionStorage.removeItem('showWelcomeToast');
      toast({
        title: `Welcome back, ${profile.full_name.split(' ')[0]}!`,
        className: "bg-navy text-primary-foreground border-navy",
        description: (
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>You're all set to continue learning.</span>
          </div>
        ) as unknown as string,
      });
    }
  }, [profile, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const filteredCourses = getCoursesByFacultyAndLevel(profile?.faculty || '', profile?.level || '');
  const displayCourses = filteredCourses.length > 0 ? filteredCourses : courses;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Hi, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-muted-foreground">
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
                  questionsCount={course.questions.length}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No courses available</h3>
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
