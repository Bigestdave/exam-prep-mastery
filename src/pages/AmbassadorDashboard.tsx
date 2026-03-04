import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { allDepartments } from "@/data/departments";
import {
  Upload, FileText, Loader2, CheckCircle2, AlertCircle, Clock,
  Wallet, X, Trophy, Crown, Copy, Check, Link2, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadRecord {
  id: string;
  course_code: string;
  course_title: string;
  department: string;
  status: string;
  created_at: string;
  questions_generated: number | null;
  error_message: string | null;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  upload_count: number;
}

type TabKey = "sell" | "bounties";

export default function AmbassadorDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isAmbassador, isAdmin, isLoading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("sell");
  const [copied, setCopied] = useState(false);

  // Bounty form state
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [department, setDepartment] = useState(profile?.faculty || "");
  const [level, setLevel] = useState("100L");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAmbassador && !isAdmin && user) {
      toast({ title: "Access denied", description: "You don't have ambassador privileges.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [isAmbassador, isAdmin, roleLoading, user, navigate, toast]);

  // Ensure referral_code is set on profile for VIP link
  const firstName = profile?.full_name?.split(" ")[0]?.toLowerCase() || "ambassador";
  const referralCode = user ? `${firstName}-${user.id.slice(0, 6)}` : "";

  useEffect(() => {
    if (user && profile && !(profile as any).referral_code && referralCode) {
      supabase
        .from("profiles")
        .update({ referral_code: referralCode })
        .eq("id", user.id)
        .then(() => {});
    }
  }, [profile, referralCode, user]);

  useEffect(() => {
    if (profile?.faculty) setDepartment(profile.faculty);
  }, [profile]);

  // Fetch uploads
  useEffect(() => {
    if (!user) return;
    const fetchUploads = async () => {
      const { data } = await supabase
        .from("course_uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setUploads(data as UploadRecord[]);
    };
    fetchUploads();

    const channel = supabase
      .channel("ambassador-upload-status")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "course_uploads",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setUploads(prev =>
          prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } as UploadRecord : u)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("course_uploads")
        .select("user_id")
        .eq("status", "complete");

      if (data) {
        const counts = new Map<string, number>();
        data.forEach(row => {
          counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
        });

        const sorted = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        if (sorted.length > 0) {
          const userIds = sorted.map(([id]) => id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

          const nameMap = new Map(profiles?.map(p => [p.id, p.full_name || "Anonymous"]) ?? []);
          setLeaderboard(sorted.map(([id, count]) => ({
            user_id: id,
            full_name: nameMap.get(id) || "Anonymous",
            upload_count: count,
          })));
        }
      }
    };
    fetchLeaderboard();
  }, [uploads]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).filter(f => {
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
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !courseCode.trim() || !courseTitle.trim() || !department) {
      toast({ title: "Missing fields", description: "Please fill in all fields and add at least one PDF.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const pdfUrls: string[] = [];
      for (const file of files) {
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const filePath = `pdfs/${user!.id}/${fileName}`;

        const { data: fileData, error: uploadError } = await supabase.storage
          .from("course_materials")
          .upload(filePath, file);

        if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("course_materials")
          .getPublicUrl(fileData.path);

        pdfUrls.push(urlData.publicUrl);
      }

      const { data: uploadRecord, error: insertError } = await supabase
        .from("course_uploads")
        .insert({
          user_id: user!.id,
          course_code: courseCode.trim().toUpperCase(),
          course_title: courseTitle.trim(),
          department,
          level,
          pdf_url: pdfUrls[0],
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw new Error(`Record creation failed: ${insertError.message}`);

      const { error: fnError } = await supabase.functions.invoke("trigger-processing", {
        body: {
          course_code: courseCode.trim().toUpperCase(),
          course_title: courseTitle.trim(),
          department,
          level,
          pdf_urls: pdfUrls,
          upload_id: uploadRecord.id,
        },
      });

      if (fnError) throw new Error(`Processing trigger failed: ${fnError.message}`);

      setUploads(prev => [uploadRecord as UploadRecord, ...prev]);
      setCourseCode("");
      setCourseTitle("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({ title: "✨ Bounty Submitted!", description: "AI is generating the course content. You'll earn ₦500 when approved." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Something went wrong.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "complete": return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "processing": return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 md:px-6 max-w-2xl mx-auto">
          {/* Wallet skeleton */}
          <div className="bg-foreground rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="h-3 w-28 bg-background/10 rounded animate-pulse" />
              <div className="h-10 w-44 bg-background/10 rounded-lg animate-pulse" />
              <div className="h-3 w-32 bg-background/10 rounded animate-pulse" />
            </div>
            <div className="mt-5 h-11 w-full bg-background/10 rounded-xl animate-pulse" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl -mr-10 -mt-10" />
          </div>

          {/* Tab switcher skeleton */}
          <div className="bg-secondary rounded-2xl p-1 flex mb-8">
            <div className="flex-1 h-14 bg-background rounded-xl animate-pulse" />
            <div className="flex-1 h-14 bg-transparent rounded-xl" />
          </div>

          {/* Content skeleton */}
          <div className="bg-card rounded-3xl p-6 space-y-4">
            <div className="h-5 w-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            <div className="h-12 w-full bg-secondary/70 rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-muted rounded-xl animate-pulse" />
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (!user || (!isAmbassador && !isAdmin)) return null;

  const walletBalance = profile ? (profile as any).wallet_balance || 0 : 0;
  const vipLink = `lcuprep.lovable.app/vip/${referralCode}`;
  const completedUploads = uploads.filter(u => u.status === "complete").length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${vipLink}`);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your coursemates." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Use my VIP link to get started on LCU Prep past questions!\nhttps://${vipLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 page-enter">
      <Header isLoggedIn userName={profile?.full_name || ""} />

      <main className="container py-8 px-4 md:px-6 max-w-2xl mx-auto">
        {/* ─── THE BANK ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-foreground rounded-3xl p-6 text-background shadow-elevated mb-6 relative overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-background/40 uppercase tracking-[0.2em] mb-1">
              Ambassador Wallet
            </p>
            <h1 className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-background">
              ₦{walletBalance.toLocaleString()}
            </h1>
            <p className="text-xs text-background/50 mt-1">
              {completedUploads} bounties completed
            </p>
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/withdraw")}
            className="w-full mt-5 h-11 rounded-xl font-bold text-sm bg-background text-foreground flex items-center justify-center gap-2 btn-thud"
          >
            <Wallet className="w-4 h-4" />
            Withdraw to Bank
          </motion.button>

          {/* Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl -mr-10 -mt-10" />
        </motion.div>

        {/* ─── TAB SWITCHER ─── */}
        <div className="bg-secondary rounded-2xl p-1 flex mb-8">
          {([
            { key: "sell" as TabKey, label: "Sell", sublabel: "Referrals", icon: <Link2 className="w-3.5 h-3.5" /> },
            { key: "bounties" as TabKey, label: "Bounties", sublabel: "Upload PDFs", icon: <FileText className="w-3.5 h-3.5" /> },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">{tab.icon} {tab.label}</span>
              <span className="block text-[10px] font-medium opacity-60 mt-0.5">{tab.sublabel}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "sell" ? (
            <motion.div
              key="sell"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* ─── THE WEAPON CARD ─── */}
              <div className="bg-card rounded-3xl card-float p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-display font-bold">Your VIP Link</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Give a coursemate <span className="font-bold text-accent">₦500 off</span>. You get <span className="font-bold text-accent">₦500 instantly</span> when they buy.
                  </p>
                </div>

                {/* Link display */}
                <div className="bg-secondary/70 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono text-foreground truncate flex-1">{vipLink}</span>
                </div>

                {/* Copy button */}
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopyLink}
                  className="w-full h-12 rounded-xl font-bold text-sm bg-foreground text-background flex items-center justify-center gap-2 btn-thud"
                >
                  {copied ? (
                    <><Check className="w-4 h-4" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copy Link</>
                  )}
                </motion.button>

                {/* WhatsApp button */}
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWhatsAppShare}
                  className="w-full h-11 rounded-xl font-bold text-sm bg-[#25D366] text-white flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Share on WhatsApp
                </motion.button>
              </div>

              {/* ─── LEADERBOARD ─── */}
              <div className="bg-card rounded-3xl card-float p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Trophy className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Campus Top Earners</h2>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Be the first to earn! Share your link above.
                  </p>
                ) : (
                  <div className="space-y-0">
                    {leaderboard.map((entry, i) => {
                      const isCurrentUser = entry.user_id === user?.id;
                      const earnings = entry.upload_count * 500;
                      return (
                        <div
                          key={entry.user_id}
                          className={`flex items-center justify-between py-3.5 ${
                            i < leaderboard.length - 1 ? "border-b border-dashed border-border" : ""
                          } ${isCurrentUser ? "bg-accent/5 -mx-3 px-3 rounded-xl" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 0
                                ? "bg-amber-100 text-amber-700"
                                : i === 1
                                  ? "bg-secondary text-muted-foreground"
                                  : i === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-secondary text-muted-foreground"
                            }`}>
                              {i === 0 ? <Crown className="w-3.5 h-3.5" /> : i + 1}
                            </div>
                            <div>
                              <span className={`text-sm block ${isCurrentUser ? "font-bold text-foreground" : "text-foreground/80"}`}>
                                {isCurrentUser ? "You" : entry.full_name?.split(" ")[0] || "Anon"}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-mono font-bold text-accent">
                            ₦{earnings.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Motivational nudge */}
                {leaderboard.length > 0 && leaderboard[0]?.user_id !== user?.id && (
                  <div className="mt-5 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      You need <span className="font-bold text-foreground">{Math.max(1, (leaderboard[0]?.upload_count ?? 0) + 1 - completedUploads)} more sales</span> to take the lead 🔥
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="bounties"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* ─── BOUNTY HEADER ─── */}
              <div className="mb-2">
                <h2 className="text-lg font-display font-bold">Help Build The Dossier.</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload verified tutorial PDFs. If our AI approves it, you earn <span className="font-bold text-accent">₦500 per course</span>.
                </p>
              </div>

              {/* ─── UPLOAD FORM ─── */}
              <div className="bg-card rounded-3xl card-float p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseCode" className="text-xs font-bold uppercase tracking-wider">Course Code</Label>
                    <Input
                      id="courseCode"
                      placeholder="e.g. BUS 101"
                      value={courseCode}
                      onChange={e => setCourseCode(e.target.value)}
                      className="rounded-xl"
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level" className="text-xs font-bold uppercase tracking-wider">Level</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["100L", "200L", "300L", "400L", "500L"].map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseTitle" className="text-xs font-bold uppercase tracking-wider">Course Title</Label>
                  <Input
                    id="courseTitle"
                    placeholder="e.g. Introduction to Business"
                    value={courseTitle}
                    onChange={e => setCourseTitle(e.target.value)}
                    className="rounded-xl"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-xs font-bold uppercase tracking-wider">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {allDepartments.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Tutorial PDFs</Label>
                  <label
                    htmlFor="pdfFile"
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
                      files.length > 0
                        ? "border-accent/40 bg-accent/[0.03]"
                        : "border-border hover:border-accent/40 hover:bg-accent/[0.04]"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">Tap to add PDFs</p>
                      <p className="text-xs text-muted-foreground">Max 20MB each · You can add multiple</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      id="pdfFile"
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleFilesSelected}
                    />
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
                  disabled={isUploading || files.length === 0 || !courseCode || !courseTitle || !department}
                  className="w-full h-12 rounded-xl font-bold text-sm bg-foreground text-background disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 btn-thud"
                >
                  {isUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> ✨ Getting Your Course Ready...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Submit Bounty</>
                  )}
                </motion.button>
              </div>

              {/* Most Recent Upload */}
              {uploads.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Recent Bounties</h2>
                  <div className="space-y-2">
                    {uploads.slice(0, 2).map(u => (
                      <div key={u.id} className="bg-card rounded-2xl border border-border/50 p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-mono text-muted-foreground">{u.course_code}</p>
                          <p className="text-sm font-semibold">{u.course_title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {u.department} · {new Date(u.created_at).toLocaleDateString()}
                          </p>
                          {u.error_message && (
                            <p className="text-xs text-destructive mt-1">{u.error_message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {u.questions_generated && u.questions_generated > 0 && (
                            <span className="text-xs text-muted-foreground">{u.questions_generated} Qs</span>
                          )}
                          {statusIcon(u.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MobileBottomNav />
    </div>
  );
}
