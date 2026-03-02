import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { allDepartments } from "@/data/departments";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Clock, Wallet, TrendingUp } from "lucide-react";

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

export default function AmbassadorDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isAmbassador, isAdmin, isLoading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [department, setDepartment] = useState(profile?.faculty || "");
  const [level, setLevel] = useState("100L");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAmbassador && !isAdmin && user) {
      toast({ title: "Access denied", description: "You don't have ambassador privileges.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [isAmbassador, isAdmin, roleLoading, user, navigate, toast]);

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

  const handleUpload = async () => {
    if (!file || !courseCode.trim() || !courseTitle.trim() || !department) {
      toast({ title: "Missing fields", description: "Please fill in all fields and select a PDF.", variant: "destructive" });
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "PDF must be under 20MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = `pdfs/${user!.id}/${fileName}`;

      const { data: fileData, error: uploadError } = await supabase.storage
        .from("course_materials")
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("course_materials")
        .getPublicUrl(fileData.path);

      const { data: uploadRecord, error: insertError } = await supabase
        .from("course_uploads")
        .insert({
          user_id: user!.id,
          course_code: courseCode.trim().toUpperCase(),
          course_title: courseTitle.trim(),
          department,
          level,
          pdf_url: urlData.publicUrl,
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
          pdf_url: urlData.publicUrl,
          upload_id: uploadRecord.id,
        },
      });

      if (fnError) throw new Error(`Processing trigger failed: ${fnError.message}`);

      setUploads(prev => [uploadRecord as UploadRecord, ...prev]);
      setCourseCode("");
      setCourseTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({ title: "Processing started! 🚀", description: "AI is generating the course content. This takes about 3 minutes." });
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user || (!isAmbassador && !isAdmin)) return null;

  const completedUploads = uploads.filter(u => u.status === 'complete').length;
  const walletBalance = profile ? (profile as any).wallet_balance || 0 : 0;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 page-enter">
      <Header isLoggedIn userName={profile?.full_name || ""} />

      <main className="container py-8 px-4 md:px-6 max-w-2xl">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">Ambassador</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Your Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">₦{walletBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{completedUploads}</p>
              <p className="text-[10px] text-muted-foreground">uploads processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Form */}
        <div className="bg-card rounded-3xl card-float p-6 space-y-5 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upload Course Material</h2>
          
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
            <Label className="text-xs font-bold uppercase tracking-wider">Tutorial PDF</Label>
            <label
              htmlFor="pdfFile"
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors ${
                file ? "border-primary/40 bg-primary/[0.03]" : "border-border hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              {file ? (
                <>
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Tap to upload PDF</p>
                    <p className="text-xs text-muted-foreground">Max 20MB</p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                id="pdfFile"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !courseCode || !courseTitle || !department}
            className="w-full h-12 rounded-xl font-bold text-sm"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading & Triggering AI...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Upload & Process</>
            )}
          </Button>
        </div>

        {/* Upload History */}
        {uploads.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Upload History</h2>
            <div className="space-y-3">
              {uploads.map(u => (
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
      </main>

      <MobileBottomNav />
    </div>
  );
}
