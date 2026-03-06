import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { BookPlus, BookOpen, LogOut, ArrowLeft, ChevronRight } from "lucide-react";
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
          <div className="mb-8 space-y-2">
            <div className="h-7 w-40 bg-secondary rounded-lg animate-pulse"></div>
            <div className="h-4 w-48 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-4 w-32 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-secondary rounded animate-pulse"></div>
                <div className="h-3 w-48 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-secondary rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="h-10 w-full bg-muted rounded-lg animate-pulse"></div>
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
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">{profile?.full_name}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.faculty} • {profile?.level}
          </p>
        </div>

        {/* Request a Course Card */}
        <Link
          to="/request-course"
          className="w-full bg-card rounded-2xl border border-border shadow-card p-5 mb-6 flex items-center justify-between hover:bg-secondary/30 transition-colors group btn-thud"
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
          className="w-full bg-card rounded-2xl border border-border shadow-card p-5 mb-6 flex items-center justify-between hover:bg-secondary/30 transition-colors group btn-thud"
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
