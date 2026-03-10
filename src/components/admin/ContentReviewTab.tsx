import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, ChevronDown, ChevronUp, Eye, Filter } from "lucide-react";

interface ReviewQuestion {
  id: string;
  course_id: string;
  question_index: number;
  question_text: string;
  answer_text: string;
  status: string;
  created_at: string;
  course_code?: string;
  course_title?: string;
  course_faculty?: string;
}

export function ContentReviewTab() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("draft");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [saving, setSaving] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [courses, setCourses] = useState<{ id: string; code: string; title: string; faculty: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch courses for filter dropdown
    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, code, title, faculty")
      .order("code");

    setCourses(coursesData || []);

    // Build query
    let query = supabase
      .from("course_questions")
      .select("id, course_id, question_index, question_text, answer_text, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (courseFilter !== "all") {
      query = query.eq("course_id", courseFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Map course info
    const courseMap = new Map(coursesData?.map(c => [c.id, c]) || []);
    const mapped: ReviewQuestion[] = (data || []).map(q => {
      const course = courseMap.get(q.course_id);
      return {
        ...q,
        course_code: course?.code || "Unknown",
        course_title: course?.title || "Unknown",
        course_faculty: course?.faculty || "Unknown",
      };
    });

    setQuestions(mapped);
    setLoading(false);
  }, [statusFilter, courseFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExpand = (q: ReviewQuestion) => {
    if (expandedId === q.id) {
      setExpandedId(null);
    } else {
      setExpandedId(q.id);
      setEditingText(q.answer_text);
    }
  };

  const handleApprove = async (id: string) => {
    setSaving(id);
    const updates: Record<string, unknown> = { status: "published" };

    // If expanded and text was edited, save it too
    if (expandedId === id && editingText) {
      updates.answer_text = editingText;
    }

    const { error } = await supabase
      .from("course_questions")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Approved & published ✅" });
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setSaving(null);
  };

  const handleReject = async (id: string) => {
    setSaving(id);
    const { error } = await supabase
      .from("course_questions")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rejected" });
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setSaving(null);
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(id);
    const { error } = await supabase
      .from("course_questions")
      .update({ answer_text: editingText })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Answer updated" });
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer_text: editingText } : q));
    }
    setSaving(null);
  };

  const handleBulkApprove = async () => {
    const draftIds = questions.filter(q => q.status === "draft").map(q => q.id);
    if (draftIds.length === 0) return;

    if (!confirm(`Approve all ${draftIds.length} draft questions?`)) return;

    setSaving("bulk");
    const { error } = await supabase
      .from("course_questions")
      .update({ status: "published" })
      .in("id", draftIds);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${draftIds.length} questions approved ✅` });
      fetchData();
    }
    setSaving(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Draft</Badge>;
      case "published": return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Published</Badge>;
      case "rejected": return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const draftCount = questions.filter(q => q.status === "draft").length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-wrap items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {statusFilter === "draft" && draftCount > 0 && (
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={saving === "bulk"}
                className="gap-1"
              >
                {saving === "bulk" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Approve All ({draftCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No {statusFilter !== "all" ? statusFilter : ""} questions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>

          {questions.map(q => (
            <Card key={q.id} className="overflow-hidden">
              <div
                className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleExpand(q)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{q.course_code}</Badge>
                    {statusBadge(q.status)}
                    <span className="text-xs text-muted-foreground">Q{q.question_index + 1}</span>
                  </div>
                  <p className="text-sm text-foreground truncate">{q.question_text}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {q.status === "draft" && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={(e) => { e.stopPropagation(); handleApprove(q.id); }}
                        disabled={saving === q.id}
                      >
                        {saving === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); handleReject(q.id); }}
                        disabled={saving === q.id}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {expandedId === q.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded editing area */}
              {expandedId === q.id && (
                <div className="border-t px-4 py-4 space-y-3 bg-muted/10">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Question</p>
                    <p className="text-sm text-foreground">{q.question_text}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Answer (Markdown) — {q.course_title}
                    </p>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={12}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex gap-2 justify-end flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveEdit(q.id)}
                      disabled={saving === q.id || editingText === q.answer_text}
                    >
                      {saving === q.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Save Edit
                    </Button>
                    {q.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(q.id)}
                        disabled={saving === q.id}
                        className="gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve & Publish
                      </Button>
                    )}
                    {q.status !== "published" && q.status !== "draft" && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(q.id)}
                        disabled={saving === q.id}
                        className="gap-1"
                      >
                        <Check className="w-3 h-3" /> Republish
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
