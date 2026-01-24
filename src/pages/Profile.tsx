import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { BookPlus, BookOpen, LogOut, ArrowLeft, ChevronRight } from "lucide-react";

export default function Profile() {
  const { user, profile, isLoading, logout, purchases } = useAuth();
  const { courses, isLoading: coursesLoading } = useCourses();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 max-w-xl px-4">
          <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse mb-6"></div>
          <div className="mb-8 space-y-2">
            <div className="h-7 w-40 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-48 bg-slate-100 rounded-lg animate-pulse"></div>
            <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse"></div>
          </div>
          {/* Request Course Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 w-48 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          {/* Library Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6 shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-slate-100 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="h-5 w-20 bg-slate-100 rounded animate-pulse"></div>
              <div className="h-5 w-24 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse"></div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (!user) return null;

  // --- LOGIC FIX START ---
  const getCourseCode = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.code : "Course"; // Shows IRM 103 instead of long ID
  };
  // --- LOGIC FIX END ---

  const handleLogout = async () => {
    navigate("/login");
    await logout();
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 max-w-xl">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">{profile?.full_name}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.faculty} • {profile?.level}
          </p>
        </div>

        {/* Request a Course Card */}
        <Link
          to="/request-course"
          className="w-full bg-card rounded-2xl border border-border/50 shadow-card p-5 mb-6 flex items-center justify-between hover:bg-secondary/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <BookPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Request a Course</h3>
              <p className="text-sm text-muted-foreground">Don't see your course? Let us know</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>

        {/* Library */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden mb-6">
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">My Library</h3>
                <p className="text-sm text-muted-foreground">{purchases.length} courses purchased</p>
              </div>
            </div>
          </div>
          
          {purchases.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No purchases yet</p>
              <Link to="/dashboard" className="text-primary text-sm hover:underline">
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {purchases.map((courseId) => (
                <Link 
                  key={courseId}
                  to={`/course/${courseId}`}
                  className="block p-5 hover:bg-secondary/50 transition-colors"
                >
                  {/* FIXED HERE: Now calls getCourseCode function */}
                  <span className="text-sm font-medium text-foreground uppercase">
                    {getCourseCode(courseId)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </main>

      <MobileBottomNav />
    </div>
  );
}
