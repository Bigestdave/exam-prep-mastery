export function LandingQuizDiscovery() {
  return (
    <section className="py-16 md:py-24 border-t border-border">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto">
          <div className="chapter-mark">
            <span className="roman">V.</span>
            <span className="label">After Taking The Quiz</span>
            <span className="rule" />
          </div>
          <h2 className="text-[28px] md:text-[40px] font-display font-bold text-foreground mb-10 leading-[1.05] tracking-[-0.02em]">
            What students discover about{" "}
            <span className="font-serif italic text-accent">their own</span> readiness.
          </h2>

          <ul className="border-t border-border">
            {[
              'Which questions they need to focus on and put more time into understanding.',
              'Which tricky questions they might forget the answers to in the exam hall.',
              'Whether they are actually ready for the exam.',
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-5 md:gap-7 py-6 border-b border-border opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 100 + 100}ms` }}
              >
                <span className="font-serif italic text-accent text-2xl md:text-3xl leading-none pt-1 tabular-nums">
                  0{i + 1}
                </span>
                <p className="text-foreground text-lg md:text-xl font-display leading-snug flex-1">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
