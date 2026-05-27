import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

/**
 * PREMIUM GRADE LEDGER SLIDER
 * Features world-class custom spring easing and a tactile luxury editorial aesthetic.
 * Displays actual screenshot images of results.
 * 
 * HOW TO ADD YOUR OWN SCREENSHOTS:
 * 1. Save your generated result screenshots in src/assets/results/
 * 2. Import them at the top of this file:
 *    import result1 from "@/assets/results/result-1.png";
 * 3. Replace the `image: null` in the RESULTS_LEDGER array with the imported variable.
 */

interface ResultData {
  id: number;
  image: string | null;
  level: string;
  gpa: string;
  standing: string;
  headline: string;
  quote: string;
}

const RESULTS_LEDGER: ResultData[] = [
  {
    id: 1,
    image: null, // Replace with your image import, e.g., result1
    level: "100 Level",
    gpa: "5.00 / 5.00",
    standing: "First Class Honours",
    headline: "Straight A's. The broadsheet doesn't lie.",
    quote: "I was terrified of my first year exams. LCU Prep completely de-risked the exams for me. The solutions were so clear that studying took half the time, and I ended up scoring an A in every paper.",
  },
  {
    id: 2,
    image: null,
    level: "100 Level",
    gpa: "4.83 / 5.00",
    standing: "First Class Honours",
    headline: "Proven academic authority.",
    quote: "Before LCU Prep, studying past questions was mostly guesswork—you never knew if the answers you found online were correct. Having verified, step-by-step solutions is a literal cheat code for freshmen.",
  },
  {
    id: 3,
    image: null,
    level: "100 Level",
    gpa: "4.67 / 5.00",
    standing: "First Class Honours",
    headline: "Tactile evidence of prep.",
    quote: "Our final results were pasted on the board, and students were literally crying. I walked up, saw my grades, and smiled. Every single core concept in LCU Prep showed up exactly on the exam papers.",
  },
  {
    id: 4,
    image: null,
    level: "100 Level",
    gpa: "4.50 / 5.00",
    standing: "First Class Honours",
    headline: "Absolute mastery, printed.",
    quote: "I didn't study more hours. I just studied the exact questions that actually came out. LCU Prep helps you focus on what matters instead of reading the entire textbook the night before.",
  },
  {
    id: 5,
    image: null,
    level: "100 Level",
    gpa: "4.75 / 5.00",
    standing: "First Class Honours",
    headline: "No guesswork. Just results.",
    quote: "The transition to university was hard, but exam week wasn't. Having access to the exact solutions from previous years gave me the confidence to walk into the exam hall knowing I was ready.",
  },
  {
    id: 6,
    image: null,
    level: "100 Level",
    gpa: "5.00 / 5.00",
    standing: "First Class Honours",
    headline: "Perfect score, perfectly prepared.",
    quote: "When the broadsheet was pasted, my classmates thought it was a miracle. But it was just LCU Prep. It's the smartest investment any 100L student can make for their grades.",
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
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="chapter-mark justify-center">
            <span className="rule" />
            <span className="label">The Archives of Excellence</span>
            <span className="rule" />
          </div>

          <h2 className="mt-5 text-[28px] md:text-[40px] font-display font-bold text-foreground leading-[1.1] tracking-[-0.03em]">
            They read the answers.{" "}
            <span className="font-serif italic text-accent block sm:inline">
              Then they proved it.
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Real results from students who walked into the exam hall knowing they were ready.
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
              {/* 1. ACTUAL SCREENSHOT CARD */}
              <div className="w-full max-w-4xl bg-card border border-border/60 rounded-2xl shadow-card p-4 md:p-6 relative overflow-hidden group select-none">
                
                {/* Stamped Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border/40 text-neutral-500 font-mono uppercase text-[9px] tracking-[0.2em]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LCU PREP · AUTHENTIC RECORD EXCERPT</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F0EDEA] px-2 py-0.5 rounded text-neutral-600 font-medium">
                    <ShieldCheck className="w-3 h-3 text-accent" />
                    <span>CONFIDENTIAL IDENTITY PROTECTED</span>
                  </div>
                </div>

                {/* Screenshot Image Container */}
                <div className="w-full overflow-hidden bg-[#FAF8F3] rounded-lg flex items-center justify-center min-h-[200px]">
                  {activeResult.image ? (
                    <img
                      src={activeResult.image}
                      alt={`Student result — ${activeResult.headline}`}
                      className="w-full h-auto object-contain shadow-sm rounded-sm"
                      loading="lazy"
                    />
                  ) : (
                    /* Elegant Placeholder for the generated images */
                    <div className="w-full flex flex-col items-center justify-center gap-3 py-20 px-4 text-center border-2 border-dashed border-[#E5DECD] rounded-lg">
                      <span className="text-4xl opacity-50">📸</span>
                      <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                        Awaiting Image Generation
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 max-w-xs">
                        Upload your AI-generated blurred result image here to replace this placeholder.
                      </div>
                    </div>
                  )}
                </div>

                {/* Stamped Certification Seal */}
                <div className="absolute top-12 right-6 md:right-10 rotate-[-12deg] border-2 border-dashed border-emerald-600/60 rounded px-3 py-1 text-[10px] font-black text-emerald-600/90 font-mono tracking-[0.2em] bg-emerald-50/70 uppercase select-none pointer-events-none shadow-sm">
                  VERIFIED LEDGER
                </div>
              </div>

              {/* 2. PREMIUM EDITORIAL COPY & QUOTE */}
              <div className="w-full max-w-3xl text-center flex flex-col items-center">
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground bg-[#F0EDEA] px-2.5 py-1 rounded">
                    {activeResult.level}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-bold">
                    Freshman Year
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-display font-bold text-foreground tracking-[-0.015em] mb-4">
                  “{activeResult.headline}”
                </h3>

                <blockquote className="font-serif italic text-base md:text-lg text-foreground/80 leading-relaxed max-w-2xl px-6 relative mb-6">
                  “{activeResult.quote}”
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-neutral-300" />
                  <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
                    End of Year Standing: <span className="text-foreground font-bold">{activeResult.standing}</span> (GPA {activeResult.gpa})
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
