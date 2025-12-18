import { Lock, ChevronRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface QuestionItemProps {
  courseId: string;
  questionIndex: number;
  question: string;
  isUnlocked: boolean;
  isFreePreview?: boolean;
  onLockedClick?: () => void;
}

export function QuestionItem({ 
  courseId, 
  questionIndex, 
  question, 
  isUnlocked, 
  isFreePreview = false,
  onLockedClick 
}: QuestionItemProps) {
  const content = (
    <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50 hover:shadow-card transition-all duration-200 group cursor-pointer">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
        isUnlocked || isFreePreview 
          ? 'bg-primary/10 text-primary' 
          : 'bg-secondary text-muted-foreground'
      }`}>
        {questionIndex + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${
          isUnlocked || isFreePreview ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {question}
        </p>
        {isFreePreview && (
          <span className="inline-block mt-2 text-xs font-medium text-success bg-success-light px-2 py-0.5 rounded">
            Free Preview
          </span>
        )}
      </div>
      <div className="flex-shrink-0">
        {isUnlocked || isFreePreview ? (
          <div className="flex items-center gap-1 text-primary">
            <Eye className="w-4 h-4" />
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        ) : (
          <Lock className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );

  if (isUnlocked || isFreePreview) {
    return (
      <Link to={`/course/${courseId}/answer/${questionIndex}`}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onLockedClick}>
      {content}
    </div>
  );
}
