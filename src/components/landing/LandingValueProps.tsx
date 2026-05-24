export function LandingValueProps() {
  return (
    <section className="py-16 md:py-24 border-t border-border">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto mb-14">
          <div className="chapter-mark">
            <span className="roman">III.</span>
            <span className="label">What You Get</span>
            <span className="rule" />
          </div>
          <h2 className="text-[28px] md:text-[40px] font-display font-bold text-foreground leading-[1.05] tracking-[-0.02em]">
            Solved answers, and a way to{" "}
            <span className="font-serif italic text-accent">prove</span> you know them.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border max-w-5xl mx-auto border-y border-border">
          {[
            {
              n: '01',
              title: 'Every Tutorial Question, Solved',
              desc: 'All 15 questions answered to first-class standard. Written directly from the course materials your lecturer gave your class, not guessed answers.',
              stat: '150+ exam-style questions per course'
            },
            {
              n: '02',
              title: 'Quiz Yourself Before the Exam',
              desc: 'Our confidence quiz tests you on what you studied. You\'ll know exactly where you\'re strong and where you need to revise.',
              stat: 'Instant readiness score after every attempt'
            },
            {
              n: '03',
              title: 'Verified Against Lecturer Notes',
              desc: 'Every answer is written from your course materials and verified against their lecture notes. What you read is what your exam expects.',
              stat: 'First-class standard, every answer'
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-background p-7 md:p-10 opacity-0 animate-fade-in flex flex-col"
              style={{ animationDelay: `${i * 100 + 100}ms` }}
            >
              <div className="flex items-baseline justify-between mb-6">
                <span className="font-display text-[44px] md:text-[56px] font-bold text-foreground leading-none tracking-[-0.04em]">
                  {item.n}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                  / 03
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3 leading-tight">{item.title}</h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed mb-5 flex-1">{item.desc}</p>
              <p className="text-[11px] font-mono text-accent font-semibold uppercase tracking-[0.15em] pt-4 border-t border-border">{item.stat}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
