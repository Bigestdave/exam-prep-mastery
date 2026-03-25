import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { allDepartments } from "@/data/departments";
import {
  Loader2, Download, FileText, Clock, CheckCircle2, Plus, ChevronDown, ChevronUp,
  Send, ExternalLink
} from "lucide-react";

interface QueueItem {
  id: string;
  course_code: string;
  course_title: string;
  department: string;
  level: string;
  pdf_url: string | null;
  status: string;
  created_at: string;
}

interface CourseRecord {
  id: string;
  code: string;
  title: string;
  faculty: string;
}

export default function ModifierDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { roles, isLoading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isModifier = roles.includes("modifier" as any);
  const isAdmin = roles.includes("admin");

  const [items, setItems] = useState<QueueItem[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Content submission form
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isModifier && !isAdmin && user) {
      toast({ title: "Access denied", description: "You don't have modifier privileges.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [isModifier, isAdmin, roleLoading, user, navigate, toast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: uploads }, { data: coursesData }] = await Promise.all([
      supabase.from("course_uploads").select("id, course_code, course_title, department, level, pdf_url, status, created_at")
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: true }),
      supabase.from("courses").select("id, code, title, faculty"),
    ]);
    setItems(uploads || []);
    setCourses(coursesData || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (isModifier || isAdmin) fetchData(); }, [isModifier, isAdmin, fetchData]);

  const deptCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.department] = (acc[item.department] || 0) + 1;
    return acc;
  }, {});

  const activeDepts = allDepartments.filter(d => deptCounts[d]);
  const filteredItems = activeDept === "all" ? items : items.filter(i => i.department === activeDept);

  const handleExpand = (item: QueueItem) => {
    if (expandedId === item.id) {
      setExpandedId(null);
    } else {
      setExpandedId(item.id);
      setQuestionText("");
      setAnswerText("");
    }
  };

  const handleMarkProcessing = async (id: string) => {
    await supabase.from("course_uploads").update({ status: "processing" }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: "processing" } : i));
    toast({ title: "Marked as in progress" });
  };

  const handleSubmitContent = async (item: QueueItem) => {
    if (!questionText.trim() || !answerText.trim()) {
      toast({ title: "Fill in both fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Find or create the course
    let courseId: string | null = null;
    const existingCourse = courses.find(
      c => c.code.toLowerCase() === item.course_code.toLowerCase() && c.faculty === item.department
    );

    if (existingCourse) {
      courseId = existingCourse.id;
    } else {
      // Course doesn't exist yet in courses table - create it
      const { data: newCourse, error } = await supabase.from("courses").insert({
        code: item.course_code,
        title: item.course_title,
        faculty: item.department,
        level: item.level,
        price: 1000,
      }).select("id").single();

      if (error) {
        toast({ title: "Error creating course", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      courseId = newCourse.id;
    }

    // Get current question count for index
    const { count } = await supabase
      .from("course_questions")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);

    // Insert the question as draft (needs admin approval)
    const { error: qError } = await supabase.from("course_questions").insert({
      course_id: courseId,
      question_index: count || 0,
      question_text: questionText.trim(),
      answer_text: answerText.trim(),
      status: "draft",
    });

    if (qError) {
      toast({ title: "Error", description: qError.message, variant: "destructive" });
    } else {
      toast({ title: "Question submitted for review! ✅" });
      setQuestionText("");
      setAnswerText("");
    }

    setSubmitting(false);
  };

  const handleMarkComplete = async (id: string) => {
    await supabase.from("course_uploads").update({ status: "complete" }).eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setExpandedId(null);
    toast({ title: "Marked as complete ✅" });
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isLoggedIn userName="" />
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
      </div>
    );
  }

  if (!user || (!isModifier && !isAdmin)) return null;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0">
      <Header isLoggedIn userName={profile?.full_name || ""} />

      <main className="container py-8 px-4 md:px-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">Content Modifier</p>
          <h1 className="text-2xl font-display font-bold">Content Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review uploaded materials, generate answers using AI, and submit for approval.
          </p>
        </div>

        {/* Department filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          <Button
            size="sm"
            variant={activeDept === "all" ? "default" : "outline"}
            onClick={() => setActiveDept("all")}
            className="shrink-0"
          >
            All ({items.length})
          </Button>
          {activeDepts.map(dept => (
            <Button
              key={dept}
              size="sm"
              variant={activeDept === dept ? "default" : "outline"}
              onClick={() => setActiveDept(dept)}
              className="shrink-0 text-xs"
            >
              {dept} ({deptCounts[dept]})
            </Button>
          ))}
        </div>

        {/* Queue */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-3" />
              <p className="text-muted-foreground">No pending items. You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleExpand(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm font-bold">{item.course_code}</span>
                      <Badge variant={item.status === "processing" ? "secondary" : "outline"} className="text-xs">
                        {item.status === "processing" ? "In Progress" : "Pending"}
                      </Badge>
                      {!item.pdf_url && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">No PDF</Badge>
                      )}
                      {item.pdf_url && item.pdf_url.includes(",") && (
                        <Badge variant="outline" className="text-xs">
                          {item.pdf_url.split(",").filter(Boolean).length} PDFs
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{item.course_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.department} · {item.level}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.pdf_url && !item.pdf_url.includes(",") && (
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(item.pdf_url!, "_blank"); }}>
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                    {item.pdf_url && (() => {
                      const urls = item.pdf_url.split(",").map(u => u.trim()).filter(Boolean);
                      return (
                        <div className="flex flex-wrap gap-2">
                          {urls.map((url, idx) => (
                            <Button key={idx} size="sm" variant="outline" className="gap-1" onClick={() => window.open(url, "_blank")}>
                              <ExternalLink className="w-3 h-3" /> {urls.length > 1 ? `PDF ${idx + 1}` : "Open Material PDF"}
                            </Button>
                          ))}
                        </div>
                      );
                    })()}

                    {item.status === "pending" && (
                      <Button size="sm" onClick={() => handleMarkProcessing(item.id)} className="gap-1">
                        <Clock className="w-3 h-3" /> Mark as In Progress
                      </Button>
                    )}

                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Question & Answer</p>
                      <div className="space-y-2">
                        <Label className="text-xs">Question</Label>
                        <Input
                          value={questionText}
                          onChange={e => setQuestionText(e.target.value)}
                          placeholder="e.g. Explain cultural diffusion"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Answer (Markdown)</Label>
                        <Textarea
                          value={answerText}
                          onChange={e => setAnswerText(e.target.value)}
                          placeholder="Paste the AI-generated answer here..."
                          rows={10}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitContent(item)}
                          disabled={submitting || !questionText.trim() || !answerText.trim()}
                          className="gap-1"
                        >
                          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Submit for Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkComplete(item.id)}
                          className="gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark Upload Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
