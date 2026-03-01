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
        "inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.15em] text-accent border border-accent/30 bg-accent/5 rounded-lg",
        size === "sm" && "text-[9px] px-2.5 py-1",
        size === "md" && "text-[10px] px-3 py-1.5",
        className
      )}
    >
      <ShieldCheck className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
      Verified LCU Standard
    </span>
  );
}
