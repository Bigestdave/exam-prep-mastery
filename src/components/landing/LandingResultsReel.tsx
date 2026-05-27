import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import result1 from "@/assets/results/result-1.png";
import result2 from "@/assets/results/result-2.png";
import result3 from "@/assets/results/result-3.png";
import result4 from "@/assets/results/result-4.png";
import result5 from "@/assets/results/result-5.png";
import result6 from "@/assets/results/result-6.png";

/**
 * PREMIUM GRADE LEDGER SLIDER
 * Features world-class custom spring easing and a tactile luxury editorial aesthetic.
 * Displays actual screenshot images of results inside a clean, modern browser-style casing.
 */

interface ResultData {
  id: number;
  image: string | null;
  level: string;
  gpa: string;
  standing: string;
  quote: string;
}

const RESULTS_LEDGER: ResultData[] = [
  {
    id: 1,
    image: result1,
    level: "300 Level",
    gpa: "5.00 / 5.00",
    standing: "First Class",
    quote: "Kachi. C",
  },
  {
    id: 2,
    image: result2,
    level: "400 Level",
    gpa: "4.83 / 5.00",
    standing: "First Class",
    quote: "David. O.",
  },
  {
    id: 3,
    image: result3,
    level: "200 Level",
    gpa: "4.67 / 5.00",
    standing: "First Class",
    quote: "Mimi. C",
  },
  {
    id: 4,
    image: result4,
    level: "100 Level",
    gpa: "4.50 / 5.00",
    standing: "Second Class Upper",
    quote: "Anjola. L",
  },
  {
    id: 5,
    image: result5,
    level: "300 Level",
    gpa: "4.75 / 5.00",
    standing: "First Class",
    quote: "Aliyah. A",
  },
  {
    id: 6,
    image: result6,
    level: "200 Level",
    gpa: "5.00 / 5.00",
    standing: "First Class",
    quote: "Steph. O",
  }
];

export function LandingResultsReel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const SLIDE_DURATION = 8000; // 8 seconds per slide for relaxed reading

  const nextSlide = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % RESULTS_LEDGER.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + RESULTS_LEDGER.length) % RESULTS_LEDGER.length);
  }, []);

  // Auto-play loop
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  const activeResult = RESULTS_LEDGER[index];

  // Custom World-Class spring easing config
  const springTransition = {
    type: "spring",
    stiffness: 240,
    damping: 24,
    mass: 0.8,
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 160 : -160,
      opacity: 0,
      scale: 0.96,
      rotateY: dir > 0 ? 8 : -8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: springTransition,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.97,
      rotateY: dir > 0 ? -6 : 6,
      transition: {
        ease: [0.16, 1, 0.3, 1], // Custom Apple-style decelerating cubic-bezier for exits
        duration: 0.45,
      },
    }),
  };

  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-t border-border bg-[#FDFBF7]">
      {/* Background Graphic Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#1b3a5c_1px,transparent_1px),linear-gradient(to_bottom,#1b3a5c_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="container px-4 max-w-5xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="chapter-mark justify-center">
            <span className="rule" />
            <span className="label">Department Results</span>
            <span className="rule" />
          </div>

          <h2 className="mt-5 text-[28px] md:text-[40px] font-display font-bold text-foreground leading-[1.1] tracking-[-0.02em]">
            Students reading with LCU Prep are already{" "}
            <span className="font-serif italic text-accent block sm:inline">
              outperforming in their departments.
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            When the results are pasted, the difference is clear.
          </p>
        </div>

        {/* Testimonial Showcase Container */}
        <div
          className="relative min-h-[460px] md:min-h-[480px] flex flex-col justify-between"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={activeResult.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex flex-col items-center gap-8 md:gap-12"
            >
              {/* 1. MINIMALIST DOCUMENT/BROWSER SCREENSHOT CARD */}
              <div className="w-full max-w-4xl bg-card border border-border/60 rounded-2xl shadow-card p-4 md:p-6 relative overflow-hidden select-none">
                
                {/* Minimalist Document Tab Header */}
                <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-border/40 text-[10px] text-muted-foreground font-mono tracking-wider">
                  <div className="flex items-center gap-2">
                    {/* 3 mini elegant macOS-style window control dots */}
                    <div className="flex gap-1.5 mr-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-neutral-200/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-neutral-200/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-neutral-200/80" />
                    </div>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>OFFICIAL GRADE SHEET EXCERPT</span>
                  </div>
                  <div className="hidden sm:block text-[9px] uppercase bg-neutral-100 px-2 py-0.5 rounded text-neutral-600 font-mono tracking-[0.1em]">
                    Verified Proof
                  </div>
                </div>

                {/* Screenshot Image Container */}
                <div className="w-full overflow-hidden bg-[#FAF8F3] rounded-lg flex items-center justify-center min-h-[160px] md:min-h-[200px]">
                  {activeResult.image ? (
                    <img
                      src={activeResult.image}
                      alt="Student result"
                      className="w-full h-auto object-contain shadow-sm rounded-sm"
                      loading="lazy"
                    />
                  ) : (
                    /* Elegant Placeholder */
                    <div className="w-full flex flex-col items-center justify-center gap-3 py-20 px-4 text-center border-2 border-dashed border-[#E5DECD] rounded-lg">
                      <span className="text-4xl opacity-50">📄</span>
                      <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                        Awaiting Screenshot
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 max-w-xs">
                        Add the result image in the component to display it here.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. PREMIUM EDITORIAL COPY & QUOTE */}
              <div className="w-full max-w-3xl text-center flex flex-col items-center">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground bg-[#F0EDEA] px-2.5 py-1 rounded">
                    {activeResult.level}
                  </span>
                </div>

                <blockquote className="font-serif italic text-lg md:text-xl text-foreground/90 leading-relaxed max-w-2xl px-6 relative mb-6">
                  “{activeResult.quote}”
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-neutral-300" />
                  <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
                    Current Standing: <span className="text-foreground font-bold">{activeResult.standing}</span> (GPA {activeResult.gpa})
                  </div>
                  <div className="h-[1px] w-8 bg-neutral-300" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Luxury Timeline Navigation & controls */}
          <div className="flex items-center justify-between border-t border-border/60 pt-8 mt-6">
            {/* Slide Count */}
            <div className="text-xs font-mono text-muted-foreground select-none">
              <span className="text-foreground font-bold">0{index + 1}</span> / 0{RESULTS_LEDGER.length}
            </div>

            {/* Micro Timeline Indicator dots */}
            <div className="flex items-center gap-2 relative">
              {RESULTS_LEDGER.map((res, idx) => (
                <button
                  key={res.id}
                  onClick={() => {
                    setDirection(idx > index ? 1 : -1);
                    setIndex(idx);
                  }}
                  className="relative h-6 flex items-center px-1"
                >
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === index ? "w-8 bg-accent" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
                    }`}
                  />
                  {/* Subtle active slide progress line inside the active indicator */}
                  {idx === index && !isPaused && (
                    <motion.div
                      layoutId="activeSlideProgress"
                      className="absolute bottom-0 left-1 right-1 h-0.5 bg-accent"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                      style={{ originX: 0 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Custom high-end button controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-white hover:bg-secondary/40 text-foreground hover:text-accent hover:border-accent hover:-translate-x-0.5 active:translate-x-0 transition-all duration-300 shadow-sm"
                title="Previous proof ledger"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-white hover:bg-secondary/40 text-foreground hover:text-accent hover:border-accent hover:translate-x-0.5 active:translate-x-0 transition-all duration-300 shadow-sm"
                title="Next proof ledger"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

