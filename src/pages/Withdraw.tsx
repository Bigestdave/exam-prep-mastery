import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Wallet, Loader2, CheckCircle2, Clock, XCircle, Banknote
} from "lucide-react";
import { motion } from "framer-motion";
import { TextShimmer } from "@/components/ui/text-shimmer";

interface WithdrawalRecord {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
  admin_note: string | null;
}

export default function Withdraw() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isAmbassador, isAdmin, isLoading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<WithdrawalRecord[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAmbassador && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAmbassador, isAdmin, roleLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setRequests(data as WithdrawalRecord[]);
      setIsLoadingRequests(false);
    };
    fetchRequests();
  }, [user]);

  const walletBalance = profile ? (profile as any).wallet_balance || 0 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all bank details.", variant: "destructive" });
      return;
    }

    if (accountNumber.length < 10 || accountNumber.length > 10) {
      toast({ title: "Invalid account number", description: "Please enter a valid 10-digit account number.", variant: "destructive" });
      return;
    }

    if (walletBalance < 500) {
      toast({ title: "Insufficient balance", description: "You need at least ₦500 to withdraw.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: user!.id,
        amount: walletBalance,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });

    if (error) {
      toast({ title: "Failed", description: "Could not submit withdrawal request. Try again.", variant: "destructive" });
    } else {
      toast({ title: "Request submitted!", description: "We'll process your withdrawal within 24-48 hours." });
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      // Refresh requests
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (data) setRequests(data as WithdrawalRecord[]);
    }
    setIsSubmitting(false);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 px-4 max-w-lg mx-auto">
          <TextShimmer className="text-lg font-display font-bold" duration={1.2}>Processing</TextShimmer>
        </main>
      </div>
    );
  }

  if (!user || (!isAmbassador && !isAdmin)) return null;

  const statusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case "approved": return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case "rejected": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const hasPendingRequest = requests.some(r => r.status === "pending" || r.status === "approved");

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 page-enter">
      <Header isLoggedIn userName={profile?.full_name || ""} />

      <main className="container py-8 px-4 md:px-6 max-w-lg mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/ambassador")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-foreground rounded-3xl p-6 text-background shadow-elevated mb-8 relative overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-background/40 uppercase tracking-[0.2em] mb-1">
              Available Balance
            </p>
            <h1 className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-background">
              ₦{walletBalance.toLocaleString()}
            </h1>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl -mr-10 -mt-10" />
        </motion.div>

        {/* Withdrawal form */}
        {hasPendingRequest ? (
          <div className="bg-card rounded-3xl card-float p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-accent" />
              <h2 className="text-base font-display font-bold">Withdrawal in progress</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              You have a pending withdrawal request. We'll process it within 24-48 hours.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl card-float p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Banknote className="w-4 h-4 text-accent" />
              <h2 className="text-base font-display font-bold">Withdraw to Bank</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bank Name
                </Label>
                <Input
                  id="bankName"
                  placeholder="e.g. Access Bank"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Account Number
                </Label>
                <Input
                  id="accountNumber"
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="h-12 rounded-xl font-mono"
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Account Name
                </Label>
                <Input
                  id="accountName"
                  placeholder="John Doe"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Your full balance of <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span> will be withdrawn.
                Minimum withdrawal: ₦500.
              </p>

              <motion.button
                type="submit"
                disabled={isSubmitting || walletBalance < 500}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-12 rounded-xl font-bold text-sm bg-foreground text-background flex items-center justify-center gap-2 btn-thud disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Wallet className="w-4 h-4" /> Request Withdrawal</>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Previous requests */}
        {requests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl card-float p-6"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Withdrawal History
            </h3>
            <div className="space-y-0">
              {requests.map((req, i) => (
                <div
                  key={req.id}
                  className={`flex items-center justify-between py-3.5 ${
                    i < requests.length - 1 ? "border-b border-dashed border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {statusIcon(req.status)}
                    <div>
                      <p className="text-sm font-medium text-foreground">₦{req.amount.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {req.bank_name} · {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    req.status === "paid" ? "text-accent" :
                    req.status === "rejected" ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
