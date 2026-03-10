import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Clock, CheckCircle2, AlertCircle, Package, FolderOpen } from "lucide-react";
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

interface DeptSummary {
  name: string;
  total: number;
  withMaterials: number;
  noMaterials: number;
  complete: number;
  pending: number;
}

export function ContentQueueTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState<string>("all");

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("course_uploads")
      .select("*")
      .order("created_at", { ascending: false });

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
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Build department summaries
  const deptMap = new Map<string, DeptSummary>();
  items.forEach(item => {
    const existing = deptMap.get(item.department) || {
      name: item.department,
      total: 0,
      withMaterials: 0,
      noMaterials: 0,
      complete: 0,
      pending: 0,
    };
    existing.total++;
    if (item.pdf_url) existing.withMaterials++;
    else existing.noMaterials++;
    if (item.status === "complete") existing.complete++;
    if (item.pdf_url && item.status === "pending") existing.pending++;
    deptMap.set(item.department, existing);
  });

  const deptSummaries = Array.from(deptMap.values()).sort((a, b) => b.total - a.total);
  const filteredItems = activeDept === "all" ? items : items.filter(i => i.department === activeDept);

  const pendingCount = items.filter(i => i.pdf_url && i.status === "pending").length;
  const noMaterialsCount = items.filter(i => !i.pdf_url).length;
  const completeCount = items.filter(i => i.status === "complete").length;

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

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">{items.length}</p>
            <p className="text-xs text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Ready to Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{noMaterialsCount}</p>
            <p className="text-xs text-muted-foreground">No Materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completeCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      {activeDept === "all" && deptSummaries.length > 0 && (
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold">Departments ({deptSummaries.length})</h3>
            </div>
            <div className="space-y-2">
              {deptSummaries.map(dept => (
                <button
                  key={dept.name}
                  onClick={() => setActiveDept(dept.name)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{dept.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{dept.total} courses</span>
                      {dept.withMaterials > 0 && (
                        <span className="text-xs text-blue-600">📎 {dept.withMaterials} with materials</span>
                      )}
                      {dept.noMaterials > 0 && (
                        <span className="text-xs text-amber-600">⏳ {dept.noMaterials} awaiting</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {dept.pending > 0 && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200 text-[10px]">{dept.pending} to review</Badge>
                    )}
                    {dept.complete > 0 && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px]">{dept.complete} done</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
        {deptSummaries.map(dept => (
          <Button
            key={dept.name}
            size="sm"
            variant={activeDept === dept.name ? "default" : "outline"}
            onClick={() => setActiveDept(dept.name)}
            className="shrink-0 text-xs"
          >
            {dept.name} ({dept.total})
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
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
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
