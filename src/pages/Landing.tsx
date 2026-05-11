import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, ArrowRight, Brain, BookOpen, Shield, Target, TrendingUp, AlertCircle } from "lucide-react";
import sovereignKey from "@/assets/sovereign-key.png";
import { useAuth } from "@/contexts/AuthContext";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { LandingValueProps } from "@/components/landing/LandingValueProps";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingQuizPreview } from "@/components/landing/LandingQuizPreview";
import { LandingQuizDiscovery } from "@/components/landing/LandingQuizDiscovery";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingFinalCTA } from "@/components/landing/LandingFinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Landing() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !user) return;
    // If we don't have profile yet, wait for it
    if (!profile) return;
    if (!profile.faculty || !profile.level) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, profile, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={!!user} userName={profile?.full_name || ''} />
      <LandingHero />
      <LandingTrustBar />
      <LandingProblem />
      <LandingValueProps />
      <LandingHowItWorks />
      <LandingSocialProof />
      <LandingQuizPreview />
      <LandingQuizDiscovery />
      <LandingPricing />
      <LandingFAQ />
      <LandingFinalCTA />
      <LandingFooter />
    </div>
  );
}
