import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BookPlus, BookOpen, LogOut, ArrowLeft, ChevronRight, User } from "lucide-react";
import { TextShimmer } from "@/components/ui/text-shimmer";

export default function Profile() {
  const { user, profile, isLoading, logout, purchases } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 max-w-xl px-4">
          <TextShimmer className="text-lg font-display font-bold mb-6" duration={1.2}>Profile</TextShimmer>
          {/* Avatar header skeleton */}
          <div className="bg-card rounded-3xl border border-border shadow-card p-6 mb-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-secondary animate-pulse mb-4"></div>
            <div className="h-6 w-40 bg-secondary rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-muted rounded-lg animate-pulse mb-1"></div>
            <div className="h-3 w-32 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-secondary rounded animate-pulse"></div>
                  <div className="h-3 w-48 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-secondary rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    navigate("/login");
    await logout();
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 page-enter">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 max-w-xl px-4">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Profile Header Card */}
        <div className="bg-card rounded-3xl border border-border shadow-card p-8 mb-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4">
            <span className="text-2xl font-display font-bold text-primary" style={{ letterSpacing: '-0.03em' }}>
              {getInitials(profile?.full_name)}
            </span>
          </div>
          <h1 className="text-xl font-display font-bold text-foreground mb-0.5">{profile?.full_name}</h1>
          <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
          <p className="text-xs font-mono tracking-wider uppercase text-muted-foreground">
            {profile?.faculty} · {profile?.level}
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          {/* Request a Course Card */}
          <Link
            to="/request-course"
            className="w-full bg-card rounded-2xl border border-border shadow-card p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors group btn-thud"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Request a Course</h3>
                <p className="text-sm text-muted-foreground">Don't see your course? Let us know</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          {/* Library */}
          <Link
            to="/library"
            className="w-full bg-card rounded-2xl border border-border shadow-card p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors group btn-thud"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">My Library</h3>
                <p className="text-sm text-muted-foreground">
                  {purchases.length > 0 
                    ? `${purchases.length} course${purchases.length > 1 ? 's' : ''} purchased`
                    : 'No purchases yet'
                  }
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          {/* Logout */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-2xl h-14 px-5"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign out
          </Button>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
