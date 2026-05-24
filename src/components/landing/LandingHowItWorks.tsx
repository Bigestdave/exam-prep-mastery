export function LandingHowItWorks() {
  return (
    <section className="py-16 md:py-24 border-t border-border">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto mb-14">
          <div className="chapter-mark">
            <span className="roman">IV.</span>
            <span className="label">The Method</span>
            <span className="rule" />
          </div>
          <h2 className="text-[28px] md:text-[40px] font-display font-bold text-foreground leading-[1.05] tracking-[-0.02em]">
            Three steps to{" "}
            <span className="font-serif italic text-accent">exam certainty.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10 md:gap-16 max-w-5xl mx-auto">
          {[
            { step: '01', title: 'Find Your Course', desc: 'Sign up and we match courses to your department and level' },
            { step: '02', title: 'Study the Answers', desc: 'Read through every solved tutorial question at your own pace' },
            { step: '03', title: 'Quiz Yourself', desc: 'Take our confidence check to see if you actually retained what you studied' },
          ].map((item, i) => (
            <div
              key={i}
              className="relative opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 100 + 100}ms` }}
            >
              <div className="font-serif italic text-[96px] md:text-[120px] leading-none text-accent/15 mb-2 tracking-[-0.04em]">
                {item.step}
              </div>
              <div className="border-t border-foreground/80 w-12 mb-5" />
              <h3 className="font-display text-xl font-bold text-foreground mb-3 leading-tight">{item.title}</h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
