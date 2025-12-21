import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses"; // IMPORT ADDED
import { useToast } from "@/hooks/use-toast";
import { Wallet, BookOpen, LogOut, ArrowLeft, Copy, ChevronRight, CheckCircle } from "lucide-react";

export default function Profile() {
  const { user, profile, isLoading, logout, purchases } = useAuth();
  const { courses } = useCourses(); // GET COURSES LIST
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

  // HELPER TO FIND COURSE NAME
  const getCourseInfo = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? { code: course.code, title: course.title } : { code: 'Unknown', title: 'Loading...' };
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${user.id}`);
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
    <div className="min-h-screen bg-[#F8FAFC] pb-32 md:pb-0 font-sans">
      <Header isLoggedIn userName={profile?.full_name || ''} />
      
      <main className="container py-8 max-w-xl px-6">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-6 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-1">{profile?.full_name}</h1>
          <p className="text-slate-500 font-medium">{user?.email}</p>
          <p className="text-xs font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded-md mt-3">
            {profile?.faculty} • {profile?.level}
          </p>
        </div>

        {/* Wallet Card */}
        <div className="bg-[#0F172A] rounded-3xl p-6 mb-8 text-white shadow-[0_20px_40px_rgba(0,0,0,0.1)] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Referral Earnings</p>
                <p className="text-3xl font-bold">₦0</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1 bg-white/10 text-white hover:bg-white/20 border-none rounded-xl font-bold"
                onClick={handleWithdraw}
              >
                Withdraw
              </Button>
              <Button 
                variant="secondary"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 border-none rounded-xl font-bold shadow-lg shadow-blue-600/20"
                onClick={handleCopyReferral}
              >
                <Copy className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>

        {/* Library List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-50 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-[#0F172A]">My Library</h3>
          </div>
          
          <div className="p-2">
            {purchases.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-400 font-medium">No purchases yet</p>
                <Link to="/dashboard" className="text-blue-600 font-bold text-sm hover:underline mt-2 inline-block">
                  Browse courses
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {purchases.map((courseId) => {
                  // FIX APPLIED HERE: LOOKUP THE NAME
                  const info = getCourseInfo(courseId);
                  
                  return (
                    <Link 
                      key={courseId}
                      to={`/course/${courseId}`}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          {/* SHOW THE REAL NAME, NOT THE ID */}
                          <p className="font-bold text-[#0F172A]">{info.code}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate w-48">
                            {info.title}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <button 
          className="w-full py-4 text-red-500 font-bold text-sm hover:bg-red-50 rounded-2xl transition-colors flex items-center justify-center gap-2"
          onClick={async () => { await logout(); navigate("/login"); }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </main>

      <MobileBottomNav />
    </div>
  );
}
