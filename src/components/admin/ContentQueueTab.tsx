import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Clock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { allDepartments } from "@/data/departments";

interface QueueItem {
  id: string;
  user_id: string;
  course_code: string;
  course_title: string;
  department: string;
  level: string;
  pdf_url: string | null;
  status: string;
  created_at: string;
  error_message: string | null;
  user_name?: string;
}

export function ContentQueueTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState<string>("all");

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("course_uploads")
      .select("*")
      .order("created_at", { ascending: false });

    if (activeDept !== "all") {
      query = query.eq("department", activeDept);
    }

    const { data } = await query;

    if (data) {
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      setItems(data.map(d => ({
        ...d,
        user_name: nameMap.get(d.user_id) || "Unknown",
      })));
    }
    setLoading(false);
  }, [activeDept]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Get departments that have submissions
  const deptCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.department] = (acc[item.department] || 0) + 1;
    return acc;
  }, {});

  // Only show departments that have at least one submission
  const activeDepts = allDepartments.filter(d => deptCounts[d]);

  const filteredItems = activeDept === "all" ? items : items.filter(i => i.department === activeDept);

  const statusBadge = (item: QueueItem) => {
    if (!item.pdf_url) {
      return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1"><Clock className="w-3 h-3" /> No Materials</Badge>;
    }
    switch (item.status) {
      case "complete":
        return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 gap-1"><CheckCircle2 className="w-3 h-3" /> Complete</Badge>;
      case "processing":
        return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> In Progress</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 gap-1"><FileText className="w-3 h-3" /> Ready for Review</Badge>;
    }
  };

  const pendingCount = items.filter(i => i.pdf_url && i.status === "pending").length;
  const noMaterialsCount = items.filter(i => !i.pdf_url).length;
  const completeCount = items.filter(i => i.status === "complete").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Ready for Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{noMaterialsCount}</p>
            <p className="text-xs text-muted-foreground">No Materials Yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completeCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
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

      {/* Queue Items */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No submissions {activeDept !== "all" ? `for ${activeDept}` : "yet"}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <Card key={item.id}>
              <CardContent className="py-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm font-bold">{item.course_code}</span>
                      {statusBadge(item)}
                    </div>
                    <p className="text-sm text-foreground">{item.course_title}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{item.department}</span>
                      <span>·</span>
                      <span>{item.level}</span>
                      <span>·</span>
                      <span>by {item.user_name}</span>
                      <span>·</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.error_message && (
                      <p className="text-xs text-destructive mt-1">{item.error_message}</p>
                    )}
                  </div>
                  {item.pdf_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.pdf_url!, "_blank")}
                      className="shrink-0 gap-1"
                    >
                      <Download className="w-3 h-3" /> View PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
