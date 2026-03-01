import { Lock, CheckCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { VerifiedBadge } from "./VerifiedBadge";

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
      className="block bg-card rounded-3xl p-5 card-float transition-all duration-300 group btn-thud"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold text-primary tracking-wider uppercase">
            {code}
          </span>
          {isOwned ? (
            <span className="text-[10px] font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Unlocked
            </span>
          ) : (
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" />
            </span>
          )}
        </div>
        
        <h3 className="font-display font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {questionsCount}Q
            </span>
            <VerifiedBadge />
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
