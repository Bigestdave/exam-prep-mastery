import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Crown, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import sovereignKey from "@/assets/sovereign-key.png";

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease },
});

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
        <div className="container max-w-lg py-24 px-4 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease }}>
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Application Received
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
              We'll review your application and reach out via email once you're approved. This usually takes less than 24 hours.
            </p>
            <Link to="/">
              <Button variant="outline" size="lg">
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={!!user} userName={profile?.full_name || ''} />

      {/* Hero */}
      <section className="pt-8 pb-12 md:pt-12 md:pb-16">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-left md:text-center">
            <motion.div
              className="inline-flex items-center gap-2 glass-pill rounded-full text-muted-foreground px-5 py-2 text-xs font-mono font-semibold tracking-[0.15em] uppercase mb-8"
              {...fadeUp(0)}
            >
              <Crown className="w-4 h-4" />
              Ambassador Program
            </motion.div>

            <motion.h1 className="text-foreground leading-[1.1] mb-6" {...fadeUp(0.1)}>
              <span className="block text-[32px] md:text-5xl font-display font-bold">
                Represent your department.
              </span>
              <span className="block text-[32px] md:text-5xl font-serif italic text-accent mt-1">
                Get paid for it.
              </span>
            </motion.h1>

            <motion.p
              className="text-base md:text-lg text-muted-foreground mb-4 max-w-lg mx-auto leading-relaxed"
              {...fadeUp(0.2)}
            >
              Ambassadors upload course materials, help students in their department prepare, and earn up to ₦80,000 per semester through milestones and leaderboard prizes.
            </motion.p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="pb-12 md:pb-16">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div {...fadeUp(0.3)}>
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-6">
                How It Works
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: "01", title: "Upload Materials", desc: "Collect course materials & tutorial questions from your department and upload them." },
                  { step: "02", title: "We Process Them", desc: "Our team creates First Class answers and quizzes, you don't write anything." },
                  { step: "03", title: "Share Your Link", desc: "Share your unique referral link with students in your department to help them prepare and earn per unlock." },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-5 card-float"
                  >
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-bold mb-2">
                      Step {item.step}
                    </p>
                    <p className="text-sm font-display font-semibold text-foreground mb-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How You Earn + Form */}
      <section className="pb-16 md:pb-24">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">

            {/* Milestones */}
            <motion.div className="mb-12" {...fadeUp(0.4)}>
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-6">
                How You Earn
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { milestone: "40 unlocks", reward: "₦7,500", label: "Tier 1" },
                  { milestone: "80 unlocks", reward: "+₦7,500", label: "Tier 2" },
                  { milestone: "150 unlocks", reward: "+₦15,000", label: "Tier 3" },
                ].map((tier, i) => (
                  <div
                    key={i}
                    className="relative rounded-xl border border-border bg-card p-5 card-float text-center"
                  >
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                      {tier.label}
                    </p>
                    <p className="text-2xl font-display font-bold text-foreground mb-1">
                      {tier.reward}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      at {tier.milestone}
                    </p>
                  </div>
                ))}
              </div>

              {/* Leaderboard prizes */}
              <div className="rounded-xl border border-border bg-card p-5 card-float mb-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3 text-center">
                  Semester Leaderboard Prizes
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                  {[
                    { pos: "🥇 1st", amount: "₦50,000" },
                    { pos: "🥈 2nd", amount: "₦30,000" },
                    { pos: "🥉 3rd", amount: "₦20,000" },
                    { pos: "4th–5th", amount: "₦10,000" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">{p.pos}</span>
                      <span className="font-display font-bold text-foreground">{p.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground font-mono">
                Total potential: <span className="text-foreground font-semibold">₦80,000+</span> per semester
              </p>
            </motion.div>

            {/* Application Form */}
            <motion.div {...fadeUp(0.4)}>
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-6">
                Apply Now
              </p>

              <div className="rounded-xl border border-border bg-card p-6 md:p-8 card-shadow">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="mt-1.5"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Must match the email you signed up with on LCU Prep.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason" className="text-sm font-medium text-foreground">
                      Why do you want to be an ambassador?
                      <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Tell us about yourself and your department..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="mt-1.5 min-h-[100px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full group"
                    disabled={submitting || !email.trim()}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Crown className="w-4 h-4 mr-2" />
                    )}
                    Submit Application
                    {!submitting && (
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>
                </form>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Don't have an account yet?{" "}
                <Link to="/signup" className="text-foreground font-medium underline underline-offset-4 hover:text-accent transition-colors">
                  Sign up first
                </Link>
                , then come back here.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
