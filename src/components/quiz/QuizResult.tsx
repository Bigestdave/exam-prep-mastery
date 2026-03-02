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
    };
  }
  if (percentage >= 40) {
    return {
      emoji: "🔧",
      label: "Building Stage",
      message: "You're safe on the basics. But the trick questions caught you. Retake to lock it in.",
      color: "text-amber-600",
      bg: "bg-amber-50",
    };
  }
  return {
    emoji: "🌱",
    label: "Foundation Stage",
    message: "Good baseline. You found the gaps. Review the study guides to fix this immediately.",
    color: "text-muted-foreground",
    bg: "bg-secondary",
  };
}

export default function QuizResult({ courseId, courseCode, courseTitle, score, total }: QuizResultProps) {
  const navigate = useNavigate();
  const { user, profile, purchases } = useAuth();
  const { courses } = useCourses();
  const [showContent, setShowContent] = useState(false);

  const percentage = Math.round((score / total) * 100);
  const tier = getScoringTier(percentage);

  // Get courses for this user's department
  const departmentCourses = courses.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );
  const departmentCourseIds = departmentCourses.map(c => c.id);
  const { readiness, totalPercentage } = useSemesterReadiness(user?.id, departmentCourseIds);

  // Find next unowned course for upsell
  const nextUnowned = departmentCourses.find(c => c.id !== courseId && !purchases.includes(c.id));

  // Stamp animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Ring segments
  const ringSegments = departmentCourses.map(c => {
    if (c.id === courseId) return { ...c, percentage };
    return { ...c, percentage: readiness.get(c.id) ?? 0 };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dark overlay with stamp */}
      <div className="fixed inset-0 bg-foreground/95 z-40 flex items-center justify-center">
        <motion.div
          initial={{ scale: 2.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="text-center"
        >
          <div className="text-7xl mb-4">{tier.emoji}</div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-display font-bold text-background mb-2"
          >
            {score}/{total}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-background/60 text-sm font-mono uppercase tracking-widest mb-8"
          >
            {tier.label}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowContent(true)}
            className="bg-background text-foreground px-8 py-3 rounded-2xl font-display font-bold text-sm shadow-elevated"
          >
            View Breakdown
          </motion.button>
        </motion.div>
      </div>

      {/* Result content (slides up) */}
      {showContent && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="fixed inset-0 z-50 bg-background overflow-y-auto"
        >
          <div className="max-w-lg mx-auto px-5 py-10">
            {/* Score card */}
            <div className={`rounded-3xl p-6 ${tier.bg} mb-6`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{tier.emoji}</span>
                <div>
                  <h2 className={`font-display font-bold text-xl ${tier.color}`}>
                    {tier.label}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    {courseCode} • {score}/{total} ({percentage}%)
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {tier.message}
              </p>
            </div>

            {/* Semester Ring (The Zeigarnik Upsell) */}
            {departmentCourses.length > 1 && (
              <div className="bg-card border border-border rounded-3xl p-6 mb-6 shadow-card">
                <h3 className="font-display font-bold text-foreground mb-1 text-sm">
                  {courseCode} is {percentage >= 80 ? "safe" : "improving"}. But you are exposed in {departmentCourses.filter(c => (readiness.get(c.id) ?? 0) < 80 && c.id !== courseId).length} other courses.
                </h3>

                {/* Semester ring visualization */}
                <div className="flex items-center justify-center my-6">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {ringSegments.map((seg, i) => {
                        const total = ringSegments.length;
                        const gapDeg = 4;
                        const segDeg = (360 - gapDeg * total) / total;
                        const startAngle = i * (segDeg + gapDeg);
                        const circumference = 2 * Math.PI * 42;
                        const segLength = (segDeg / 360) * circumference;

                        return (
                          <circle
                            key={seg.id}
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            strokeWidth="6"
                            strokeLinecap="round"
                            stroke={seg.percentage >= 80 ? "hsl(var(--accent))" : seg.percentage > 0 ? "hsl(30, 70%, 60%)" : "hsl(var(--border))"}
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
                        <p className="text-[9px] font-mono text-muted-foreground uppercase">Ready</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course breakdown mini-list */}
                <div className="space-y-2">
                  {ringSegments.map(seg => (
                    <div key={seg.id} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-muted-foreground">{seg.code}</span>
                      <span className={`font-bold ${
                        seg.percentage >= 80 ? "text-accent" : seg.percentage > 0 ? "text-amber-600" : "text-muted-foreground/40"
                      }`}>
                        {seg.percentage > 0 ? `${seg.percentage}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Upsell CTA */}
                {nextUnowned && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(`/course/${nextUnowned.id}`)}
                    className="w-full mt-5 bg-foreground text-background rounded-2xl p-4 flex items-center justify-between font-display font-bold text-sm shadow-card"
                  >
                    <span>Secure Next: {nextUnowned.code}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/course/${courseId}/quiz`)}
                className="w-full h-14 bg-foreground text-background rounded-2xl font-display font-bold flex items-center justify-center gap-2 shadow-card"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Confidence Check
              </motion.button>

              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="w-full h-14 bg-card border border-border rounded-2xl font-display font-bold text-foreground text-sm"
              >
                Back to {courseCode}
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
