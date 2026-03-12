import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Crown, CheckCircle, Loader2, Zap, DollarSign, Users } from "lucide-react";
import sovereignKey from "@/assets/sovereign-key.png";

export default function BecomeAmbassador() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('ambassador_applications' as any)
        .insert({
          email: trimmedEmail,
          full_name: fullName.trim() || null,
          reason: reason.trim() || null,
          user_id: user?.id || null,
        } as any);

      if (error) {
        if (error.message?.includes('duplicate')) {
          toast({ title: "You've already applied!", description: "We'll review your application soon.", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast({ title: "Application submitted! 🎉", description: "We'll review it and get back to you." });
      }
    } catch (err) {
      toast({ title: "Something went wrong", description: err instanceof Error ? err.message : "Try again later.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header isLoggedIn={!!user} userName={profile?.full_name || ''} />
        <div className="container max-w-lg py-20 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold mb-2">Application Received!</h1>
            <p className="text-muted-foreground">We'll review your application and reach out via email once you're approved.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={!!user} userName={profile?.full_name || ''} />
      
      <div className="container max-w-2xl py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" /> Ambassador Program
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Become an LCU Prep Ambassador
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Represent your department, help students prepare, and earn money doing it.
          </p>
        </motion.div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: DollarSign, title: "Earn up to ₦30K", desc: "Per semester through milestones" },
            { icon: Users, title: "Help your dept", desc: "Be the go-to prep resource" },
            { icon: Zap, title: "Exclusive access", desc: "Upload materials & track impact" },
          ].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <Card className="text-center p-4">
                <b.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm">{b.title}</h3>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Application Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must match the email you signed up with on LCU Prep.
                </p>
              </div>

              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reason">Why do you want to be an ambassador? (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Tell us about yourself and your department..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting || !email.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
