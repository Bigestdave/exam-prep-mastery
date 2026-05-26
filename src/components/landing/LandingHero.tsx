import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease },
});

const MotionButton = motion.create(Button);

export function LandingHero() {
  return (
    <section className="relative">
      <div className="container pt-8 pb-16 md:pt-16 md:pb-28 px-4">
        <div className="max-w-3xl mx-auto text-left md:text-center">

          <motion.div
            className="flex items-center justify-start md:justify-center gap-3 mb-8"
            {...fadeUp(0.05)}
          >
            <span className="text-serif text-base text-accent leading-none">I.</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              For Lead City Students
            </span>
            <span className="hidden md:inline-block w-12 h-px bg-border" />
          </motion.div>
          
          <h1 className="text-foreground leading-[1.1] mb-6">
            <motion.span
              className="block text-[34px] md:text-[52px] lg:text-[64px] font-display font-bold leading-[0.98] tracking-[-0.02em]"
              {...fadeUp(0.1)}
            >
              You've read your notes.
            </motion.span>
            <motion.span
              className="block text-[34px] md:text-[52px] lg:text-[64px] font-display font-bold leading-[0.98] tracking-[-0.02em] mt-1"
              {...fadeUp(0.2)}
            >
              Now prove you're
            </motion.span>
            <motion.span
              className="block text-[40px] md:text-[60px] lg:text-[72px] font-serif italic text-accent mt-2 leading-[0.95]"
              {...fadeUp(0.3)}
            >
              ready for the exam.
            </motion.span>
          </h1>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed"
            {...fadeUp(0.45)}
          >
            We solved every tutorial question from your course materials, verified to first-class standard. Then we built a quiz so you can prove to yourself you actually know it.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            {...fadeUp(0.55)}
          >
            <Link to="/signup">
              <MotionButton 
                size="xl" variant="hero" className="group"
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                Test My Readiness
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MotionButton>
            </Link>
            <Link to="/login">
              <MotionButton 
                variant="hero-outline" size="xl"
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                I have an account
              </MotionButton>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
