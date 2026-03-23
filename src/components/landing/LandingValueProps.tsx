import { BookOpen, Brain, Shield } from "lucide-react";

export function LandingValueProps() {
  return (
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
              desc: 'All 15 questions answered to first-class standard. Written directly from the course materials your lecturer gave your class, not guessed answers.',
              stat: '150+ exam-style questions per course'
            },
            { 
              icon: Brain, 
              title: 'Quiz Yourself Before the Exam', 
              desc: 'Our confidence quiz tests you on what you studied. You\'ll know exactly where you\'re strong and where you need to revise.',
              stat: 'Instant readiness score after every attempt'
            },
            { 
              icon: Shield, 
              title: 'Verified Against Lecturer Notes', 
              desc: 'Every answer is written from your course materials and verified against their lecture notes. What you read is what your exam expects.',
              stat: 'First-class standard, every answer'
            },
          ].map((item, i) => (
            <div key={i} className="glass-card rounded-2xl p-7 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100 + 100}ms` }}>
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
              <p className="text-xs font-mono text-accent font-semibold uppercase tracking-wide">{item.stat}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
