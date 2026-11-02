// Endless practice on phones: quick rounds of questions from lessons the learner has completed.
// Earns a little XP (capped per day), never bonus cash, and never touches lesson scores.

import { dayKey } from "./daily";
import { courseLessons, getLesson, getPracticeEntry, savePracticeEntry, type LessonProgress, type QuizQuestion } from "./lessons";

export const PRACTICE = { perCorrect: 2, dailyCap: 20, roundSize: 5 } as const;

export type PracticeItem = { slug: string; i: number };

/** Every question from completed investing lessons. */
export function practicePool(progress: Record<string, LessonProgress>): PracticeItem[] {
  return courseLessons.filter((l) => progress[l.slug]?.completed).flatMap((l) => l.quiz.map((_, i) => ({ slug: l.slug, i })));
}

/** A random round of distinct questions from the pool. */
export function pickPractice(progress: Record<string, LessonProgress>, rand: () => number = Math.random, n: number = PRACTICE.roundSize): PracticeItem[] {
  const pool = practicePool(progress);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, n);
}

export const practiceQuestion = (item: PracticeItem): QuizQuestion | undefined => getLesson(item.slug)?.quiz[item.i];

/** XP already earned from practice today. */
export const practiceXpToday = (entry: LessonProgress | undefined, today: string) => (entry?.practiceDay === today ? (entry.practiceDayXp ?? 0) : 0);

/** XP a round earns: 2 per correct answer, up to 20 per day in total. */
export function practiceXpGain(entry: LessonProgress | undefined, correct: number, today: string): number {
  return Math.max(0, Math.min(correct * PRACTICE.perCorrect, PRACTICE.dailyCap - practiceXpToday(entry, today)));
}

export type PracticeResult = { correct: number; xpGained: number; capReached: boolean };

/** Save a finished round. Only the practice entry changes; lessons and rewards are untouched. */
export function recordPractice(correct: number, today = dayKey()): PracticeResult {
  const entry = getPracticeEntry();
  const xpGained = practiceXpGain(entry, correct, today);
  const dayXp = practiceXpToday(entry, today) + xpGained;
  savePracticeEntry({
    slide: 0,
    completed: false,
    bestScore: 0,
    attempts: (entry?.attempts ?? 0) + 1,
    xp: (entry?.xp ?? 0) + xpGained,
    practiceDay: today,
    practiceDayXp: dayXp,
  });
  return { correct, xpGained, capReached: dayXp >= PRACTICE.dailyCap };
}
