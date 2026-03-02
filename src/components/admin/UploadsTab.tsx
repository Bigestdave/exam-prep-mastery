import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, Clock, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UploadRecord {
  id: string;
  user_id: string;
  course_code: string;
  course_title: string;
  department: string;
  level: string;
  status: string;
  created_at: string;
  questions_generated: number | null;
  error_message: string | null;
  user_name?: string;
}

export function UploadsTab() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUploads = async () => {
      const { data } = await supabase
        .from('course_uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        const userIds = [...new Set(data.map(u => u.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        setUploads(data.map(u => ({
          ...u,
          user_name: nameMap.get(u.user_id) || 'Unknown',
        })));
      }
      setLoading(false);
    };
    fetchUploads();
  }, []);

  const statusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1"><CheckCircle2 className="w-3 h-3" /> Complete</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>;
      case "processing":
        return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const totalUploads = uploads.length;
  const completed = uploads.filter(u => u.status === 'complete').length;
  const failed = uploads.filter(u => u.status === 'failed').length;
  const pending = uploads.filter(u => u.status === 'pending' || u.status === 'processing').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Upload className="w-4 h-4" /> Total Uploads
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalUploads}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">✅ Completed</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{completed}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">⏳ Processing</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{pending}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">❌ Failed</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{failed}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">All Uploads</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {uploads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No uploads yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ambassador</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium whitespace-nowrap">{u.user_name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{u.course_code}</span>
                      <span className="text-xs text-muted-foreground ml-2">{u.course_title}</span>
                    </TableCell>
                    <TableCell className="text-xs">{u.department}</TableCell>
                    <TableCell>{statusBadge(u.status)}</TableCell>
                    <TableCell className="text-right">{u.questions_generated || '—'}</TableCell>
                    <TableCell className="text-right text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
