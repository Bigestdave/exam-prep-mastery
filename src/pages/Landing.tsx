import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ValueCard } from "@/components/ValueCard";
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 opacity-0 animate-fade-in">
              <GraduationCap className="w-4 h-4" />
              Exam Preparation Simplified
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
              4 out of 15 Tutorial Questions{' '}
              <span className="gradient-text">will appear in your exam.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
              We provide First Class level solutions to all 15 tutorial questions for Lead City students. 
              Verified answers. Complete coverage. Guaranteed results.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Link to="/signup">
                <Button size="xl" className="group">
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
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <ValueCard
              icon={CheckCircle}
              title="All 15 Solved"
              description="Every tutorial question comes with a comprehensive, exam-ready answer."
              delay={100}
            />
            <ValueCard
              icon={Target}
              title="100% Coverage"
              description="We cover every question that could appear in your examination."
              delay={200}
            />
            <ValueCard
              icon={Award}
              title="First Class Answers"
              description="Solutions crafted to meet the highest academic standards."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to exam success</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with your faculty and level details' },
              { step: '02', title: 'Find Your Course', desc: 'We automatically show courses for your level' },
              { step: '03', title: 'Unlock & Study', desc: 'Access all 15 answers instantly' },
            ].map((item, i) => (
              <div key={i} className="text-center opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100 + 100}ms` }}>
                <div className="text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Pricing Works */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How Pricing Works</h2>
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
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                { q: 'Is payment for all courses or one course?', a: 'Payment is per course. You unlock only the course you choose.' },
                { q: 'Can I see the answers before paying?', a: 'Yes. You can preview one solved tutorial question before unlocking the full course.' },
                { q: 'Will this actually help for exams?', a: 'Exams are set from tutorial questions. We prepare all the tutorials properly, so no question is unfamiliar.' },
                { q: 'When is the best time to get it?', a: 'Most students unlock courses during holidays or early semester to avoid rushing later.' },
                { q: 'How long do I have access after paying?', a: 'Access lasts for the current semester.' },
                { q: 'What if I have an issue after payment?', a: 'Access is automatic. If there\'s any issue, support is available.' },
              ].map((faq, i) => (
                <div key={i} className="opacity-0 animate-fade-in" style={{ animationDelay: `${i * 50 + 100}ms` }}>
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
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
      <footer className="border-t border-border py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">LCU Prep</span>
            </div>
            <p>© 2025 LCU Prep. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
