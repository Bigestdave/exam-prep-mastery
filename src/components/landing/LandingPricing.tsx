export function LandingPricing() {
  return (
    <section className="py-16 md:py-28 border-t border-border">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-12">
            <div className="chapter-mark">
              <span className="roman">VII.</span>
              <span className="label">The Price</span>
              <span className="rule" />
            </div>
            <h2 className="text-[28px] md:text-[40px] font-display font-bold text-foreground leading-[1.05] tracking-[-0.02em]">
              Less than{" "}
              <span className="font-serif italic text-accent">one photocopy.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-[1.1fr_1fr] gap-10 md:gap-16 items-end border-t border-border pt-10 md:pt-14">
            {/* Massive editorial price */}
            <div className="relative">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-3">
                Per Course · One-time
              </p>
              <div className="flex items-start gap-2">
                <span className="font-display text-[64px] md:text-[96px] leading-[0.85] font-bold text-foreground tracking-[-0.04em]">
                  ₦1,000
                </span>
              </div>
              <p className="font-serif italic text-accent text-2xl md:text-3xl mt-4 leading-tight">
                Access until exam.
              </p>
            </div>

            {/* What's included — bare list, no cards */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-4">
                What's Included
              </p>
              <ul className="space-y-0">
                {[
                  'All tutorial questions solved',
                  '150+ exam-style practice questions',
                  'Free confidence quiz',
                  'Instant access after payment',
                  'Verified against lecturer notes',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 py-3.5 border-b border-border last:border-b-0"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                      0{i + 1}
                    </span>
                    <span className="text-[15px] text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
