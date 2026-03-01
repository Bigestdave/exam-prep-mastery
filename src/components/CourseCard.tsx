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
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold text-primary tracking-wider">
            {code}
          </span>
          {isOwned ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
        </div>
        
        <h3 className="font-display font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <span className="text-[11px] font-mono">{questionsCount}Q</span>
          <VerifiedBadge />
        </div>
      </div>
    </Link>
  );
}
