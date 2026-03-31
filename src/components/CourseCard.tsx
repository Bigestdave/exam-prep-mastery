import { Lock, CheckCircle } from "lucide-react";
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
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold text-muted-foreground tracking-wider uppercase">
            {code}
          </span>
          {isOwned ? (
            <CheckCircle className="w-4 h-4 text-accent" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
        </div>
        
        <h3 className="leading-snug line-clamp-2 flex-1">
          {title}
        </h3>
        
        <span className="text-xs font-mono text-muted-foreground mt-3">{questionsCount} Questions</span>
      </Link>
    </motion.div>
  );
}
