import { Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseCardProps {
  id: string;
  code: string;
  title: string;
  isOwned?: boolean;
  questionsCount?: number;
}

export function CourseCard({ id, code, title, isOwned = false, questionsCount = 15 }: CourseCardProps) {
  return (
    <Link 
      to={`/course/${id}`}
      className="flex flex-col bg-card border border-border rounded-2xl p-5 card-float transition-all duration-200 group h-full"
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold text-muted-foreground tracking-wider uppercase">
            {code}
          </span>
          {isOwned ? (
            <CheckCircle className="w-4 h-4 text-accent" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
        </div>
        
        <h3 className="font-display font-bold text-foreground text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2">
          {title}
        </h3>
        
        <span className="text-[11px] font-mono text-muted-foreground/60">{questionsCount}Q</span>
      </div>
    </Link>
  );
}
