import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Wallet, BookOpen, LogOut, ArrowLeft, Copy } from "lucide-react";

export default function Profile() {
  const { user, profile, isLoading, logout, purchases } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${user.id}`);
    toast({
      title: "Link copied!",
      description: "Share it with your friends to earn rewards.",
    });
  };

  const handleWithdraw = () => {
    toast({
      title: "Coming Soon",
      description: "Withdrawals will be available soon.",
    });
  };

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

        {/* Wallet Card */}
        <div className="bg-navy rounded-2xl p-6 mb-6 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-primary-foreground/70">Referral Earnings</p>
              <p className="text-2xl font-bold">₦0</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleWithdraw}
            >
              Withdraw
            </Button>
            <Button 
              variant="secondary"
              className="flex-1 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleCopyReferral}
            >
              <Copy className="w-4 h-4" />
              Invite Friend
            </Button>
          </div>
        </div>

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
                  <span className="text-sm font-medium text-foreground uppercase">{courseId}</span>
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
