import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useSemesterReadiness } from "@/hooks/useQuizData";
import { ArrowRight, RotateCcw } from "lucide-react";

interface QuizResultProps {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  score: number;
  total: number;
}

function getScoringTier(percentage: number) {
  if (percentage >= 80) {
    return {
      emoji: "🏆",
      label: "Exam Ready",
      message: "You are mathematically predicted to crush this topic.",
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
    };
  }
  if (percentage >= 40) {
    return {
      emoji: "🔧",
      label: "Building Stage",
      message: "You're safe on the basics. But the trick questions caught you. Retake to lock it in.",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200/50",
    };
  }
  return {
    emoji: "🌱",
    label: "Foundation Stage",
    message: "Good baseline. You found the gaps. Review the study guides to fix this immediately.",
    color: "text-muted-foreground",
    bg: "bg-secondary",
    border: "border-border",
  };
}

export default function QuizResult({ courseId, courseCode, courseTitle, score, total }: QuizResultProps) {
  const navigate = useNavigate();
  const { user, profile, purchases } = useAuth();
  const { courses } = useCourses();
  const [phase, setPhase] = useState<"stamp" | "content">("stamp");

  const percentage = Math.round((score / total) * 100);
  const tier = getScoringTier(percentage);

  const departmentCourses = courses.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );
  const departmentCourseIds = departmentCourses.map(c => c.id);
  const { readiness, totalPercentage } = useSemesterReadiness(user?.id, departmentCourseIds);

  const nextUnowned = departmentCourses.find(c => c.id !== courseId && !purchases.includes(c.id));
  const exposedCount = departmentCourses.filter(c => (readiness.get(c.id) ?? 0) < 80 && c.id !== courseId).length;

  // Auto-transition from stamp to content
  useEffect(() => {
    const timer = setTimeout(() => setPhase("content"), 2200);
    return () => clearTimeout(timer);
  }, []);

  // Ring segments
  const ringSegments = departmentCourses.map(c => ({
    ...c,
    pct: c.id === courseId ? percentage : (readiness.get(c.id) ?? 0),
  }));

  if (phase === "stamp") {
    return (
      <div className="fixed inset-0 bg-foreground z-50 flex items-center justify-center overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-gradient-radial from-foreground via-foreground to-foreground/95" />

        <motion.div
          initial={{ scale: 2.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.15 }}
          className="text-center relative z-10"
        >
          <div className="text-7xl mb-6">{tier.emoji}</div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-display font-bold text-background mb-2"
            style={{ letterSpacing: '-0.05em' }}
          >
            {score}/{total}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-background/50 text-xs font-mono uppercase tracking-widest mb-10"
          >
            {tier.label}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setPhase("content")}
            className="bg-background text-foreground px-8 py-3.5 rounded-2xl font-display font-bold text-sm shadow-elevated"
            style={{ letterSpacing: '-0.05em' }}
          >
            View Breakdown
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <div className="max-w-lg mx-auto px-5 py-10 pb-32">
        {/* Score card */}
        <div className={`rounded-3xl p-6 ${tier.bg} border ${tier.border} mb-6`}>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl">{tier.emoji}</span>
            <div>
              <h2 className={`font-display font-bold text-xl ${tier.color}`} style={{ letterSpacing: '-0.05em' }}>
                {tier.label}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {courseCode} • {score}/{total} ({percentage}%)
              </p>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {tier.message}
          </p>
        </div>

        {/* Semester Ring — The Zeigarnik Trap */}
        {departmentCourses.length > 1 && (
          <div className="bg-card border border-border rounded-3xl p-6 mb-6 shadow-card">
            <h3 className="font-display font-bold text-foreground text-sm mb-1" style={{ letterSpacing: '-0.05em' }}>
              {courseCode} is {percentage >= 80 ? "locked in" : "improving"}.
              {exposedCount > 0 && ` But you are exposed in ${exposedCount} other course${exposedCount > 1 ? 's' : ''}.`}
            </h3>

            {/* Ring visualization */}
            <div className="flex items-center justify-center my-6">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {ringSegments.map((seg, i) => {
                    const totalSegs = ringSegments.length;
                    const gapDeg = 4;
                    const segDeg = (360 - gapDeg * totalSegs) / totalSegs;
                    const startAngle = i * (segDeg + gapDeg);
                    const circumference = 2 * Math.PI * 42;
                    const segLength = (segDeg / 360) * circumference;

                    return (
                      <circle
                        key={seg.id}
                        cx="50" cy="50" r="42"
                        fill="none"
                        strokeWidth="5"
                        strokeLinecap="round"
                        stroke={
                          seg.pct >= 80
                            ? "hsl(var(--accent))"
                            : seg.pct > 0
                              ? "hsl(30, 70%, 60%)"
                              : "hsl(var(--border))"
                        }
                        strokeDasharray={`${segLength} ${circumference - segLength}`}
                        strokeDashoffset={-(startAngle / 360) * circumference}
                        className="transition-all duration-700"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl font-display font-bold text-foreground">{totalPercentage}%</span>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Semester</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Per-course breakdown */}
            <div className="space-y-2 mb-5">
              {ringSegments.map(seg => (
                <div key={seg.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{seg.code}</span>
                  <span className={`font-bold ${
                    seg.pct >= 80 ? "text-accent" : seg.pct > 0 ? "text-amber-600" : "text-muted-foreground/30"
                  }`}>
                    {seg.pct > 0 ? `${seg.pct}%` : "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Upsell CTA */}
            {nextUnowned && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/course/${nextUnowned.id}`)}
                className="w-full bg-foreground text-background rounded-2xl p-4 flex items-center justify-between font-display font-bold text-sm shadow-card"
                style={{ letterSpacing: '-0.05em' }}
              >
                <span>Secure Next: {nextUnowned.code} — ₦{(nextUnowned.price || 1000).toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              // Reset and retake
              window.location.href = `/course/${courseId}/quiz`;
            }}
            className="w-full h-14 bg-foreground text-background rounded-2xl font-display font-bold flex items-center justify-center gap-2 shadow-card text-sm"
            style={{ letterSpacing: '-0.05em' }}
          >
            <RotateCcw className="w-4 h-4" />
            Retake Confidence Check
          </motion.button>

          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="w-full h-14 bg-card border border-border rounded-2xl font-display font-bold text-foreground text-sm"
            style={{ letterSpacing: '-0.05em' }}
          >
            Back to {courseCode}
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </motion.div>
  );
}
