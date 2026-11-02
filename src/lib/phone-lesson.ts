// Phone learning flow: interleaved lesson steps, finishing a lesson (which extends the streak),
// the phone daily goal, and the one-off "locked lesson" message carried across a redirect.

import { checkIn, dayKey, type DailyState } from "./daily";
import { courseLessons, PASS_SCORE, recordQuiz, type Lesson, type LessonProgress, type QuizOutcome } from "./lessons";

export type Step = { kind: "slide"; i: number } | { kind: "quiz"; i: number };

/**
 * Slides with a quiz question after roughly every two slides. When resuming at `startSlide`,
 * earlier slides stay reachable with Back and any questions before that point move to the end.
 */
export function buildSteps(lesson: Lesson, startSlide = 0): { steps: Step[]; start: number } {
  const base: Step[] = [];
  let qi = 0;
  lesson.slides.forEach((_, i) => {
    base.push({ kind: "slide", i });
    if ((i + 1) % 2 === 0 && qi < lesson.quiz.length) base.push({ kind: "quiz", i: qi++ });
  });
  while (qi < lesson.quiz.length) base.push({ kind: "quiz", i: qi++ });
  const at = startSlide > 0 ? base.findIndex((s) => s.kind === "slide" && s.i === startSlide) : -1;
  if (at <= 0) return { steps: base, start: 0 };
  const before = base.slice(0, at);
  const earlierSlides = before.filter((s) => s.kind === "slide");
  const skippedQuiz = before.filter((s) => s.kind === "quiz");
  return { steps: [...earlierSlides, ...base.slice(at), ...skippedQuiz], start: earlierSlides.length };
}

/** Only the questions, for a retry after not passing. */
export const quizOnlySteps = (lesson: Lesson): Step[] => lesson.quiz.map((_, i) => ({ kind: "quiz", i }));

export type PhoneFinish = QuizOutcome & { streak: DailyState | null };

/** Record the attempt exactly like desktop; a pass also counts as today's streak day (once per day). */
export function finishPhoneLesson(lesson: Lesson, answers: number[], today = dayKey()): PhoneFinish {
  const outcome = recordQuiz(lesson, answers);
  return { ...outcome, streak: outcome.passed ? checkIn(today) : null };
}

export type PhoneGoal = { mode: "finish" | "replay"; done: boolean; slug: string };

/** "Finish 1 lesson today", or "Replay a lesson" once every investing lesson is done. */
export function phoneGoal(progress: Record<string, LessonProgress>, today = dayKey()): PhoneGoal {
  const done = Object.values(progress).some(
    (p) => p.lastAttemptAt != null && dayKey(new Date(p.lastAttemptAt)) === today && (p.lastScore ?? 0) >= PASS_SCORE,
  );
  const next = courseLessons.find((l) => !progress[l.slug]?.completed);
  return next ? { mode: "finish", done, slug: next.slug } : { mode: "replay", done, slug: courseLessons[0]!.slug };
}

/** The next investing lesson after this one, for the "Next lesson" button. */
export function nextCourseLesson(slug: string): Lesson | undefined {
  const i = courseLessons.findIndex((l) => l.slug === slug);
  return i >= 0 ? courseLessons[i + 1] : undefined;
}

const LOCKED_FLASH = "stockify:locked-flash";
export const LOCKED_MESSAGE = "Finish the previous lesson first";
export function setLockedFlash() {
  try { sessionStorage.setItem(LOCKED_FLASH, "1"); } catch { /* storage blocked */ }
}
export function takeLockedFlash(): boolean {
  try {
    const v = sessionStorage.getItem(LOCKED_FLASH);
    sessionStorage.removeItem(LOCKED_FLASH);
    return v === "1";
  } catch {
    return false;
  }
}
