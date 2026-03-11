export function LandingTrustBar() {
  return (
    <section className="border-y border-border glass">
      <div className="container px-4">
        <div className="grid grid-cols-3 divide-x divide-border py-5">
          {[
            { value: '2,400+', label: 'STUDENTS' },
            { value: '30+', label: 'DEPARTMENTS' },
            { value: '₦1,000', label: 'PER COURSE' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-lg md:text-xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
