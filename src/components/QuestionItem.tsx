import { Lock, ChevronRight } from "lucide-react";
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
      <span className={`flex-shrink-0 font-display font-bold text-lg ${
        isUnlocked || isFreePreview 
          ? 'text-foreground' 
          : 'text-muted-foreground/40'
      }`}>
        {String(questionIndex + 1).padStart(2, '0')}.
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${
          isUnlocked || isFreePreview ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {question}
        </p>
        {isFreePreview && (
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
            style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}
          >
            Free Preview
          </span>
        )}
      </div>
      <div className="flex-shrink-0">
        {isUnlocked || isFreePreview ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        ) : (
          <Lock className="w-4 h-4 text-muted-foreground/40" />
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
