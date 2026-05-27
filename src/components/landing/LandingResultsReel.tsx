import { useEffect, useRef } from "react";

/**
 * RESULTS REEL — Infinite horizontal auto-scroll of student result screenshots.
 *
 * HOW TO ADD YOUR OWN SCREENSHOTS:
 * 1. Save student result screenshots in  src/assets/results/
 * 2. Import them at the top of this file:
 *    import result1 from "@/assets/results/result-1.png";
 * 3. Replace the `image` field in the RESULTS array below with the imported variable.
 */

interface ResultCard {
  id: number;
  image: string | null;
  caption: string;
  detail: string;
}

// Replace `image: null` with your real screenshot imports
const RESULTS: ResultCard[] = [
  { id: 1, image: null, caption: "Straight A's", detail: "Accounting · 300L" },
  { id: 2, image: null, caption: "6 A's, 1 B", detail: "Business Admin · 400L" },
  { id: 3, image: null, caption: "5 A's, 2 B's", detail: "Economics · 200L" },
  { id: 4, image: null, caption: "Straight A's", detail: "Mass Comm · 300L" },
  { id: 5, image: null, caption: "7 A's", detail: "Public Admin · 400L" },
  { id: 6, image: null, caption: "5 A's, 1 B, 1 C", detail: "Sociology · 300L" },
  { id: 7, image: null, caption: "Straight A's", detail: "Banking & Finance · 200L" },
  { id: 8, image: null, caption: "6 A's, 2 B's", detail: "Marketing · 400L" },
];

const REEL_ITEMS = [...RESULTS, ...RESULTS];

export function LandingResultsReel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const scrollPos = useRef(0);
  const isPaused = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const speed = 0.4;

    const animate = () => {
      if (!isPaused.current && container) {
        scrollPos.current += speed;
        const halfWidth = container.scrollWidth / 2;
        if (scrollPos.current >= halfWidth) {
          scrollPos.current -= halfWidth;
        }
        container.scrollLeft = scrollPos.current;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const handleMouseEnter = () => { isPaused.current = true; };
  const handleMouseLeave = () => { isPaused.current = false; };

  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-t border-border">
      <div className="container px-4 mb-10 md:mb-14 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="chapter-mark justify-center">
            <span className="rule" />
            <span className="label">Last Semester</span>
            <span className="rule" />
          </div>

          <h2 className="text-center mt-5 text-[26px] md:text-[38px] font-display font-bold text-foreground leading-[1.1] tracking-[-0.02em]">
            They read the answers.{" "}
            <span className="font-serif italic text-accent">
              Then they proved it.
            </span>
          </h2>
          <p className="text-center mt-3 text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Students who used LCU Prep walked into the exam hall knowing
            they were ready. Their results speak for themselves.
          </p>
        </div>
      </div>

      {/* Infinite Scroll Reel */}
      <div
        ref={scrollRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-end gap-5 md:gap-6 overflow-hidden select-none px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {REEL_ITEMS.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex-shrink-0 group"
            style={{ width: "200px" }}
          >
            <div className="bg-card rounded-2xl overflow-hidden border border-border/60 shadow-card transition-all duration-500 group-hover:shadow-card-hover group-hover:-translate-y-1">
              {/* Screenshot — natural height, no forced aspect ratio */}
              <div className="w-full overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={`Student result — ${item.caption}`}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                ) : (
                  /* Placeholder — swap with real screenshots */
                  <div
                    className="w-full flex flex-col items-center justify-center gap-2 py-16 px-4"
                    style={{ background: "hsl(var(--secondary))" }}
                  >
                    <span className="text-3xl">📊</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
                      Result
                    </span>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="px-4 py-3 border-t border-border/40">
                <p className="font-display font-bold text-sm text-foreground tracking-[-0.01em]">
                  {item.caption}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mt-1">
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edge fade masks — match page background */}
      <div
        className="absolute left-0 top-0 bottom-0 w-12 md:w-24 z-20 pointer-events-none"
        style={{
          background: "linear-gradient(to right, hsl(40 33% 98%), transparent)",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-12 md:w-24 z-20 pointer-events-none"
        style={{
          background: "linear-gradient(to left, hsl(40 33% 98%), transparent)",
        }}
      />
    </section>
  );
}
