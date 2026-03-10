import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Trash2, Crown, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AmbassadorRecord {
  user_id: string;
  full_name: string | null;
  faculty: string | null;
  email?: string;
  wallet_balance: number;
  upload_count: number;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
}

export function AmbassadorsTab() {
  const [ambassadors, setAmbassadors] = useState<AmbassadorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const fetchAmbassadors = async () => {
    setLoading(true);
    
    // Get all users with ambassador role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'ambassador');

    if (roleError || !roleData?.length) {
      setAmbassadors([]);
      setLoading(false);
      return;
    }

    const userIds = roleData.map(r => r.user_id);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, faculty, wallet_balance')
      .in('id', userIds);

    // Fetch upload counts
    const { data: uploads } = await supabase
      .from('course_uploads')
      .select('user_id')
      .in('user_id', userIds);

    const uploadCounts = new Map<string, number>();
    uploads?.forEach(u => {
      uploadCounts.set(u.user_id, (uploadCounts.get(u.user_id) || 0) + 1);
    });

    const records: AmbassadorRecord[] = (profiles || []).map(p => ({
      user_id: p.id,
      full_name: p.full_name,
      faculty: p.faculty,
      wallet_balance: p.wallet_balance,
      upload_count: uploadCounts.get(p.id) || 0,
    }));

    setAmbassadors(records);
    setLoading(false);
  };

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const addAmbassador = async () => {
    if (!email.trim()) return;
    setAdding(true);

    try {
      // Look up user by email — we need to find their profile
      // Since we can't query auth.users, we search profiles by checking all users
      // Better approach: admin provides user_id or we search by name
      // For now, we'll use supabase admin API via edge function or direct lookup
      
      // Try to find user in profiles — but profiles don't have email
      // We need to use a different approach: admin enters the user ID directly
      // Or we create an edge function to look up by email
      
      toast({
        title: "Enter User ID",
        description: "Currently, enter the user's UUID to add them as ambassador. Email lookup coming soon.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add ambassador",
        variant: "destructive",
      });
    }
    setAdding(false);
  };

  const addAmbassadorById = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'ambassador' });

      if (error) {
        if (error.code === '23505') {
          toast({ title: "Already an ambassador", variant: "destructive" });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: "Ambassador added! 🎉" });
      fetchAmbassadors();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed",
        variant: "destructive",
      });
    }
  };

  const removeAmbassador = async (userId: string) => {
    if (!confirm("Remove this user's ambassador role?")) return;

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'ambassador');

    if (!error) {
      toast({ title: "Ambassador removed" });
      fetchAmbassadors();
    }
  };

  const [userIdInput, setUserIdInput] = useState("");

  return (
    <div className="space-y-6">
      {/* Add Ambassador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add Ambassador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Paste user ID (UUID)"
              value={userIdInput}
              onChange={e => setUserIdInput(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                if (userIdInput.trim()) {
                  addAmbassadorById(userIdInput.trim());
                  setUserIdInput("");
                }
              }}
              disabled={!userIdInput.trim()}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Find the user ID in the Users tab of your Supabase dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Ambassadors List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Crown className="w-4 h-4" /> Ambassadors ({ambassadors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : ambassadors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No ambassadors yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Uploads</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ambassadors.map(a => (
                  <TableRow key={a.user_id}>
                    <TableCell className="font-medium">{a.full_name || 'Unknown'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.faculty || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="gap-1">
                        <Upload className="w-3 h-3" /> {a.upload_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">₦{a.wallet_balance.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeAmbassador(a.user_id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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
