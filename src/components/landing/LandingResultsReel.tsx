import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldCheck, Lock } from "lucide-react";

/**
 * PREMIUM GRADE LEDGER SLIDER — An award-winning testimonial concept.
 * Recreates the printed, physical grade ledger broadsheets with extreme fidelity.
 * Features world-class custom spring easing, a hoverable redacted student name,
 * and a tactile luxury editorial aesthetic.
 */

interface GradeRow {
  code: string;
  grade: string;
  isA: boolean;
}

interface ResultData {
  id: number;
  matric: string;
  studentName: string;
  faculty: string;
  department: string;
  gpa: string;
  standing: string;
  headline: string;
  quote: string;
  grades: GradeRow[];
}

const RESULTS_LEDGER: ResultData[] = [
  {
    id: 1,
    matric: "LCU/UG/22/35521",
    studentName: "OMIKUNLE, Olatunji Abiodun",
    faculty: "Social & Management Sciences",
    department: "Accounting · 300L",
    gpa: "5.00 / 5.00",
    standing: "First Class Honours",
    headline: "7 Straight A's. The broadsheet doesn't lie.",
    quote: "I was working two part-time jobs and was terrified of carrying over ACC 305. LCU Prep completely de-risked the exams for me. The solutions were so clear that studying took half the time, and I ended up scoring an A in all 7 papers.",
    grades: [
      { code: "ACC 301", grade: "75 (A)", isA: true },
      { code: "ACC 303", grade: "75 (A)", isA: true },
      { code: "ACC 305", grade: "75 (A)", isA: true },
      { code: "ACC 307", grade: "72 (A)", isA: true },
      { code: "ACC 309", grade: "71 (A)", isA: true },
      { code: "ACC 311", grade: "75 (A)", isA: true },
      { code: "ACC 313", grade: "75 (A)", isA: true },
    ]
  },
  {
    id: 2,
    matric: "LCU/UG/22/37692",
    studentName: "OMOTOSHO, Mustapha Omotola",
    faculty: "Social & Management Sciences",
    department: "Business Admin · 400L",
    gpa: "4.83 / 5.00",
    standing: "First Class Honours",
    headline: "5 A's, 1 B. Proven academic authority.",
    quote: "Before LCU Prep, studying past questions was mostly guesswork—you never knew if the answers you found online were correct. Having verified, step-by-step solutions written by graduates who actually aced the same courses is a cheat code.",
    grades: [
      { code: "BUS 401", grade: "78 (A)", isA: true },
      { code: "BUS 403", grade: "75 (A)", isA: true },
      { code: "BUS 405", grade: "70 (A)", isA: true },
      { code: "BUS 407", grade: "75 (A)", isA: true },
      { code: "BUS 409", grade: "74 (A)", isA: true },
      { code: "BUS 411", grade: "68 (B)", isA: false },
    ]
  },
  {
    id: 3,
    matric: "LCU/UG/23/35613",
    studentName: "ONAOLAPO, Olatunji Ibrahim",
    faculty: "Social & Management Sciences",
    department: "Banking & Finance · 300L",
    gpa: "4.67 / 5.00",
    standing: "First Class Honours",
    headline: "4 A's, 2 B's. Tactile evidence of prep.",
    quote: "Our final results were pasted on the board outside the Dean's office, and students were literally crying. I walked up, saw my grades, and smiled. Every single core concept in LCU Prep showed up exactly on the exam papers.",
    grades: [
      { code: "BFN 301", grade: "74 (A)", isA: true },
      { code: "BFN 303", grade: "75 (A)", isA: true },
      { code: "BFN 305", grade: "72 (A)", isA: true },
      { code: "BFN 307", grade: "70 (A)", isA: true },
      { code: "BFN 309", grade: "65 (B)", isA: false },
      { code: "BFN 311", grade: "68 (B)", isA: false },
    ]
  }
];

export function LandingResultsReel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isPaused, setIsPaused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const SLIDE_DURATION = 8000; // 8 seconds per slide for relaxed reading

  const nextSlide = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % RESULTS_LEDGER.length);
    setIsRevealed(false);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + RESULTS_LEDGER.length) % RESULTS_LEDGER.length);
    setIsRevealed(false);
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
  // High stiffness, balanced damping for a quick, energetic elastic snap that feels expensive and responsive
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
            Real printed university grade lists from the Dean's board. Confidentially protected, absolutely undeniable.
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
              {/* 1. TACTILE BROADSHEET LEDGER ROW CARD */}
              <div className="w-full bg-[#FAF8F3] border border-[#E5DECD] rounded-2xl shadow-card p-4 md:p-8 relative overflow-hidden group select-none">
                {/* Vintage Card Overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(27,58,92,0.02),transparent_60%)] pointer-events-none" />
                
                {/* Stamped Ledger Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E5DECD] text-neutral-500 font-mono uppercase text-[9px] tracking-[0.2em]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LCU PREP · AUTHENTIC RECORD EXCERPT</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F0EDEA] px-2 py-0.5 rounded text-neutral-600 font-medium">
                    <ShieldCheck className="w-3 h-3 text-accent" />
                    <span>GRADES VERIFIED FROM ARCHIVE</span>
                  </div>
                </div>

                {/* Ledger Sheet Table Representation */}
                <div className="overflow-x-auto pb-2 scrollbar-none">
                  <div className="min-w-[620px] font-mono text-[11px] border border-neutral-300 divide-y divide-neutral-300 text-neutral-800 bg-[#F6F2E6] shadow-inner rounded overflow-hidden">
                    
                    {/* Header Columns */}
                    <div className="flex bg-[#EBE4D3] divide-x divide-neutral-300 font-bold uppercase tracking-wider text-[9px] text-neutral-600">
                      <div className="w-[120px] p-2 flex items-center">MATRIC NUMBER</div>
                      <div className="flex-1 p-2 flex items-center">STUDENT NAME</div>
                      <div className="w-[340px] p-2 flex items-center justify-center font-bold text-center border-l border-neutral-300 bg-[#E3DAC3] text-neutral-700">
                        VERIFIED CORE GRADES IN SEQUENCE
                      </div>
                    </div>

                    {/* Student Row */}
                    <div className="flex divide-x divide-neutral-300 bg-white">
                      <div className="w-[120px] p-3 font-bold text-neutral-800 flex items-center bg-[#FAF8F3]">
                        {activeResult.matric}
                      </div>
                      
                      {/* Confidential Student Name Redaction */}
                      <div 
                        className="flex-1 p-3 flex items-center relative cursor-help"
                        onMouseEnter={() => setIsRevealed(true)}
                        onMouseLeave={() => setIsRevealed(false)}
                        onClick={() => setIsRevealed(!isRevealed)}
                      >
                        <span className="relative select-none text-neutral-800 font-medium">
                          {isRevealed ? (
                            <motion.span 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="font-sans text-xs tracking-normal"
                            >
                              {activeResult.studentName}
                            </motion.span>
                          ) : (
                            <span className="blur-[4px] opacity-40 font-sans text-xs tracking-normal select-none pr-8">
                              {activeResult.studentName}
                            </span>
                          )}
                          {!isRevealed && (
                            <span className="absolute inset-y-0 left-0 right-0 bg-[#1C1917]/90 rounded-sm scale-y-95 origin-left flex items-center justify-between px-2 text-[8px] font-mono uppercase tracking-[0.1em] text-[#FCFAF7] transition-all hover:bg-neutral-800">
                              <span>[CONFIDENTIAL]</span>
                              <Lock className="w-2.5 h-2.5 text-accent-foreground/50" />
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Course Grades Columns */}
                      <div className="w-[340px] flex divide-x divide-neutral-300">
                        {activeResult.grades.map((g, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 p-3 text-center flex flex-col items-center justify-center font-bold text-xs ${
                              g.isA 
                                ? 'bg-emerald-500/[0.04] text-emerald-800 font-black' 
                                : 'text-neutral-700 font-medium'
                            }`}
                          >
                            <span className="text-[8px] text-neutral-400 font-mono tracking-tighter uppercase mb-0.5 block">
                              {g.code}
                            </span>
                            <span className={g.isA ? 'text-emerald-700' : 'text-neutral-600'}>
                              {g.grade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro Redaction Hint */}
                <div className="mt-3 flex items-center justify-end text-[10px] text-neutral-400 font-serif italic">
                  *Hover/tap confidential cell to unlock verified graduate identity
                </div>

                {/* Stamped Certification Seal */}
                <div className="absolute top-10 right-10 rotate-[-12deg] border-2 border-dashed border-emerald-600/60 rounded px-3 py-1 text-[10px] font-black text-emerald-600/90 font-mono tracking-[0.2em] bg-emerald-50/70 uppercase select-none pointer-events-none shadow-sm">
                  VERIFIED A+ LEDGER
                </div>
              </div>

              {/* 2. PREMIUM EDITORIAL COPY & QUOTE */}
              <div className="w-full max-w-3xl text-center flex flex-col items-center">
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground bg-[#F0EDEA] px-2.5 py-1 rounded">
                    {activeResult.faculty}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-bold">
                    {activeResult.department}
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
                    Graduation Standing: <span className="text-foreground font-bold">{activeResult.standing}</span> (GPA {activeResult.gpa})
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
                    setIsRevealed(false);
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
