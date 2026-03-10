import { motion } from "framer-motion";
import { getTier } from "@/lib/readinessTiers";

export type RingVariant = "dark" | "light" | "segmented";

interface ReadinessRingProps {
  /** 0-100 readiness percentage */
  percentage: number;
  /** Ring diameter class (e.g. "w-28 h-28", "w-32 h-32") */
  sizeClass?: string;
  /** "dark" = cream text on espresso, "light" = foreground text on card, "segmented" = per-course segments on light bg */
  variant?: RingVariant;
  /** For segmented variant: array of per-course percentages */
  segments?: Array<{ id: string; pct: number }>;
  /** Label below the percentage */
  label?: string;
}

/**
 * Unified readiness ring used across Dashboard, QuizHub, and QuizResult.
 * Single source of truth for the ring visual.
 */
export function ReadinessRing({
  percentage,
  sizeClass = "w-28 h-28",
  variant = "dark",
  segments,
  label = "Readiness",
}: ReadinessRingProps) {
  const ringRadius = variant === "segmented" ? 42 : 50;
  const viewBox = variant === "segmented" ? "0 0 100 100" : "0 0 120 120";
  const cx = variant === "segmented" ? 50 : 60;
  const cy = variant === "segmented" ? 50 : 60;
  const circumference = 2 * Math.PI * ringRadius;

  const isDark = variant === "dark";
  const textColor = isDark ? "text-cream" : "text-foreground";
  const subTextColor = isDark ? "text-cream/35" : "text-muted-foreground";
  const trackStroke = isDark ? "hsl(var(--cream) / 0.08)" : "hsl(var(--border))";

  // Segmented ring (QuizResult style — one arc per course)
  if (variant === "segmented" && segments && segments.length > 0) {
    const totalSegs = segments.length;
    const gapDeg = 4;
    const segDeg = (360 - gapDeg * totalSegs) / totalSegs;

    return (
      <div className={`relative ${sizeClass}`}>
        <svg viewBox={viewBox} className="w-full h-full -rotate-90">
          {segments.map((seg, i) => {
            const startAngle = i * (segDeg + gapDeg);
            const segLength = (segDeg / 360) * circumference;
            const tier = getTier(seg.pct);

            return (
              <circle
                key={seg.id}
                cx={cx} cy={cy} r={ringRadius}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                stroke={tier.ringHsl}
                strokeDasharray={`${segLength} ${circumference - segLength}`}
                strokeDashoffset={-(startAngle / 360) * circumference}
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className={`text-xl font-display font-bold ${textColor}`}>{percentage}%</span>
            <p className={`text-[8px] font-mono uppercase tracking-wider ${subTextColor}`}>{label}</p>
          </div>
        </div>
      </div>
    );
  }

  // Standard ring (single arc)
  return (
    <div className={`relative ${sizeClass}`}>
      <svg viewBox={viewBox} className="w-full h-full -rotate-90">
        <circle
          cx={cx} cy={cy} r={ringRadius}
          fill="none"
          stroke={trackStroke}
          strokeWidth="5"
          {...(percentage === 0 ? { strokeDasharray: "4 6" } : {})}
        />
        <motion.circle
          cx={cx} cy={cy} r={ringRadius}
          fill="none"
          stroke="hsl(var(--academic-green))"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - percentage / 100) }}
          transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-display font-bold ${textColor}`}>{percentage}%</span>
        <span className={`text-[7px] uppercase tracking-[0.15em] font-bold mt-0.5 ${subTextColor}`}>
          {label}
        </span>
      </div>
    </div>
  );
}
