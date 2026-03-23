export function LandingProblem() {
  return (
    <section className="py-14 md:py-20">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-6">The Real Problem</p>
          
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-2 leading-tight">
            Reading gives you familiarity.
          </h2>
          <h2 className="text-2xl md:text-4xl font-serif italic text-accent mb-8 leading-tight">
            It doesn't give you certainty.
          </h2>
          
          <div className="space-y-4 text-muted-foreground leading-relaxed">
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
    </section>
  );
}
