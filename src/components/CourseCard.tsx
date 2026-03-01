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
      className="block bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-glow transition-all duration-300 group btn-thud"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-display font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              {code}
            </span>
            {isOwned ? (
              <span className="text-xs font-medium text-success bg-success-light px-2.5 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Owned
              </span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </div>
          <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">
              {questionsCount} Tutorial Questions
            </p>
            <VerifiedBadge />
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
