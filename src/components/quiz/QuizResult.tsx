import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useSemesterReadiness, QuizQuestion } from "@/hooks/useQuizData";
import { calcSemesterReadiness, getTier, courseContribution } from "@/lib/readinessTiers";
import { ReadinessRing } from "@/components/quiz/ReadinessRing";
import { ArrowRight, RotateCcw, CheckCircle2, XCircle, ChevronDown, Lock } from "lucide-react";
import { renderWithMath } from "@/lib/renderWithMath";
import confetti from "canvas-confetti";

interface QuizResultProps {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  score: number;
  total: number;
  questions: QuizQuestion[];
  answers: Map<number, number>;
  isFreePreview?: boolean;
  fullQuizCount?: number;
}

function getScoringTier(percentage: number) {
  if (percentage >= 80) {
    return {
      emoji: "🏆",
      label: "Exam Ready",
      sublabel: "Locked In",
      message: "You are mathematically predicted to crush this topic.",
      color: "text-accent",
      bg: "bg-accent/8",
      border: "border-accent/15",
      stampBg: "from-[#2a1f0a] via-[#3d2b10] to-[#1a1204]",
      accentGlow: "bg-[#c9a96e]/20",
      confettiColors: ['#c9a96e', '#d4b87a', '#fbbf24', '#ffffff'],
    };
  }
  if (percentage >= 40) {
    return {
      emoji: "🔧",
      label: "Building Stage",
      sublabel: "Getting There",
      message: "The basics are solid. The trick questions caught you.",
      color: "text-amber-700",
      bg: "bg-amber-50/60",
      border: "border-amber-200/30",
      stampBg: "from-[#2a1f0a] via-[#3a2a0d] to-[#1a1404]",
      accentGlow: "bg-amber-500/15",
      confettiColors: ['#d97706', '#fbbf24', '#c9a96e', '#ffffff'],
    };
  }
  return {
    emoji: "🌱",
    label: "Foundation",
    sublabel: "Starting Out",
    message: "You found the gaps. Review and retake to improve.",
    color: "text-muted-foreground",
    bg: "bg-secondary/50",
    border: "border-border",
    stampBg: "from-[#1a1408] via-[#221c10] to-[#110e08]",
    accentGlow: "bg-[#c9a96e]/10",
    confettiColors: ['#8b7355', '#a0896a', '#c9a96e', '#ffffff'],
  };
}

export default function QuizResult({ courseId, courseCode, courseTitle, score, total, questions, answers, isFreePreview = false, fullQuizCount = 0 }: QuizResultProps) {
  const navigate = useNavigate();
  const { user, profile, purchases } = useAuth();
  const { courses } = useCourses();
  const [phase, setPhase] = useState<"stamp" | "content">("stamp");
  const [showReview, setShowReview] = useState(false);
  const confettiFired = useRef(false);

  const percentage = Math.round((score / total) * 100);
  const tier = getScoringTier(percentage);

  const departmentCourses = courses.filter(
    c => c.faculty === profile?.faculty && c.level === profile?.level
  );
  const departmentCourseIds = departmentCourses.map(c => c.id);
  const { readiness } = useSemesterReadiness(user?.id, departmentCourseIds);

  const nextUnowned = departmentCourses.find(c => c.id !== courseId && !purchases.includes(c.id));

  const ringSegments = departmentCourses.map(c => ({
    ...c,
    pct: c.id === courseId ? percentage : (readiness.get(c.id) ?? 0),
  }));

  const correctedScores = new Map(readiness);
  correctedScores.set(courseId, Math.max(percentage, readiness.get(courseId) ?? 0));
  const correctedTotalPercentage = calcSemesterReadiness(departmentCourseIds, correctedScores);

  const exposedCount = ringSegments.filter(s => s.pct < 80 && s.id !== courseId).length;

  // Near-win calculation
  const questionsToNext = percentage >= 80 ? 0 : Math.ceil(total * 0.8) - score;

  // Fire confetti on stamp phase
  useEffect(() => {
    if (phase === "stamp" && !confettiFired.current) {
      confettiFired.current = true;
      const duration = 1800;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: percentage >= 80 ? 3 : 2,
          angle: 60 + Math.random() * 60,
          spread: 45 + Math.random() * 20,
          origin: { x: Math.random(), y: 0.5 + Math.random() * 0.2 },
          colors: tier.confettiColors,
          gravity: 1.4,
          scalar: 0.8,
          drift: 0,
          ticks: 100,
          disableForReducedMotion: true,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      // Slight delay so stamp animation starts first
      setTimeout(frame, 300);
    }
  }, [phase, percentage]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("content"), 2400);
    return () => clearTimeout(timer);
  }, []);

  // ─── STAMP PHASE ─── Celebration moment
  if (phase === "stamp") {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-b ${tier.stampBg}`}>
        {/* Radial glow */}
        <div className={`absolute w-80 h-80 rounded-full blur-[100px] ${tier.accentGlow} opacity-60`} />

        <motion.div
          initial={{ scale: 1.8, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
          className="text-center relative z-10"
        >
          {/* Big emoji */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.05 }}
            className="text-8xl mb-8"
          >
            {tier.emoji}
          </motion.div>

          {/* Score — THE hero element */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-7xl font-display font-bold text-white mb-1"
            style={{ letterSpacing: '-0.06em' }}
          >
            {score}/{total}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="text-white/40 text-[11px] font-mono uppercase tracking-[0.25em] mb-12"
          >
            {tier.label}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPhase("content")}
            className="bg-white/10 backdrop-blur-sm text-white/90 border border-white/10 px-10 py-4 rounded-2xl font-display font-bold text-sm"
            style={{ letterSpacing: '-0.03em' }}
          >
            View Breakdown
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── CONTENT PHASE ─── Detailed breakdown
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto px-5 py-8 pb-32">

        {/* ─── HERO: Score Card ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`rounded-3xl p-6 ${tier.bg} border ${tier.border} mb-4`}
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{tier.emoji}</span>
            <div className="flex-1">
              <h2 className={`font-display font-bold text-2xl ${tier.color}`} style={{ letterSpacing: '-0.05em' }}>
                {tier.label}
              </h2>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">
                {courseCode} · {score}/{total} ({percentage}%)
              </p>
            </div>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed">
            {tier.message}
          </p>

          {/* Near-win motivation — bold, clear */}
          {questionsToNext > 0 && questionsToNext <= 5 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-display font-bold text-foreground mt-3"
              style={{ letterSpacing: '-0.03em' }}
            >
              {questionsToNext === 1
                ? "1 more question and you're Exam Ready."
                : `${questionsToNext} questions away from Exam Ready. Retake to lock it in.`}
            </motion.p>
          )}
        </motion.div>

        {/* Social proof — clean sans-serif, not italic serif */}
        <p className="text-[11px] text-muted-foreground text-center mb-6 font-mono tracking-wide">
          {percentage >= 80
            ? "Top students lock in by retaking once more."
            : "Students who scored 90%+ practiced at least 2 attempts."}
        </p>

        {/* ─── UPSELL (free preview only) ─── */}
        {isFreePreview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-accent/15 rounded-3xl p-6 mb-6 shadow-card"
          >
            <p className="text-sm font-display font-bold text-foreground mb-1.5" style={{ letterSpacing: '-0.03em' }}>
              {percentage >= 70
                ? `Impressive, but this was only ${total} questions.`
                : percentage >= 40
                  ? `You got caught on a few, and this was just ${total} questions.`
                  : `${score === 0 ? "Every answer missed" : "Most answers missed"} — and this was only ${total} questions.`}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              {fullQuizCount > 0
                ? `The full version has ${fullQuizCount} questions covering every topic your lecturer can test. Can you keep ${percentage}% across all of them?`
                : `The full version covers every topic your lecturer can test. Think you can keep this score across all of them?`}
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/course/${courseId}`)}
              className="w-full h-12 bg-foreground text-background rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 shadow-card"
              style={{ letterSpacing: '-0.05em' }}
            >
              Unlock Full {courseCode} Quiz + Answers
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* ─── REVIEW ANSWERS (collapsible) ─── */}
        <button
          onClick={() => setShowReview(!showReview)}
          className="w-full bg-card border border-border rounded-2xl p-4 mb-4 text-left shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-display font-bold text-foreground" style={{ letterSpacing: '-0.05em' }}>
              Review Answers
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                {score}/{total} correct
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showReview ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mb-6 overflow-hidden"
            >
              {questions.map((q, qIdx) => {
                const userAnswer = answers.get(qIdx);
                const opts = q.quiz_options ?? [];
                const correctIdx = opts.findIndex(o => o.is_correct);
                const isCorrect = userAnswer === correctIdx;

                return (
                  <div key={q.id} className="bg-card border border-border rounded-2xl p-4 shadow-card">
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {renderWithMath(q.quiz_question_text)}
                      </p>
                    </div>
                    <div className="space-y-1.5 ml-8">
                      {opts.map((opt, oIdx) => {
                        let style = "text-xs px-3 py-2 rounded-xl ";
                        if (oIdx === correctIdx) {
                          style += "bg-accent/10 text-accent font-semibold";
                        } else if (oIdx === userAnswer && !isCorrect) {
                          style += "bg-secondary text-muted-foreground line-through";
                        } else {
                          style += "text-muted-foreground/60";
                        }
                        return (
                          <div key={oIdx} className={style}>
                            {renderWithMath(opt.text)}
                          </div>
                        );
                      })}
                    </div>
                    {q.hint && (
                      <div className="ml-8 mt-2 border-l-2 border-accent/30 pl-3">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-accent text-[10px] uppercase tracking-wider">Why → </span>
                          {renderWithMath(q.hint)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── SEMESTER READINESS (The Zeigarnik Trap) ─── */}
        {departmentCourses.length > 1 && !isFreePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-3xl p-6 mb-6 shadow-card"
          >
            {/* Course Score */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">Your Score</p>
                <h3 className="font-display font-bold text-2xl text-foreground" style={{ letterSpacing: '-0.05em' }}>
                  {courseCode}: {percentage}%
                </h3>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                percentage >= 80 ? "bg-accent/10 text-accent" : percentage >= 40 ? "bg-amber-50 text-amber-700" : "bg-secondary text-muted-foreground"
              }`}>
                {percentage >= 80 ? "Secured ✓" : percentage >= 40 ? "Building" : "Needs Work"}
              </div>
            </div>

            <div className="border-t border-dashed border-border my-4" />

            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Semester Overview · {departmentCourses.length} courses
            </p>

            {exposedCount > 0 && (
              <p className="text-xs text-muted-foreground mb-4">
                {percentage >= 80 ? `${courseCode} is locked in.` : `${courseCode} is improving.`}
                {` You are exposed in ${exposedCount} other course${exposedCount > 1 ? 's' : ''}.`}
              </p>
            )}

            <div className="flex items-center justify-center my-4">
              <ReadinessRing
                percentage={correctedTotalPercentage}
                variant="segmented"
                sizeClass="w-28 h-28"
                segments={ringSegments.map(seg => ({ id: seg.id, pct: seg.pct }))}
              />
            </div>

            {/* Course ledger */}
            <div className="mb-5">
              {ringSegments.map((seg, i) => {
                const segTier = getTier(seg.pct);
                const contrib = courseContribution(seg.pct, departmentCourses.length);
                return (
                  <div
                    key={seg.id}
                    className={`flex items-center justify-between text-xs py-2.5 ${
                      i < ringSegments.length - 1 ? "border-b border-dashed border-border" : ""
                    }`}
                  >
                    <span className={`font-mono ${seg.id === courseId ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      {seg.code} {seg.id === courseId ? "←" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      {seg.pct > 0 ? (
                        <>
                          <span className="text-[10px] text-muted-foreground font-mono">+{contrib}%</span>
                          <span className={`font-bold ${segTier.color}`}>{segTier.emoji} {seg.pct}%</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 font-mono">
                          Take quiz to reveal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

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
          </motion.div>
        )}

        {/* ─── ACTIONS ─── */}
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { window.location.href = `/course/${courseId}/quiz`; }}
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
