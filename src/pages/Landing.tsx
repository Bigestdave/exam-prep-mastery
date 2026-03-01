import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ValueCard } from "@/components/ValueCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Target, Award, ArrowRight, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={!!user} userName={profile?.full_name || ''} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative py-24 md:py-36 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-xs font-mono font-semibold tracking-wider uppercase mb-8 opacity-0 animate-fade-in">
              <GraduationCap className="w-4 h-4" />
              Lead City University
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.1] mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <span className="gradient-text text-5xl md:text-6xl lg:text-7xl">6 out of 15</span>
              <br />
              <span className="text-foreground/90">Tutorial Questions will appear in your exam.</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto opacity-0 animate-slide-up leading-relaxed" style={{ animationDelay: '200ms' }}>
              Stop searching through 40-page PDFs. We solved the exact 15 questions for you, verified, exam-ready, first-class standard.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Link to="/signup">
                <Button size="xl" variant="hero" className="group">
                  Find My Course
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="hero-outline" size="xl">
                  I have an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <ValueCard icon={CheckCircle} title="All 15 Solved" description="Every tutorial question with a comprehensive, exam-ready answer." delay={100} />
            <ValueCard icon={Target} title="100% Coverage" description="Every question that could appear in your examination." delay={200} />
            <ValueCard icon={Award} title="First Class Standard" description="Solutions crafted to meet the highest academic bar." delay={300} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 border-t border-border/50">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground text-sm">Three steps to exam confidence</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with your department and level' },
              { step: '02', title: 'Find Your Course', desc: 'We show courses matched to your level' },
              { step: '03', title: 'Unlock & Study', desc: 'Access all 15 verified answers instantly' },
            ].map((item, i) => (
              <div key={i} className="text-center opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100 + 100}ms` }}>
                <div className="text-5xl font-display font-bold text-primary/15 mb-4">{item.step}</div>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Pricing Works */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-foreground mb-8 text-center">How Pricing Works</h2>
            <div className="space-y-4">
              {[
                'Each course is unlocked separately',
                'You only pay for the courses you are taking',
                'One-time payment per course, per semester',
                'Access is instant after payment',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 50 + 100}ms` }}>
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 border-t border-border/50">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: 'Is payment for all courses or one course?', a: 'Payment is per course. You unlock only the course you choose.' },
                { q: 'Can I see the answers before paying?', a: 'Yes. You can preview one solved tutorial question before unlocking the full course.' },
                { q: 'Will this actually help for exams?', a: 'Exams are set from tutorial questions. We prepare all the tutorials properly, so no question is unfamiliar.' },
                { q: 'When is the best time to get it?', a: 'Most students unlock courses during holidays or early semester to avoid rushing later.' },
                { q: 'How long do I have access after paying?', a: 'Access lasts for the current semester.' },
                { q: 'What if I have an issue after payment?', a: 'Access is automatic. If there\'s any issue, support is available.' },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              Ready to ace your exams?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of students already preparing smarter.
            </p>
            <Link to="/signup">
              <Button size="xl" variant="hero" className="group">
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">LCU Prep</span>
            </div>
            <p>© 2026 LCU Prep. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
