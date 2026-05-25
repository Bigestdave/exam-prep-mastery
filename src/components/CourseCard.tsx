import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface CourseCardProps {
  id: string;
  code: string;
  title: string;
  isOwned?: boolean;
  questionsCount?: number;
}

export function CourseCard({ id, code, title, isOwned = false, questionsCount = 15 }: CourseCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="h-full"
    >
      <Link 
        to={`/course/${id}`}
        className="flex flex-col bg-card border border-border rounded-2xl p-5 card-float transition-all duration-200 group h-full"
      >
        <div className="flex items-baseline justify-between mb-3 pb-2.5 border-b border-border/70">
          <span className="text-[11px] font-mono font-semibold text-foreground tracking-[0.15em] uppercase">
            {code}
          </span>
          <span className={`text-[9px] font-mono tracking-[0.22em] uppercase ${
            isOwned ? 'text-accent' : 'text-muted-foreground/70'
          }`}>
            {isOwned ? 'Owned' : 'Locked'}
          </span>
        </div>

        <h3 className="leading-snug line-clamp-2 flex-1 text-[15px]">
          {title}
        </h3>

        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mt-3 tabular-nums">
          {questionsCount} Questions
        </span>
      </Link>
    </motion.div>
  );
}
