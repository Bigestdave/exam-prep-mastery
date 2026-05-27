import { useEffect, useRef } from "react";

/**
 * RESULTS REEL — Infinite horizontal auto-scroll of student result screenshots.
 *
 * HOW TO ADD YOUR OWN SCREENSHOTS:
 * 1. Save student result screenshots as .png or .jpg in  src/assets/results/
 *    e.g. result-1.png, result-2.png, etc.
 * 2. Import them at the top of this file:
 *    import result1 from "@/assets/results/result-1.png";
 * 3. Replace the `image` field in the RESULTS array below with the imported variable.
 */

interface ResultCard {
  id: number;
  /** Import path or URL to the screenshot image */
  image: string | null;
  /** e.g. "Straight A's", "5 A's, 2 B's" */
  caption: string;
  /** e.g. "Business Admin · 300L" */
  detail: string;
}

// Placeholder results — replace `image` with real screenshot imports
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

// Duplicate for seamless infinite loop
const REEL_ITEMS = [...RESULTS, ...RESULTS];

export function LandingResultsReel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const scrollPos = useRef(0);
  const isPaused = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const speed = 0.4; // px per frame — slow & luxurious

    const animate = () => {
      if (!isPaused.current && container) {
        scrollPos.current += speed;

        // Reset seamlessly when we've scrolled past the first set
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
    <section className="relative overflow-hidden py-16 md:py-24" style={{
      background: 'linear-gradient(135deg, hsl(20 14% 11%) 0%, hsl(20 12% 8%) 60%, hsl(25 10% 6%) 100%)',
    }}>
      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container px-4 mb-10 md:mb-14 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Chapter mark — editorial header */}
          <div className="chapter-mark justify-center">
            <span className="rule" style={{ background: 'hsla(40,33%,98%,0.12)' }} />
            <span className="label" style={{ color: 'hsla(40,33%,98%,0.45)' }}>
              Last Semester's Results
            </span>
            <span className="rule" style={{ background: 'hsla(40,33%,98%,0.12)' }} />
          </div>

          <h2
            className="text-center mt-5 text-[26px] md:text-[38px] font-display font-bold leading-[1.1] tracking-[-0.02em]"
            style={{ color: 'hsl(40 33% 98%)' }}
          >
            Real students. Real grades.
          </h2>
          <p
            className="text-center mt-3 text-sm md:text-base max-w-md mx-auto leading-relaxed"
            style={{ color: 'hsla(40,33%,98%,0.50)' }}
          >
            These are actual results from students who used LCU Prep last semester.
          </p>
        </div>
      </div>

      {/* Infinite Scroll Reel */}
      <div
        ref={scrollRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex gap-5 md:gap-7 overflow-hidden cursor-grab active:cursor-grabbing select-none px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {REEL_ITEMS.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex-shrink-0 group"
            style={{ width: '220px' }}
          >
            {/* Polaroid-style card */}
            <div
              className="rounded-2xl overflow-hidden transition-transform duration-500 group-hover:scale-[1.03]"
              style={{
                background: 'hsla(40,33%,98%,0.06)',
                border: '1px solid hsla(40,33%,98%,0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Screenshot area */}
              <div
                className="w-full aspect-[3/4] flex items-center justify-center overflow-hidden"
                style={{ background: 'hsla(40,33%,98%,0.03)' }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={`Student result — ${item.caption}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  /* Placeholder — replace with real screenshots */
                  <div className="flex flex-col items-center gap-3 px-4 text-center">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: 'hsla(40,33%,98%,0.06)',
                        border: '1px solid hsla(40,33%,98%,0.08)',
                      }}
                    >
                      🎓
                    </div>
                    <span
                      className="text-xs font-mono uppercase tracking-widest"
                      style={{ color: 'hsla(40,33%,98%,0.30)' }}
                    >
                      Result Screenshot
                    </span>
                  </div>
                )}
              </div>

              {/* Caption area */}
              <div className="px-4 py-4">
                <p
                  className="font-display font-bold text-sm tracking-[-0.01em]"
                  style={{ color: 'hsl(40 33% 98%)' }}
                >
                  {item.caption}
                </p>
                <p
                  className="text-[10px] font-mono uppercase tracking-[0.18em] mt-1.5"
                  style={{ color: 'hsla(40,33%,98%,0.40)' }}
                >
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edge fade masks */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, hsl(20 14% 11%), transparent)',
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, hsl(25 10% 6%), transparent)',
        }}
      />
    </section>
  );
}
