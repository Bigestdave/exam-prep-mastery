import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, ArrowRight, Brain, BookOpen, Shield } from "lucide-react";
import sovereignKey from "@/assets/sovereign-key.png";
import { useAuth } from "@/contexts/AuthContext";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
});

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
      
      {/* Hero — The Promise */}
      <section className="relative">
        <div className="container pt-8 pb-16 md:pt-12 md:pb-24 px-4">
          <div className="max-w-3xl mx-auto text-left md:text-center">
            <div className="inline-flex items-center gap-2 glass-pill rounded-full text-muted-foreground px-5 py-2 text-xs font-mono font-semibold tracking-[0.15em] uppercase mb-8 opacity-0 animate-fade-in">
              <img src={sovereignKey} alt="" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(89%) saturate(1220%) hue-rotate(117deg) brightness(96%) contrast(88%)' }} />
              Lead City University
            </div>
            
            <h1 className="text-foreground leading-[1.1] mb-6">
              <motion.span
                className="block text-[36px] md:text-5xl lg:text-6xl font-display font-bold leading-[1.1]"
                {...fadeUp(0.1)}
              >
                You've read the notes.
              </motion.span>
              <motion.span
                className="block text-[36px] md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mt-1"
                {...fadeUp(0.2)}
              >
                But will you
              </motion.span>
              <motion.span
                className="block text-[36px] md:text-5xl lg:text-6xl font-serif italic text-accent mt-1"
                {...fadeUp(0.3)}
              >
                remember them?
              </motion.span>
            </h1>
            
            <motion.p 
              className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed"
              {...fadeUp(0.45)}
            >
              We solved every tutorial question your lecturer set, verified to first-class standard. Then we built a quiz so you can prove to yourself you actually know it.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              {...fadeUp(0.55)}
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

      {/* Trust Bar */}
      <section className="border-y border-border glass">
        <div className="container px-4">
          <div className="grid grid-cols-3 divide-x divide-border py-5">
            {[
              { value: '2,400+', label: 'STUDENTS' },
              { value: '98%', label: 'PASS RATE' },
              { value: '₦1,000', label: 'PER COURSE' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-lg md:text-xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-14 md:py-20">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">The Problem</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
              Reading is not the same<br/>as <span className="font-serif italic">knowing</span>
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                You spend hours reading notes, highlighting PDFs, rewriting summaries. 
                But when you sit in the exam hall, your mind goes blank on the one question you "definitely studied."
              </p>
              <p>
                The truth? Reading gives you familiarity. It doesn't give you certainty. 
                You need to test yourself on the exact questions your lecturer will ask, 
                and know you can answer them cold.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get — Value Props */}
      <section className="py-14 md:py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">What You Get</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Solved answers +<br/>a way to <span className="font-serif italic">prove</span> you know them</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { 
                icon: BookOpen, 
                title: 'Every Tutorial Question, Solved', 
                desc: 'All 15 questions answered to first-class standard. No guessing, no "maybe this is right."' 
              },
              { 
                icon: Brain, 
                title: 'Quiz Yourself Before the Exam', 
                desc: 'Our confidence quiz tests you on what you studied. You\'ll know exactly where you\'re strong and where you need to revise.' 
              },
              { 
                icon: Shield, 
                title: 'Verified, Not AI-Generated', 
                desc: 'Every answer is reviewed against your lecturer\'s notes. What you read is what your exam expects.' 
              },
            ].map((item, i) => (
              <div key={i} className="glass-card rounded-2xl p-7 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100 + 100}ms` }}>
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 md:py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">How It Works</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Three steps to<br/>exam certainty</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Find Your Course', desc: 'Sign up and we match courses to your department and level' },
              { step: '02', title: 'Study the Answers', desc: 'Read through every solved tutorial question at your own pace' },
              { step: '03', title: 'Quiz Yourself', desc: 'Take our confidence check to see if you actually retained what you studied' },
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

      {/* Social Proof Quote */}
      <section className="py-14 md:py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-6">From Students Like You</p>
            <blockquote className="text-xl md:text-2xl font-serif italic text-foreground leading-relaxed mb-4">
              "I used to read my notes three times and still feel unsure. With LCU Prep I read the answers once, quizzed myself, scored 90%, and walked into the exam hall knowing I was ready."
            </blockquote>
            <p className="text-sm text-muted-foreground font-display font-semibold">300-Level Student, Faculty of Management Sciences</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-14 md:py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">Pricing</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">Less than what you'd<br/>spend on <span className="font-serif italic">one photocopy</span></h2>
            
            <div className="bg-card rounded-3xl card-float p-6 md:p-8">
              <div className="space-y-0">
                {[
                  'All tutorial questions solved per course',
                  'Free confidence quiz included',
                  'One-time payment, access all semester',
                  'Instant access after payment',
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-border/50 last:border-b-0">
                    <p className="text-sm text-foreground">{item}</p>
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-6 mt-2 border-t border-border">
                <p className="font-display font-bold text-lg">Per Course</p>
                <p className="font-display font-bold text-2xl">₦1,000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">Questions</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">We anticipated<br/>your doubts</h2>
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: 'How do I know this will actually help me pass?', a: 'Your exams are set from tutorial questions. We solve every single one to first-class standard, then give you a quiz to make sure you actually retained the material. Students who use LCU Prep consistently report walking into exams feeling confident, not anxious.' },
                { q: 'Is the quiz free?', a: 'Yes. Every course with quiz data has a free confidence check you can take before or after unlocking. It\'s our way of proving the material works.' },
                { q: 'Is this just AI-generated answers?', a: 'No. Every answer is written and verified against your lecturer\'s actual notes and marking scheme. We don\'t generate generic content.' },
                { q: 'Is payment for all courses or one course?', a: 'Payment is per course. You unlock only the courses you\'re actually taking this semester.' },
                { q: 'Can I see the answers before paying?', a: 'You can preview one solved question per course and take the free quiz before unlocking.' },
                { q: 'How long do I have access after paying?', a: 'Access lasts for the current semester. Study at your own pace.' },
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

      {/* Final CTA */}
      <section className="py-16 md:py-24 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-5">
              Stop hoping you'll remember.<br/>
              <span className="font-serif italic text-accent">Know</span> you will.
            </h2>
            <p className="text-muted-foreground mb-8">
              2,400+ students already preparing with certainty.
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
