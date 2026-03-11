export function LandingHowItWorks() {
  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">How It Works</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Three steps to<br/>exam certainty</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '01', title: 'Find Your Course', desc: 'Sign up and we match courses to your department and level' },
            { step: '02', title: 'Study the Answers', desc: 'Read through every solved tutorial question at your own pace' },
            { step: '03', title: 'Quiz Yourself', desc: 'Take our confidence check to see if you actually retained what you studied' },
          ].map((item, i) => (
            <div key={i} className="glass-card rounded-2xl p-8 text-center opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100 + 100}ms` }}>
              <div className="text-5xl font-display font-bold text-border mb-4">{item.step}</div>
              <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
