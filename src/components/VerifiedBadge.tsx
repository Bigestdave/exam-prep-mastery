import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function VerifiedBadge({ className, size = "sm" }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono uppercase tracking-widest text-primary/80 border border-primary/20 bg-primary/5 rounded-lg",
        size === "sm" && "text-[9px] px-2 py-0.5",
        size === "md" && "text-[10px] px-2.5 py-1",
        className
      )}
    >
      <ShieldCheck className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
      Verified LCU Standard
    </span>
  );
}
