export function LandingSocialProof() {
  return (
    <section className="py-16 md:py-28 border-t border-border bg-secondary/40">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <div className="chapter-mark justify-center">
            <span className="rule" />
            <span className="label">From Students Like You</span>
            <span className="rule" />
          </div>
          <div className="relative text-center mt-6">
            <span
              aria-hidden
              className="absolute -top-10 md:-top-20 left-1/2 -translate-x-1/2 font-serif italic text-accent/15 text-[140px] md:text-[220px] leading-none select-none pointer-events-none"
            >
              "
            </span>
            <blockquote className="relative text-[22px] md:text-[32px] font-serif italic text-foreground leading-[1.35] mb-6 px-4">
              I read my notes three times and still felt unsure. With LCU Prep I read the answers once, quizzed myself, scored 90%, and walked into the exam hall knowing I was ready.
            </blockquote>
            <div className="editorial-rule max-w-[120px] mx-auto" />
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground mt-4">
              300-Level · Faculty of Management Sciences
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
