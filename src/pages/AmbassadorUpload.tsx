import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { allDepartments } from "@/data/departments";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Clock, X, Sparkles } from "lucide-react";

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

export default function AmbassadorUpload() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [department, setDepartment] = useState(profile?.faculty || "");
  const [level, setLevel] = useState("100L");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile?.faculty) setDepartment(profile.faculty);
  }, [profile]);

  // Fetch user's upload history
  useEffect(() => {
    if (!user) return;
    const fetchUploads = async () => {
      const { data } = await supabase
        .from("course_uploads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setUploads(data as UploadRecord[]);
    };
    fetchUploads();

    const channel = supabase
      .channel("upload-status")
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
    // Reset input so same file can be re-selected
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
      for (const file of files) {
        // 1. Upload PDF to Supabase Storage
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const filePath = `pdfs/${user!.id}/${fileName}`;

        const { data: fileData, error: uploadError } = await supabase.storage
          .from("course_materials")
          .upload(filePath, file);

        if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("course_materials")
          .getPublicUrl(fileData.path);

        const pdfUrl = urlData.publicUrl;

        // 2. Create upload record in DB
        const { data: uploadRecord, error: insertError } = await supabase
          .from("course_uploads")
          .insert({
            user_id: user!.id,
            course_code: courseCode.trim().toUpperCase(),
            course_title: courseTitle.trim(),
            department,
            level,
            pdf_url: pdfUrl,
            status: "pending",
          })
          .select()
          .single();

        if (insertError) throw new Error(`Record creation failed: ${insertError.message}`);

        // 3. Trigger n8n via edge function
        const { error: fnError } = await supabase.functions.invoke("trigger-processing", {
          body: {
            course_code: courseCode.trim().toUpperCase(),
            course_title: courseTitle.trim(),
            department,
            level,
            pdf_url: pdfUrl,
            upload_id: uploadRecord.id,
          },
        });

        if (fnError) throw new Error(`Processing trigger failed: ${fnError.message}`);

        // 4. Update local state
        setUploads(prev => [uploadRecord as UploadRecord, ...prev]);
      }

      // Reset form
      setCourseCode("");
      setCourseTitle("");
      setFiles([]);

      toast({
        title: "You're all set! 🎓",
        description: `${files.length} file${files.length > 1 ? "s" : ""} uploaded. Your course is being prepared.`,
      });
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
      case "complete": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "processing": return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (isLoading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 page-enter">
      <Header isLoggedIn userName={profile?.full_name || ""} />

      <main className="container py-8 px-4 md:px-6 max-w-2xl">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">Ambassador</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Upload Course Material</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Upload tutorial PDFs and we'll build the full study guide, explanations, and quizzes for your students.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-card rounded-3xl card-float p-6 space-y-5 mb-8">
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
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
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
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {allDepartments.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PDF Drop Zone */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Tutorial PDFs</Label>
            <label
              htmlFor="pdfFile"
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors ${
                files.length > 0 ? "border-primary/40 bg-primary/[0.03]" : "border-border hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Tap to add PDFs</p>
                <p className="text-xs text-muted-foreground">Max 20MB per file · Tap again to add more</p>
              </div>
              {/* iOS Safari doesn't reliably support multiple file selection.
                  Users can tap multiple times to accumulate files. */}
              <input
                ref={fileInputRef}
                id="pdfFile"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
            </label>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2 mt-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{(f.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-1 rounded-lg hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0 || !courseCode || !courseTitle || !department}
            className="w-full h-12 rounded-xl font-bold text-sm btn-thud"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing your course...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Get Your Course Ready</>
            )}
          </Button>
        </div>

        {/* Upload History */}
        {uploads.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Upload History</h2>
            <div className="space-y-3">
              {uploads.map(u => (
                <div key={u.id} className="bg-card rounded-2xl card-shadow p-4 flex items-center justify-between">
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
