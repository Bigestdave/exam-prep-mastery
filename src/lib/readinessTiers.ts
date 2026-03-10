/**
 * Tier-based Semester Readiness calculation.
 *
 * Each course gets an equal slice of 100%.
 * The tier achieved on a course determines how much of that slice is filled.
 *
 * Gold   (80-100%) → 100% of the course slot
 * Silver (50-79%)  →  60% of the course slot
 * Bronze (1-49%)   →  30% of the course slot
 * None   (0 / no attempt) → 0%
 */

export type TierName = "gold" | "silver" | "bronze" | "none";

export interface TierInfo {
  name: TierName;
  label: string;
  emoji: string;
  /** Fraction of the course slot this tier fills (0-1) */
  slotFraction: number;
  color: string;        // tailwind text class
  bgColor: string;      // tailwind bg class
  borderColor: string;  // tailwind border class
  ringHsl: string;      // for SVG strokes
}

const TIERS: Record<TierName, Omit<TierInfo, "name">> = {
  gold: {
    label: "Gold",
    emoji: "🥇",
    slotFraction: 1.0,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
    ringHsl: "hsl(var(--accent))",
  },
  silver: {
    label: "Silver",
    emoji: "🥈",
    slotFraction: 0.6,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200/50",
    ringHsl: "hsl(var(--tier-silver))",
  },
  bronze: {
    label: "Bronze",
    emoji: "🥉",
    slotFraction: 0.3,
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    borderColor: "border-border",
    ringHsl: "hsl(var(--muted-foreground))",
  },
  none: {
    label: "Not attempted",
    emoji: "—",
    slotFraction: 0,
    color: "text-muted-foreground/40",
    bgColor: "bg-secondary/50",
    borderColor: "border-border/50",
    ringHsl: "hsl(var(--border))",
  },
};

export function getTier(percentage: number): TierInfo {
  let name: TierName;
  if (percentage >= 80) name = "gold";
  else if (percentage >= 50) name = "silver";
  else if (percentage > 0) name = "bronze";
  else name = "none";

  return { name, ...TIERS[name] };
}

export function getTierByName(name: TierName): TierInfo {
  return { name, ...TIERS[name] };
}

/**
 * Calculate total semester readiness from a map of course → best percentage.
 * Returns 0-100.
 */
export function calcSemesterReadiness(
  courseIds: string[],
  bestScores: Map<string, number>
): number {
  if (courseIds.length === 0) return 0;

  const slotSize = 100 / courseIds.length; // e.g. 10 courses → 10% each

  const total = courseIds.reduce((sum, id) => {
    const pct = bestScores.get(id) ?? 0;
    const tier = getTier(pct);
    return sum + slotSize * tier.slotFraction;
  }, 0);

  return Math.round(total);
}

/**
 * Returns the contribution of a single course to the total readiness.
 */
export function courseContribution(
  percentage: number,
  totalCourses: number
): number {
  if (totalCourses === 0) return 0;
  const slotSize = 100 / totalCourses;
  const tier = getTier(percentage);
  return Math.round(slotSize * tier.slotFraction);
}
