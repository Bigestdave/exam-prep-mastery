import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import sovereignKey from "@/assets/sovereign-key.png";
import lcuLogo from "@/assets/lcu-logo.png";

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
      <div className="container pt-8 pb-16 md:pt-12 md:pb-24 px-4">
        <div className="max-w-3xl mx-auto text-left md:text-center">
          
          <h1 className="text-foreground leading-[1.1] mb-6">
            <motion.span
              className="block text-[36px] md:text-5xl lg:text-6xl font-display font-bold leading-[1.1]"
              {...fadeUp(0.1)}
            >
              You studied your notes.
            </motion.span>
            <motion.span
              className="block text-[36px] md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mt-1"
              {...fadeUp(0.2)}
            >
              But are you actually
            </motion.span>
            <motion.span
              className="block text-[36px] md:text-5xl lg:text-6xl font-serif italic text-accent mt-1"
              {...fadeUp(0.3)}
            >
              ready for the exam?
            </motion.span>
          </h1>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed"
            {...fadeUp(0.45)}
          >
            We solved every tutorial question your lecturer set, verified to first-class standard. Then we built a quiz so you can prove to yourself you actually know it.
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
                Find My Course
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

          {/* Partnership badge */}
          <motion.div 
            className="flex flex-col items-center gap-2 mt-10"
            {...fadeUp(0.7)}
          >
            <div className="flex items-center gap-3">
              <img src={lcuLogo} alt="Lead City University" className="w-8 h-8 object-contain" />
              <span className="text-muted-foreground/40 font-light text-xl select-none">×</span>
              <div className="flex items-center gap-1.5">
                <img src={sovereignKey} alt="LCU Prep" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0)' }} />
                <span className="font-display font-semibold text-foreground">LCU Prep</span>
              </div>
            </div>
            <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
              In partnership with Lead City University
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
