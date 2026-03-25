import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { allDepartments } from "@/data/departments";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Clock, X, Sparkles, PlusCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadRecord {
  id: string;
  course_code: string;
  course_title: string;
  department: string;
  level: string;
  pdf_url: string;
  status: string;
  created_at: string;
  questions_generated: number | null;
  error_message: string | null;
}

/** Upload currently being tracked with polling */
interface ActiveUpload {
  id: string;
  status: string;
  progress: number; // 0-100 estimated
}

function estimateProgress(status: string, startedAt: number): number {
  if (status === "complete") return 100;
  if (status === "failed") return 100;
  // Time-based estimate (processing typically takes 3-10 min)
  const elapsed = (Date.now() - startedAt) / 1000;
  if (status === "pending") return Math.min(10, elapsed);
  // processing
  return Math.min(90, 10 + (elapsed / 600) * 80);
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
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadStartRef = useRef<number>(0);

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
        // Also update active upload tracker
        if (activeUpload && payload.new.id === activeUpload.id) {
          const newStatus = (payload.new as any).status;
          if (newStatus === "complete") {
            handleUploadComplete((payload.new as any).questions_generated);
          } else if (newStatus === "failed") {
            handleUploadFailed((payload.new as any).error_message);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeUpload?.id]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleUploadComplete = useCallback((questionsGenerated: number | null) => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setActiveUpload(prev => prev ? { ...prev, status: "complete", progress: 100 } : null);
    setIsUploading(false);
    toast({
      title: "Your course is ready! 🎉",
      description: `${questionsGenerated || 0} study guides created. Your department is stronger!`,
    });
    // Clear active upload after a moment
    setTimeout(() => setActiveUpload(null), 5000);
  }, [toast]);

  const handleUploadFailed = useCallback((errorMessage: string | null) => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setActiveUpload(prev => prev ? { ...prev, status: "failed", progress: 100 } : null);
    setIsUploading(false);
    toast({
      title: "Processing failed",
      description: errorMessage || "Something went wrong. Please try again.",
      variant: "destructive",
    });
    setTimeout(() => setActiveUpload(null), 5000);
  }, [toast]);

  const startPolling = useCallback((uploadId: string) => {
    uploadStartRef.current = Date.now();
    setActiveUpload({ id: uploadId, status: "processing", progress: 5 });

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("course_uploads")
          .select("id, status, questions_generated, error_message")
          .eq("id", uploadId)
          .single();

        if (!data) return;

        if (data.status === "complete") {
          handleUploadComplete(data.questions_generated);
        } else if (data.status === "failed") {
          handleUploadFailed(data.error_message);
        } else {
          setActiveUpload(prev => prev ? {
            ...prev,
            status: data.status,
            progress: estimateProgress(data.status, uploadStartRef.current),
          } : null);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000); // Poll every 5 seconds

    // Safety timeout: stop polling after 15 minutes
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setActiveUpload(prev => {
          if (prev && prev.status !== "complete" && prev.status !== "failed") {
            setIsUploading(false);
            toast({
              title: "Still processing",
              description: "Your upload is taking longer than expected. Check back later.",
            });
            return null;
          }
          return prev;
        });
      }
    }, 15 * 60 * 1000);
  }, [handleUploadComplete, handleUploadFailed, toast]);

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
    if (!courseCode.trim() || !courseTitle.trim() || !department) {
      toast({ title: "Missing fields", description: "Please fill in course code, title, and department.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      let pdfUrl: string | null = null;

      // Upload files if any
      if (files.length > 0) {
        const pdfUrls: string[] = [];
        for (const file of files) {
          const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const filePath = `pdfs/${user!.id}/${fileName}`;

          const { data: fileData, error: uploadError } = await supabase.storage
            .from("course_materials")
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from("course_materials")
            .getPublicUrl(fileData.path);

          pdfUrls.push(urlData.publicUrl);
        }
        pdfUrl = pdfUrls[0];
      }

      // Create upload record (no auto processing)
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

      setUploads(prev => [uploadRecord as UploadRecord, ...prev]);

      // Reset form
      setCourseCode("");
      setCourseTitle("");
      setFiles([]);

      toast({
        title: files.length > 0 ? "✨ Course Submitted!" : "✅ Course Registered!",
        description: files.length > 0
          ? "Materials uploaded. Our team will prepare the content and it'll be live soon!"
          : "Course saved. You can upload materials later.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      const message = error instanceof Error ? error.message : "Something went wrong.";
      const isNetworkError = message.includes("Failed to fetch") || message.includes("NetworkError");
      toast({
        title: isNetworkError ? "Network error" : "Upload failed",
        description: isNetworkError
          ? "Check your internet connection and try again. Large files may fail on slow networks."
          : message,
        variant: "destructive",
      });
    }
    setIsUploading(false);
  };

  const handleRetry = async (upload: UploadRecord) => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      // Reset status to pending
      await supabase
        .from("course_uploads")
        .update({ status: "pending", error_message: null })
        .eq("id", upload.id);

      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: "pending", error_message: null } : u));

      // Re-trigger processing
      const { error: fnError } = await supabase.functions.invoke("trigger-processing", {
        body: {
          course_code: upload.course_code,
          course_title: upload.course_title,
          department: upload.department,
          level: upload.level,
          pdf_urls: [upload.pdf_url],
          upload_id: upload.id,
        },
      });

      if (fnError) throw new Error(`Retry failed: ${fnError.message}`);

      startPolling(upload.id);

      toast({
        title: "Retrying! 🔄",
        description: "Re-processing your course. This takes 5-10 minutes.",
      });
    } catch (error) {
      console.error("Retry error:", error);
      setIsUploading(false);
      toast({
        title: "Retry failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
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
            Upload tutorial PDFs and our team will build the study guides for your students.
          </p>
        </div>

        {/* Active Upload Progress */}
        {activeUpload && (
          <div className="bg-card rounded-2xl card-float p-5 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeUpload.status === "complete" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : activeUpload.status === "failed" ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                <span className="text-sm font-semibold">
                  {activeUpload.status === "complete"
                    ? "Course ready!"
                    : activeUpload.status === "failed"
                    ? "Processing failed"
                    : activeUpload.status === "processing"
                    ? "AI is generating study guides..."
                    : "Starting..."}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {Math.round(activeUpload.progress)}%
              </span>
            </div>
            <Progress value={activeUpload.progress} className="h-2" />
            {activeUpload.status !== "complete" && activeUpload.status !== "failed" && (
              <p className="text-xs text-muted-foreground">
                This usually takes 5-10 minutes. You can leave this page — we'll process it in the background.
              </p>
            )}
          </div>
        )}

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
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level" className="text-xs font-bold uppercase tracking-wider">Level</Label>
              <Select value={level} onValueChange={setLevel} disabled={isUploading}>
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
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-xs font-bold uppercase tracking-wider">Department</Label>
            <Select value={department} onValueChange={setDepartment} disabled={isUploading}>
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
                isUploading ? "opacity-50 pointer-events-none" :
                files.length > 0 ? "border-primary/40 bg-primary/[0.03]" : "border-border hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Tap to add PDFs</p>
                <p className="text-xs text-muted-foreground">Max 20MB per file · Tap again to add more</p>
              </div>
              <input
                ref={fileInputRef}
                id="pdfFile"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
                disabled={isUploading}
              />
            </label>

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
                      disabled={isUploading}
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
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing your course...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Get Your Course Ready</>
            )}
          </Button>
        </div>

        {/* Most Recent Upload */}
        {uploads.length > 0 && (() => {
          const recent = uploads[0];
          return (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Most Recent Upload</h2>
              <div className="bg-card rounded-2xl card-shadow p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{recent.course_code}</p>
                  <p className="text-sm font-semibold">{recent.course_title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {recent.department} · {new Date(recent.created_at).toLocaleDateString()}
                  </p>
                  {recent.error_message && (
                    <p className="text-xs text-destructive mt-1">{recent.error_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {recent.questions_generated && recent.questions_generated > 0 && (
                    <span className="text-xs text-muted-foreground">{recent.questions_generated} Qs</span>
                  )}
                  {(recent.status === "processing" || recent.status === "failed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8"
                      disabled={isUploading}
                      onClick={() => handleRetry(recent)}
                    >
                      <Loader2 className={`w-3 h-3 mr-1 ${isUploading ? "animate-spin" : "hidden"}`} />
                      Retry
                    </Button>
                  )}
                  {statusIcon(recent.status)}
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      
    </div>
  );
}
