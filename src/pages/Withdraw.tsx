import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Wallet, Loader2, CheckCircle2, Clock, XCircle, Banknote, Search, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { TextShimmer } from "@/components/ui/text-shimmer";

interface Bank {
  name: string;
  code: string;
  slug: string;
}

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

  const [banks, setBanks] = useState<Bank[]>([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(true);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<WithdrawalRecord[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [bankSearch, setBankSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAmbassador && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAmbassador, isAdmin, roleLoading, user, navigate]);

  // Fetch banks from Paystack
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paystack-banks", {
          body: { action: "list_banks" },
        });
        if (!error && data?.banks) {
          setBanks(data.banks);
        }
      } catch (e) {
        console.error("Failed to fetch banks:", e);
      }
      setIsFetchingBanks(false);
    };
    fetchBanks();
  }, []);

  // Fetch withdrawal history
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

  // Auto-verify account when bank + 10-digit account number are set
  const verifyAccount = useCallback(async (bankCode: string, accNum: string) => {
    if (!bankCode || accNum.length !== 10) return;

    setIsVerifying(true);
    setIsVerified(false);
    setVerifyError("");
    setAccountName("");

    try {
      const { data, error } = await supabase.functions.invoke("paystack-banks", {
        body: {
          action: "resolve_account",
          account_number: accNum,
          bank_code: bankCode,
        },
      });

      if (error) {
        setVerifyError("Verification failed. Please try again.");
        return;
      }

      if (data?.verified) {
        setAccountName(data.account_name);
        setIsVerified(true);
      } else {
        setVerifyError(data?.error || "Could not verify this account.");
      }
    } catch (e) {
      setVerifyError("Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Trigger verification when both fields are ready
  useEffect(() => {
    if (selectedBankCode && accountNumber.length === 10) {
      verifyAccount(selectedBankCode, accountNumber);
    } else {
      setIsVerified(false);
      setAccountName("");
      setVerifyError("");
    }
  }, [selectedBankCode, accountNumber, verifyAccount]);

  const walletBalance = profile ? (profile as any).wallet_balance || 0 : 0;
  const selectedBank = banks.find(b => b.code === selectedBankCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified || !accountName || !selectedBank) {
      toast({ title: "Account not verified", description: "Please wait for account verification.", variant: "destructive" });
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
        bank_name: selectedBank.name,
        account_number: accountNumber,
        account_name: accountName,
      });

    if (error) {
      toast({ title: "Failed", description: "Could not submit withdrawal request. Try again.", variant: "destructive" });
    } else {
      toast({ title: "Request submitted!", description: "We'll process your withdrawal within 24-48 hours." });
      setSelectedBankCode("");
      setAccountNumber("");
      setAccountName("");
      setIsVerified(false);
      // Refresh
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

  const filteredBanks = bankSearch
    ? banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
    : banks;

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
              {/* Bank Select */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Bank
                </Label>
                {isFetchingBanks ? (
                  <div className="h-12 rounded-xl bg-secondary animate-pulse" />
                ) : (
                  <Select value={selectedBankCode} onValueChange={(v) => setSelectedBankCode(v)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {/* Search inside dropdown */}
                      <div className="px-3 py-2 sticky top-0 bg-popover border-b border-border">
                        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                          <Search className="w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search banks..."
                            value={bankSearch}
                            onChange={e => setBankSearch(e.target.value)}
                            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                          />
                        </div>
                      </div>
                      {filteredBanks.map(bank => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                      {filteredBanks.length === 0 && (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                          No banks found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Account Number
                </Label>
                <div className="relative">
                  <Input
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="h-12 rounded-xl font-mono pr-10"
                    inputMode="numeric"
                  />
                  {isVerifying && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {isVerified && !isVerifying && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                    </div>
                  )}
                </div>
              </div>

              {/* Account Name (auto-filled) */}
              {isVerified && accountName && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Account Name
                  </Label>
                  <div className="h-12 rounded-xl bg-secondary/70 px-4 flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm font-medium text-foreground">{accountName}</span>
                  </div>
                </motion.div>
              )}

              {/* Verification error */}
              {verifyError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-destructive flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {verifyError}
                </motion.p>
              )}

              <p className="text-[11px] text-muted-foreground">
                Your full balance of <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span> will be withdrawn.
                Minimum: ₦500.
              </p>

              <motion.button
                type="submit"
                disabled={isSubmitting || !isVerified || walletBalance < 500}
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
