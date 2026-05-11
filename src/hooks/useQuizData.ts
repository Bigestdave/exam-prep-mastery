import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
export interface QuizOption {
  text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  course_id: string;
  question_index: number;
  question_text: string; // Module title (fallback)
  quiz_question_text: string; // The actual quiz question to display
  answer_text: string;
  quiz_options: QuizOption[];
  hint?: string;
}

export interface QuizAttempt {
  course_id: string;
  score: number;
  total_questions: number;
  percentage: number;
}

// --- Stale-while-revalidate caches (memory + sessionStorage) ---
const quizCache: Record<string, { questions: QuizQuestion[]; hasQuizData: boolean }> = {};
const QUIZ_SS = 'lcu_quiz_v1_';
function readQuizCache(courseId: string) {
  if (quizCache[courseId]) return quizCache[courseId];
  try {
    const raw = sessionStorage.getItem(QUIZ_SS + courseId);
    if (raw) {
      const parsed = JSON.parse(raw);
      quizCache[courseId] = parsed;
      return parsed;
    }
  } catch {}
  return null;
}

const bestAttemptCache: Record<string, QuizAttempt | null> = {};
const BEST_SS = 'lcu_best_v1_';
function readBestCache(key: string): QuizAttempt | null | undefined {
  if (key in bestAttemptCache) return bestAttemptCache[key];
  try {
    const raw = sessionStorage.getItem(BEST_SS + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      bestAttemptCache[key] = parsed;
      return parsed;
    }
  } catch {}
  return undefined;
}

const readinessCache: Record<string, Record<string, number>> = {};
const READY_SS = 'lcu_ready_v1_';
function readReadinessCache(key: string): Map<string, number> | null {
  if (readinessCache[key]) return new Map(Object.entries(readinessCache[key]));
  try {
    const raw = sessionStorage.getItem(READY_SS + key);
    if (raw) {
      const obj = JSON.parse(raw);
      readinessCache[key] = obj;
      return new Map(Object.entries(obj));
    }
  } catch {}
  return null;
}

/**
 * Parses quiz data from content/structured_content JSONB.
 * Supports two formats:
 * 1. Edge Function format: { question, options: ["A","B","C","D"], correct_index: 0, explanation }
 * 2. Legacy n8n format: { question, options: {A:"...",B:"...",C:"...",D:"..."}, correct_answer: "B", hint }
 */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function parseQuiz(structured: any): { question: string; options: QuizOption[]; hint?: string }[] {
  try {
    const content = typeof structured === 'string' ? JSON.parse(structured) : structured;
    const results: { question: string; options: QuizOption[]; hint?: string }[] = [];

    // Format 1: New multi-quiz format (quizzes array)
    if (Array.isArray(content?.quizzes)) {
      for (const quiz of content.quizzes) {
        const parsed = parseSingleQuiz(quiz);
        if (parsed) results.push(parsed);
      }
    }

    // Format 2: Single quiz field (legacy)
    if (results.length === 0 && content?.quiz) {
      const parsed = parseSingleQuiz(content.quiz);
      if (parsed) results.push(parsed);
    }

    return results;
  } catch {
    return [];
  }
}

function parseSingleQuiz(quiz: any): { question: string; options: QuizOption[]; hint?: string } | null {
  if (!quiz) return null;

  try {
    // Edge Function format (array options + correct_index)
    if (Array.isArray(quiz.options) && quiz.correct_index !== undefined && quiz.correct_index !== null) {
      const correctIdx = Number(quiz.correct_index);
      const options: QuizOption[] = quiz.options.map((text: string, i: number) => ({
        text: String(text),
        is_correct: i === correctIdx,
      }));
      // Skip validation — show everything raw
      return {
        question: quiz.question || '(no question text)',
        options: options.length > 0 ? shuffleArray(options) : [{ text: 'No options', is_correct: true }],
        hint: quiz.explanation || quiz.hint,
      };
    }

    // Legacy n8n format (object options + correct_answer letter)
    if (quiz.options && quiz.correct_answer && !Array.isArray(quiz.options)) {
      const letters = ['A', 'B', 'C', 'D'];
      const options: QuizOption[] = letters
        .filter(l => quiz.options[l])
        .map(l => ({
          text: String(quiz.options[l]),
          is_correct: quiz.correct_answer.toUpperCase() === l,
        }));
      return {
        question: quiz.question || '(no question text)',
        options: options.length > 0 ? shuffleArray(options) : [{ text: 'No options', is_correct: true }],
        hint: quiz.hint,
      };
    }

    // Catch-all: if quiz has a question field, try to show it anyway
    if (quiz.question) {
      console.warn('[parseSingleQuiz] Unknown format, showing raw:', JSON.stringify(quiz).slice(0, 200));
      const rawOptions = Array.isArray(quiz.options) 
        ? quiz.options.map((t: any, i: number) => ({ text: String(t), is_correct: i === 0 }))
        : [{ text: 'No options available', is_correct: true }];
      return { question: quiz.question, options: rawOptions, hint: quiz.hint };
    }
  } catch (e) {
    console.error('[parseSingleQuiz] Error parsing quiz:', e, JSON.stringify(quiz).slice(0, 300));
  }

  console.warn('[parseSingleQuiz] Could not parse quiz:', JSON.stringify(quiz).slice(0, 200));
  return null;
}

export function useQuizData(courseId: string | undefined) {
  const initial = courseId ? readQuizCache(courseId) : null;
  const [questions, setQuestions] = useState<QuizQuestion[]>(initial?.questions ?? []);
  const [isLoading, setIsLoading] = useState(initial == null);
  const [hasQuizData, setHasQuizData] = useState(initial?.hasQuizData ?? false);

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      const cached = readQuizCache(courseId);
      if (cached) {
        setQuestions(cached.questions);
        setHasQuizData(cached.hasQuizData);
        setIsLoading(false);
      }

      // Fetch questions that have EITHER quiz_options OR structured_content with quiz
      const { data, error } = await supabase
        .from('course_questions')
        .select('id, course_id, question_index, question_text, answer_text, quiz_options, structured_content, content')
        .eq('course_id', courseId)
        .order('question_index', { ascending: true });

      if (error) {
        console.error('Failed to load quiz data:', error);
      }

      if (!error && data) {
        console.log(`[useQuizData] Fetched ${data.length} questions for course ${courseId}`);
        const parsed: QuizQuestion[] = [];

        for (const q of data) {
          // Debug: log what each question has
          const hasContent = q.content !== null && q.content !== undefined;
          const hasStructured = q.structured_content !== null && q.structured_content !== undefined;
          const hasLegacy = q.quiz_options !== null && q.quiz_options !== undefined;
          console.log(`[useQuizData] Q${q.question_index}: content=${hasContent}, structured=${hasStructured}, legacy=${hasLegacy}`);
          
          if (hasContent) {
            const contentObj = typeof q.content === 'string' ? JSON.parse(q.content as string) : q.content;
            console.log(`[useQuizData] Q${q.question_index} content keys:`, Object.keys(contentObj || {}), 'quizzes count:', (contentObj as any)?.quizzes?.length ?? 0);
          }

          // Priority 1: Multi-quiz from content/structured_content
          const contentQuizzes = parseQuiz(q.content);
          const quizzes = contentQuizzes.length > 0 
            ? contentQuizzes 
            : parseQuiz(q.structured_content);
          
          console.log(`[useQuizData] Q${q.question_index}: parsed ${quizzes.length} quizzes`);

          if (quizzes.length > 0) {
            for (let qi = 0; qi < quizzes.length; qi++) {
              const quizData = quizzes[qi];
              parsed.push({
                id: `${q.id}-${qi}`,
                course_id: q.course_id,
                question_index: q.question_index,
                question_text: q.question_text,
                quiz_question_text: quizData.question,
                answer_text: q.answer_text,
                quiz_options: quizData.options,
                hint: quizData.hint,
              });
            }
            continue;
          }

          // Priority 2: Legacy quiz_options column
          const legacyOptions = q.quiz_options as unknown as QuizOption[] | null;
          if (legacyOptions && Array.isArray(legacyOptions) && legacyOptions.length >= 2) {
            parsed.push({
              id: q.id,
              course_id: q.course_id,
              question_index: q.question_index,
              question_text: q.question_text,
              quiz_question_text: q.question_text,
              answer_text: q.answer_text,
              quiz_options: shuffleArray(legacyOptions),
            });
          }
        }

        console.log(`[useQuizData] Parsed ${parsed.length} quiz questions total`);
        const next = { questions: parsed, hasQuizData: parsed.length > 0 };
        quizCache[courseId] = next;
        try { sessionStorage.setItem(QUIZ_SS + courseId, JSON.stringify(next)); } catch {}
        setQuestions(parsed);
        setHasQuizData(parsed.length > 0);
      }
      setIsLoading(false);
    };

    fetchQuizQuestions();
  }, [courseId]);

  return { questions, isLoading, hasQuizData };
}

export function useBestQuizAttempt(courseId: string | undefined, userId: string | undefined) {
  const cacheKey = courseId && userId ? `${userId}:${courseId}` : '';
  const initial = cacheKey ? readBestCache(cacheKey) : undefined;
  const [best, setBest] = useState<QuizAttempt | null>(initial ?? null);
  const [isLoading, setIsLoading] = useState(initial === undefined);

  useEffect(() => {
    const fetch = async () => {
      if (!courseId || !userId) {
        setIsLoading(false);
        return;
      }
      const key = `${userId}:${courseId}`;
      const cached = readBestCache(key);
      if (cached !== undefined) {
        setBest(cached);
        setIsLoading(false);
      }

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .order('percentage', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Failed to load quiz attempt:', error);
      }
      if (!error) {
        const next: QuizAttempt | null = data
          ? {
              course_id: data.course_id,
              score: data.score,
              total_questions: data.total_questions,
              percentage: data.percentage ?? 0,
            }
          : null;
        bestAttemptCache[key] = next;
        try { sessionStorage.setItem(BEST_SS + key, JSON.stringify(next)); } catch {}
        setBest(next);
      }
      setIsLoading(false);
    };

    fetch();
  }, [courseId, userId]);

  return { best, isLoading };
}

export function useSemesterReadiness(userId: string | undefined, courseIds: string[]) {
  const sortedKey = userId ? `${userId}:${[...courseIds].sort().join(',')}` : '';
  const initial = sortedKey ? readReadinessCache(sortedKey) : null;
  const [readiness, setReadiness] = useState<Map<string, number>>(initial ?? new Map());
  const [isLoading, setIsLoading] = useState(initial == null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || courseIds.length === 0) {
        setIsLoading(false);
        return;
      }
      const key = `${userId}:${[...courseIds].sort().join(',')}`;
      const cached = readReadinessCache(key);
      if (cached) {
        setReadiness(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('course_id, percentage')
        .eq('user_id', userId)
        .in('course_id', courseIds)
        .order('percentage', { ascending: false });

      if (error) {
        console.error('Failed to load readiness data:', error);
      }
      if (!error && data) {
        const bestPerCourse = new Map<string, number>();
        data.forEach(row => {
          const existing = bestPerCourse.get(row.course_id) ?? 0;
          if ((row.percentage ?? 0) > existing) {
            bestPerCourse.set(row.course_id, row.percentage ?? 0);
          }
        });
        const obj = Object.fromEntries(bestPerCourse);
        readinessCache[key] = obj;
        try { sessionStorage.setItem(READY_SS + key, JSON.stringify(obj)); } catch {}
        setReadiness(bestPerCourse);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [userId, courseIds.join(','), refreshKey]);

  const totalPercentage = courseIds.length > 0
    ? Math.round(
        courseIds.reduce((sum, id) => sum + (readiness.get(id) ?? 0), 0) / courseIds.length
      )
    : 0;

  return { readiness, totalPercentage, isLoading, refetch };
}
