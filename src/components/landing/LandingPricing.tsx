import { CheckCircle } from "lucide-react";

export function LandingPricing() {
  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">Pricing</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">Less than what you'd<br/>spend on <span className="font-serif italic">one photocopy</span></h2>
          
          <div className="bg-card rounded-3xl card-float p-6 md:p-8">
            <div className="space-y-0">
              {[
                'All tutorial questions solved per course',
                '150+ exam-style practice questions',
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
  );
}
