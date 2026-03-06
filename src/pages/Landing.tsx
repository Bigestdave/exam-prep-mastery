import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, ArrowRight } from "lucide-react";
import sovereignKey from "@/assets/sovereign-key.png";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const MotionButton = motion.create(Button);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={!!user} userName={profile?.full_name || ''} />
      
      {/* Hero Section — The Manifesto */}
      <section className="relative">
        <div className="container py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-left md:text-center">
            <div className="inline-flex items-center gap-2 glass-pill rounded-full text-muted-foreground px-5 py-2 text-xs font-mono font-semibold tracking-[0.15em] uppercase mb-8 opacity-0 animate-fade-in">
              <img src={sovereignKey} alt="" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(89%) saturate(1220%) hue-rotate(117deg) brightness(96%) contrast(88%)' }} />
              Lead City University
            </div>
            
            <h1 className="text-foreground leading-[1.1] mb-6">
              <motion.span
                className="block text-7xl md:text-8xl lg:text-9xl font-display font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                6 <span className="text-4xl md:text-5xl lg:text-6xl text-muted-foreground font-serif italic">of</span> 15
              </motion.span>
              {["Tutorial Questions", "will appear in", "your exam,"].map((line, i) => (
                <motion.span
                  key={i}
                  className="block text-3xl md:text-4xl lg:text-5xl font-display font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {line}
                </motion.span>
              ))}
              <motion.span
                className="block text-3xl md:text-4xl lg:text-5xl font-serif italic text-accent mt-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                guaranteed.
              </motion.span>
            </h1>
            
            <motion.p 
              className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              Stop searching through 40-page PDFs. We solved the exact 15 questions for you, verified, exam-ready, first-class standard.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 [&>a+a]:mt-0 sm:[&>a+a]:mt-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
            >
              <Link to="/signup">
                <MotionButton 
                  size="xl" variant="hero" className="group"
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  Find My Course
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </MotionButton>
              </Link>
              <Link to="/login">
                <MotionButton 
                  variant="hero-outline" size="xl"
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  I have an account
                </MotionButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar — Editorial + Glass */}
      <section className="border-y border-border glass">
        <div className="container px-4">
          <div className="flex items-center justify-center gap-4 md:gap-8 py-5 trust-bar text-center flex-wrap">
            <span>Verified Answers</span>
            <span className="text-border">✦</span>
            <span>LCU Standard</span>
            <span className="text-border">✦</span>
            <span>Instant Access</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 md:py-20">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">How It Works</h2>
            <p className="text-muted-foreground text-sm">Three steps to exam confidence</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with your department and level' },
              { step: '02', title: 'Find Your Course', desc: 'We show courses matched to your level' },
              { step: '03', title: 'Unlock & Study', desc: 'Access all 15 verified answers instantly' },
            ].map((item, i) => (
              <div key={i} className="glass-card rounded-2xl p-8 text-center opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100 + 100}ms` }}>
                <div className="text-5xl font-display font-bold text-border mb-4">{item.step}</div>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Pricing Works */}
      <section className="py-14 md:py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 text-center">How Pricing Works</h2>
            <div className="space-y-4">
              {[
                'Each course is unlocked separately',
                'You only pay for the courses you are taking',
                'One-time payment per course, per semester',
                'Access is instant after payment',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 50 + 100}ms` }}>
                  <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 text-center">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: 'Is payment for all courses or one course?', a: 'Payment is per course. You unlock only the course you choose.' },
                { q: 'Can I see the answers before paying?', a: 'Yes. You can preview one solved tutorial question before unlocking the full course.' },
                { q: 'Will this actually help for exams?', a: 'Exams are set from tutorial questions. We prepare all the tutorials properly, so no question is unfamiliar.' },
                { q: 'When is the best time to get it?', a: 'Most students unlock courses during holidays or early semester to avoid rushing later.' },
                { q: 'How long do I have access after paying?', a: 'Access lasts for the current semester.' },
                { q: 'What if I have an issue after payment?', a: 'Access is automatic. If there\'s any issue, support is available.' },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border">
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
      <section className="py-16 md:py-24 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-5">
              Ready to ace your exams?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of students already preparing <span className="font-serif italic">smarter.</span>
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
      <footer className="border-t border-border py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <img src={sovereignKey} alt="LCU Prep" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0)' }} />
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
