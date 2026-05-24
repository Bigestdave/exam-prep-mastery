export function LandingProblem() {
  return (
    <section className="relative py-16 md:py-28 overflow-hidden">
      <div className="container px-4">
        <div className="relative max-w-2xl mx-auto">
          <div className="ghost-numeral absolute -top-4 -left-2 md:-left-16 text-[200px] md:text-[320px]">II</div>

          <div className="relative">
            <div className="chapter-mark">
              <span className="roman">II.</span>
              <span className="label">The Real Problem</span>
              <span className="rule" />
            </div>

            <h2 className="text-[28px] md:text-[44px] font-display font-bold text-foreground mb-1 leading-[1.05] tracking-[-0.02em]">
              Reading gives you familiarity.
            </h2>
            <h2 className="text-[32px] md:text-[52px] font-serif italic text-accent mb-10 leading-[1.02]">
              It doesn't give you certainty.
            </h2>

            <div className="space-y-5 text-muted-foreground leading-relaxed text-base md:text-lg">
            <p>
              You spend hours reading notes, PDFs, and trying to answer tutorial questions. 
              But when you sit in the exam hall, your mind goes blank on the one question you "definitely studied."
            </p>
            <p>
              The truth is you recognized the questions but you didn't <span className="text-foreground font-semibold">know</span> it. 
              There's a difference between "I've seen this before" and "I can answer this right now."
            </p>
            <p>
              You need to test yourself on the exact questions your lecturer will ask, 
              and know you can answer them cold.
            </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
