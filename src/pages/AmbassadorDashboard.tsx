import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { allDepartments } from "@/data/departments";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  X,
  Trophy,
  Crown,
  Copy,
  Check,
  Link2,
  MessageCircle,
  Target,
  Users,
  Award,
  ChevronDown,
  Plus,
  Pencil,
} from "lucide-react";
import { motion } from "framer-motion";

interface UploadRecord {
  id: string;
  course_code: string;
  course_title: string;
  department: string;
  pdf_url: string | null;
  status: string;
  created_at: string;
  questions_generated: number | null;
  error_message: string | null;
}

interface DeptStats {
  department: string;
  unique_buyers: number;
  total_unlocks: number;
  avg_per_buyer: number;
  rank: number;
}

interface MilestoneRecord {
  tier: number;
  bonus_amount: number;
  achieved_at: string;
}

const MILESTONES = [
  { tier: 1, threshold: 40, bonus: 7500, label: "Getting Started" },
  { tier: 2, threshold: 80, bonus: 7500, label: "Growing" },
  { tier: 3, threshold: 150, bonus: 15000, label: "Running the Dept" },
];

const LEADERBOARD_REWARDS = [
  { rank: 1, reward: 50000, emoji: "🥇" },
  { rank: 2, reward: 30000, emoji: "🥈" },
  { rank: 3, reward: 20000, emoji: "🥉" },
  { rank: 4, reward: 10000, emoji: "4th" },
  { rank: 5, reward: 10000, emoji: "5th" },
];

export default function AmbassadorDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isAmbassador, isAdmin, isLoading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);
  const [showPrizes, setShowPrizes] = useState(false);

  // Department stats
  const [myDeptStats, setMyDeptStats] = useState<DeptStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<DeptStats[]>([]);
  const [achievedMilestones, setAchievedMilestones] = useState<MilestoneRecord[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Referral stats
  const [referrals, setReferrals] = useState<{ status: string }[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);

  // Course form state (kept, but moved into a dedicated section)
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [department, setDepartment] = useState(profile?.faculty || "");
  const [level, setLevel] = useState("100L");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAmbassador && !isAdmin && user) {
      toast({ title: "Access denied", description: "You don't have ambassador privileges.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [isAmbassador, isAdmin, roleLoading, user, navigate, toast]);

  const firstName = profile?.full_name?.split(" ")[0]?.toLowerCase() || "ambassador";
  const referralCode = user ? `${firstName}-${user.id.slice(0, 6)}` : "";

  useEffect(() => {
    if (user && profile && !(profile as any).referral_code && referralCode) {
      supabase.from("profiles").update({ referral_code: referralCode }).eq("id", user.id).then(() => {});
    }
  }, [profile, referralCode, user]);

  useEffect(() => {
    if (profile?.faculty) setDepartment(profile.faculty);
  }, [profile]);

  // Fetch department stats + leaderboard + milestones
  useEffect(() => {
    if (!user || !profile?.faculty) return;

    const fetchStats = async () => {
      setStatsLoading(true);

      // Get active semester
      const { data: semester } = await supabase
        .from("semester_config")
        .select("id, created_at")
        .eq("is_active", true)
        .maybeSingle();

      const since = semester?.created_at || "2020-01-01T00:00:00Z";

      // Fetch leaderboard
      const { data: lb } = await supabase.rpc("get_department_leaderboard", { p_since: since });

      if (lb) {
        const mapped = lb.map((r: any) => ({
          department: r.department,
          unique_buyers: Number(r.unique_buyers),
          total_unlocks: Number(r.total_unlocks),
          avg_per_buyer: Number(r.avg_per_buyer),
          rank: Number(r.rank),
        }));
        setLeaderboard(mapped.slice(0, 5));

        const myStats = mapped.find((s: DeptStats) => s.department === profile.faculty);
        setMyDeptStats(myStats || null);
      }

      // Fetch achieved milestones for my department
      if (semester) {
        const { data: milestones } = await supabase
          .from("department_milestones")
          .select("tier, bonus_amount, achieved_at")
          .eq("department", profile.faculty!)
          .eq("semester_id", semester.id);
        setAchievedMilestones((milestones as MilestoneRecord[]) || []);
      }

      setStatsLoading(false);
    };

    fetchStats();
  }, [user, profile]);

  // Fetch referrals for this ambassador (counts only)
  useEffect(() => {
    if (!user) return;
    const fetchReferrals = async () => {
      setReferralsLoading(true);
      const { data: refs } = await supabase
        .from("referrals")
        .select("status")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      setReferrals((refs as any) || []);
      setReferralsLoading(false);
    };
    fetchReferrals();
  }, [user]);

  // Fetch uploads
  useEffect(() => {
    if (!user || !department) return;
    const fetchUploads = async () => {
      const { data } = await supabase
        .from("course_uploads")
        .select("*")
        .eq("department", department)
        .order("course_code", { ascending: true });
      if (data) setUploads(data as UploadRecord[]);
    };
    fetchUploads();

    const channel = supabase
      .channel("ambassador-upload-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "course_uploads",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === payload.new.id ? ({ ...u, ...payload.new } as UploadRecord) : u)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, department]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).filter((f) => {
      if (!f.name.toLowerCase().endsWith(".pdf")) {
        toast({ title: `${f.name} skipped`, description: "Only PDF files are accepted.", variant: "destructive" });
        return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast({ title: `${f.name} skipped`, description: "File exceeds 20MB limit.", variant: "destructive" });
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    if (!courseCode.trim() || !courseTitle.trim() || !department) {
      toast({
        title: "Missing fields",
        description: "Please fill in course code, title, and department.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    try {
      const normalizedCode = courseCode.trim().toUpperCase();

      // Check if course already exists for this department
      const existing = uploads.find((u) => u.course_code === normalizedCode && u.department === department);

      if (existing && files.length === 0) {
        toast({
          title: "Course already registered",
          description: `${normalizedCode} is already in your department's list.`,
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      let pdfUrl: string | null = null;

      // Upload files if any were added
      if (files.length > 0) {
        const pdfUrls: string[] = [];
        for (const file of files) {
          const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const filePath = `pdfs/${user!.id}/${fileName}`;
          const { data: fileData, error: uploadError } = await supabase.storage.from("course_materials").upload(filePath, file);
          if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from("course_materials").getPublicUrl(fileData.path);
          pdfUrls.push(urlData.publicUrl);
        }
        pdfUrl = pdfUrls[0];
      }

      if (existing && files.length > 0) {
        // Add materials to existing course
        const { error: updateError } = await supabase
          .from("course_uploads")
          .update({ pdf_url: pdfUrl, status: "pending" })
          .eq("id", existing.id);
        if (updateError) throw new Error(`Update failed: ${updateError.message}`);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === existing.id ? ({ ...u, pdf_url: pdfUrl || u.pdf_url, status: "pending" } as any) : u,
          ),
        );
        toast({ title: "✨ Materials added!", description: `Materials uploaded for ${normalizedCode}. Our team will review them soon.` });
      } else {
        const { data: uploadRecord, error: insertError } = await supabase
          .from("course_uploads")
          .insert({
            user_id: user!.id,
            course_code: normalizedCode,
            course_title: courseTitle.trim(),
            department,
            level,
            pdf_url: pdfUrl,
            status: "pending",
          })
          .select()
          .single();
        if (insertError) {
          if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
            toast({
              title: "Course already exists",
              description: `${normalizedCode} is already registered for ${department}.`,
              variant: "destructive",
            });
            setIsUploading(false);
            return;
          }
          throw new Error(`Record creation failed: ${insertError.message}`);
        }
        setUploads((prev) => [uploadRecord as UploadRecord, ...prev]);
        toast({
          title: files.length > 0 ? "✨ Uploaded successfully!" : "✅ Course Registered!",
          description: files.length > 0 ? "You'll be notified when the answers and quiz are ready." : "Course saved. You can upload materials later.",
        });
      }

      setCourseCode("");
      setCourseTitle("");
      setFiles([]);
      setIsAddCourseOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 md:px-6 max-w-2xl mx-auto">
          <div className="bg-foreground rounded-3xl p-6 mb-6 relative overflow-hidden animate-pulse">
            <div className="relative z-10 space-y-2">
              <div className="h-3 w-32 rounded bg-cream/[0.08]" />
              <div className="h-10 w-48 rounded-lg bg-cream/10" />
              <div className="h-3 w-56 rounded bg-cream/[0.05]" />
            </div>
            <div className="mt-5 h-11 w-full rounded-xl bg-cream/[0.08]" />
          </div>

          <div className="bg-card rounded-3xl card-float p-6 space-y-5 animate-pulse">
            <div className="h-6 w-40 bg-muted rounded-lg" />
            <div className="h-12 w-full bg-secondary/40 rounded-2xl" />
            <div className="h-20 w-full bg-secondary/30 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!user || (!isAmbassador && !isAdmin)) return null;

  const walletBalance = profile ? (profile as any).wallet_balance || 0 : 0;
  const vipLink = `https://lcuprep.study/vip/${referralCode}`;

  // Milestone progress — based on total course unlocks, not unique buyers
  const totalUnlocks = myDeptStats?.total_unlocks || 0;
  const uniqueBuyers = myDeptStats?.unique_buyers || 0;

  const currentTier = MILESTONES.filter((m) => totalUnlocks >= m.threshold).length;
  const nextMilestone = MILESTONES[currentTier] || null;
  const prevThreshold = currentTier > 0 ? MILESTONES[currentTier - 1].threshold : 0;
  const progressToNext = nextMilestone
    ? Math.min(100, ((totalUnlocks - prevThreshold) / (nextMilestone.threshold - prevThreshold)) * 100)
    : 100;

  const convertedCount = referrals.filter((r) => r.status === "converted").length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(vipLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied", description: "Share it in your department group." });
  };

  const handleWhatsAppShare = () => {
    const text = `LCU Prep just dropped for ${profile?.faculty || "your department"}.\nTutorial questions solved + quizzes to test yourself before exam. ₦1,000 per course — less than one photocopy.\n\nCheck your courses: ${vipLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 page-enter">
      <Header isLoggedIn userName={profile?.full_name || ""} />

      <main className="container py-8 px-4 md:px-6 max-w-2xl mx-auto space-y-6">
        {/* SECTION 1: THE MONEY CARD */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-foreground rounded-3xl p-6 text-background shadow-elevated relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-background/40 uppercase tracking-[0.2em] mb-1">Your Earnings</p>
            <h1 className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-background">₦{walletBalance.toLocaleString()}</h1>
            <p className="text-xs text-background/60 mt-1">
              ₦{walletBalance.toLocaleString()} this semester · {totalUnlocks} course unlock{totalUnlocks === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-5 space-y-3 relative z-10">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/withdraw")}
              className="w-full h-11 rounded-xl font-bold text-sm bg-background text-foreground flex items-center justify-center gap-2 btn-thud"
            >
              <Wallet className="w-4 h-4" /> Withdraw to Bank
            </motion.button>

            {statsLoading ? (
              <div className="h-10 rounded-xl bg-cream/[0.06] animate-pulse" />
            ) : nextMilestone ? (
              <div className="rounded-2xl bg-cream/[0.06] border border-cream/[0.08] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-background/80">Next milestone</p>
                  <p className="text-xs text-background/60">
                    {totalUnlocks} / {nextMilestone.threshold} unlocks
                  </p>
                </div>
                <Progress value={progressToNext} className="h-2 bg-cream/[0.12]" />
                <p className="text-xs text-background/60 mt-2">
                  <span className="font-bold text-background">{nextMilestone.threshold - totalUnlocks} more unlocks</span> → +₦{nextMilestone.bonus.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-cream/[0.06] border border-cream/[0.08] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-300" />
                  <p className="text-sm font-semibold">All milestones achieved</p>
                </div>
                <span className="text-xs text-background/60">Maximum rewards</span>
              </div>
            )}
          </div>

          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl -mr-10 -mt-10" />
        </motion.div>

        {/* SECTION 2: SHARE & EARN */}
        <div className="bg-card rounded-3xl card-float p-6 space-y-4">
          <div>
            <h2 className="text-lg font-display font-bold">Share & Earn</h2>
            <p className="text-xs text-muted-foreground mt-1">Every student in your department who buys = money for you.</p>
          </div>

          <div className="bg-secondary/70 rounded-xl px-4 py-3 flex items-center gap-3">
            <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-mono text-foreground truncate flex-1">{vipLink}</span>
            <button
              onClick={handleCopyLink}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted/40 transition-colors"
              aria-label="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleWhatsAppShare}
            className="w-full h-12 rounded-xl font-bold text-sm bg-[#25D366] text-white flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Share on WhatsApp
          </motion.button>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {referralsLoading ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</span>
            ) : (
              <span>
                {referrals.length} signups · {convertedCount} converted
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> {uniqueBuyers} buyers
            </span>
          </div>
        </div>

        {/* SECTION 3: DEPARTMENT RACE */}
        <div className="bg-card rounded-3xl card-float p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Department Race</h2>
            </div>
            {myDeptStats?.rank ? (
              <span className="text-xs font-mono text-muted-foreground">#{myDeptStats.rank}</span>
            ) : null}
          </div>

          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">Your department: {profile?.faculty || "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {myDeptStats ? `Currently: #${myDeptStats.rank} (${totalUnlocks} unlocks)` : "Currently: not ranked (0 unlocks)"}
              </p>
            </div>
            {currentTier > 0 && (
              <div className="flex items-center gap-1 bg-accent/10 text-accent rounded-full px-3 py-1">
                <Award className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{MILESTONES[currentTier - 1].label}</span>
              </div>
            )}
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No department data yet this semester.</p>
          ) : (
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="px-4 py-3 bg-secondary/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Departments</p>
              </div>
              <div className="divide-y divide-border/60">
                {leaderboard.map((entry, idx) => {
                  const isMyDept = entry.department === profile?.faculty;
                  const rank = idx + 1;
                  return (
                    <div key={entry.department} className={`px-4 py-3 flex items-center justify-between ${isMyDept ? "bg-accent/5" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rank === 1 ? "bg-amber-100 text-amber-800" : rank === 2 ? "bg-secondary text-muted-foreground" : rank === 3 ? "bg-orange-100 text-orange-800" : "bg-secondary text-muted-foreground"}`}>
                          {rank}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm truncate ${isMyDept ? "font-bold" : "font-medium"}`}>{isMyDept ? `${entry.department} (You)` : entry.department}</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold text-accent">{entry.total_unlocks}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowPrizes((s) => !s)}
            className="w-full flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-left"
          >
            <span className="text-xs text-muted-foreground">Top 5 win up to <span className="font-bold text-foreground">₦50,000</span></span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showPrizes ? "rotate-180" : ""}`} />
          </button>

          {showPrizes && (
            <div className="space-y-1.5">
              {LEADERBOARD_REWARDS.map((lr) => (
                <div key={lr.rank} className="flex items-center justify-between rounded-xl px-4 py-2.5 bg-secondary/40">
                  <div className="flex items-center gap-3">
                    <span className="text-base w-7 text-center">{lr.emoji}</span>
                    <span className="text-sm font-semibold">{lr.rank}{lr.rank === 1 ? "st" : lr.rank === 2 ? "nd" : lr.rank === 3 ? "rd" : "th"} Place</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-muted-foreground">₦{lr.reward.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: YOUR COURSES */}
        <div className="bg-card rounded-3xl card-float p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold">Your Department Courses</h2>
              <p className="text-xs text-muted-foreground mt-1">{uploads.length} course{uploads.length === 1 ? "" : "s"} registered</p>
            </div>
            <button
              onClick={() => setIsAddCourseOpen((s) => !s)}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {isAddCourseOpen && (
            <div className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode" className="text-xs font-bold uppercase tracking-wider">
                    Course Code
                  </Label>
                  <Input id="courseCode" placeholder="e.g. BUS 101" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="rounded-xl" maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-xs font-bold uppercase tracking-wider">
                    Level
                  </Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["100L", "200L", "300L", "400L", "500L"].map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseTitle" className="text-xs font-bold uppercase tracking-wider">
                  Course Title
                </Label>
                <Input id="courseTitle" placeholder="e.g. Introduction to Business" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="rounded-xl" maxLength={100} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-xs font-bold uppercase tracking-wider">
                  Department
                </Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {allDepartments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Materials (Optional)</Label>
                <label
                  htmlFor="pdfFile"
                  className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${
                    files.length > 0 ? "border-accent/40 bg-accent/[0.03]" : "border-border hover:border-accent/40 hover:bg-accent/[0.04]"
                  }`}
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Tap to add PDFs</p>
                    <p className="text-xs text-muted-foreground">Max 20MB each</p>
                  </div>
                  <input ref={fileInputRef} id="pdfFile" type="file" accept=".pdf" multiple className="hidden" onChange={handleFilesSelected} />
                </label>

                {files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-medium truncate">{f.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                        <button onClick={() => removeFile(i)} className="p-1 hover:bg-muted rounded-lg">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleUpload}
                disabled={isUploading || !courseCode || !courseTitle || !department}
                className="w-full h-12 rounded-xl font-bold text-sm bg-foreground text-background disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 btn-thud"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" /> Submit
                  </>
                )}
              </motion.button>
            </div>
          )}

          {uploads.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No courses registered yet.</p>
          ) : (
            <div className="space-y-2">
              {uploads.map((u) => (
                <div key={u.id} className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-muted-foreground">{u.course_code}</p>
                    <p className="text-sm font-semibold truncate">{u.course_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {u.pdf_url ? "Materials uploaded" : "No materials yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusIcon(u.status)}
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
