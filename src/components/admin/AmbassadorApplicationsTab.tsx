import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Clock, Mail } from "lucide-react";

interface Application {
  id: string;
  email: string;
  full_name: string | null;
  reason: string | null;
  status: string;
  user_id: string | null;
  created_at: string;
}

export function AmbassadorApplicationsTab() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ambassador_applications' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data as any);
    }
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const approveApplication = async (app: Application) => {
    setProcessing(app.id);
    try {
      const { data, error } = await supabase.functions.invoke('approve-ambassador', {
        body: { email: app.email, application_id: app.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Ambassador approved! 🎉", description: `${app.email} is now an ambassador.` });
      fetchApplications();
    } catch (err) {
      toast({
        title: "Failed to approve",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
    setProcessing(null);
  };

  const rejectApplication = async (app: Application) => {
    setProcessing(app.id);
    const { error } = await supabase
      .from('ambassador_applications' as any)
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() } as any)
      .eq('id', app.id);

    if (!error) {
      toast({ title: "Application rejected" });
      fetchApplications();
    }
    setProcessing(null);
  };

  const pending = applications.filter(a => a.status === 'pending');
  const reviewed = applications.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Applications ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : pending.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending applications.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(app => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {app.email}
                    </TableCell>
                    <TableCell>{app.full_name || '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {app.reason || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveApplication(app)}
                        disabled={processing === app.id}
                      >
                        {processing === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectApplication(app)}
                        disabled={processing === app.id}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reviewed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Reviewed ({reviewed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewed.map(app => (
                  <TableRow key={app.id}>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.full_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'approved' ? 'default' : 'destructive'}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
