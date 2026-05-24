import { motion } from "framer-motion";
import { Target, TrendingUp } from "lucide-react";

export function LandingQuizPreview() {
  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="chapter-mark">
                <span className="roman">V.</span>
                <span className="label">See It In Action</span>
                <span className="rule" />
              </div>
              <h2 className="text-[28px] md:text-[40px] font-display font-bold text-foreground mb-4 leading-[1.05] tracking-[-0.02em]">
                Know your readiness<br/>
                <span className="font-serif italic text-accent">before</span> the exam hall.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                After studying, take our quiz and get an instant readiness score. No more guessing if you're prepared. You'll see exactly where you stand.
              </p>
            </div>
            
            {/* Product Mockup */}
            <motion.div 
              className="bg-card rounded-3xl shadow-elevated p-6 md:p-8 border border-border"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="text-center mb-6">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Your Readiness Score</p>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" className="stroke-border" strokeWidth="8" />
                    <circle 
                      cx="60" cy="60" r="54" fill="none" 
                      className="stroke-accent" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 54 * 0.76} ${2 * Math.PI * 54 * 0.24}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-display font-bold text-foreground">76%</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  Building Confidence
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Questions answered</span>
                  <span className="text-sm font-semibold text-foreground">19 / 25</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Current tier</span>
                  <span className="text-sm font-semibold text-accent">Silver</span>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <Target className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">1 question away from Gold</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
