import { AlertCircle, Target, Brain } from "lucide-react";

export function LandingQuizDiscovery() {
  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">After Taking The Quiz</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">
            What students discover<br/>about <span className="font-serif italic">their own</span> readiness
          </h2>
          
          <div className="space-y-4">
            {[
              { 
                icon: AlertCircle, 
                text: 'The 3 questions they thought they knew, but actually misunderstood' 
              },
              { 
                icon: Target, 
                text: 'The trick questions lecturers repeat every semester' 
              },
              { 
                icon: Brain, 
                text: 'Whether they are actually exam ready, or just familiar with the material' 
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 glass-card rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100 + 100}ms` }}>
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-accent" />
                </div>
                <p className="text-foreground font-medium leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
