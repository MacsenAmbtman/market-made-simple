import { beforeEach, describe, expect, it } from "vitest";
import { courseLessons, dayTradingLessons, getAllProgress, getLesson, isUnlockedOnPhone, lessonXp, recordQuiz, totalXp, XP, type Lesson } from "@/lib/lessons";
import { totalRewards } from "@/lib/rewards";
import { getDaily } from "@/lib/daily";
import { buildSteps, finishPhoneLesson, phoneGoal } from "@/lib/phone-lesson";
import { isOnboardingDone, markOnboardingDone, resetOnboarding } from "@/lib/onboarding";
import { mergeLessons, parseLessons } from "@/lib/account-data";

const lesson = getLesson("what-is-a-stock") as Lesson;
const correct = lesson.quiz.map((q) => q.answer);
const twoRight = correct.map((a, i) => (i === 0 ? (a + 1) % lesson.quiz[0]!.options.length : a));
const wrong = lesson.quiz.map((q) => (q.answer + 1) % q.options.length);

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe("phone lesson locking", () => {
  it("opens only lesson 1 at the start, and never day-trading lessons", () => {
    const p = getAllProgress();
    expect(isUnlockedOnPhone(courseLessons[0]!.slug, p)).toBe(true);
    expect(isUnlockedOnPhone(courseLessons[1]!.slug, p)).toBe(false);
    expect(isUnlockedOnPhone(courseLessons[2]!.slug, p)).toBe(false);
    expect(isUnlockedOnPhone(dayTradingLessons[0]!.slug, p)).toBe(false);
  });

  it("unlocks lesson 2 after passing lesson 1, and keeps lesson 1 replayable", () => {
    recordQuiz(lesson, correct);
    const p = getAllProgress();
    expect(isUnlockedOnPhone(courseLessons[0]!.slug, p)).toBe(true);
    expect(isUnlockedOnPhone(courseLessons[1]!.slug, p)).toBe(true);
    expect(isUnlockedOnPhone(courseLessons[2]!.slug, p)).toBe(false);
  });

  it("a failed attempt does not unlock the next lesson", () => {
    recordQuiz(lesson, wrong);
    expect(isUnlockedOnPhone(courseLessons[1]!.slug, getAllProgress())).toBe(false);
  });
});

describe("setup quiz shows once", () => {
  it("stays done across visits until retaken", () => {
    expect(isOnboardingDone()).toBe(false);
    markOnboardingDone();
    expect(isOnboardingDone()).toBe(true);
    resetOnboarding();
    expect(isOnboardingDone()).toBe(false);
  });
});

describe("XP", () => {
  it("gives 50 XP for a first pass, 20 more for a first perfect score", () => {
    expect(recordQuiz(lesson, twoRight).xpGained).toBe(50);
    expect(recordQuiz(lesson, correct).xpGained).toBe(10 + 20);
  });

  it("can't be farmed: replays stop at 100 XP and bonus cash is paid once", () => {
    const gains = Array.from({ length: 10 }, () => recordQuiz(lesson, correct).xpGained);
    expect(gains.slice(0, 4)).toEqual([70, 10, 10, 10]);
    expect(gains.slice(4).every((g) => g === 0)).toBe(true);
    expect(totalXp(getAllProgress())).toBe(XP.maxPerLesson);
    expect(totalRewards()).toBe(lesson.reward);
  });

  it("gives no XP for a failed attempt", () => {
    expect(recordQuiz(lesson, wrong).xpGained).toBe(0);
  });

  it("credits lessons finished before XP existed, and keeps XP when syncing accounts", () => {
    expect(lessonXp({ completed: true, bestScore: 3 }, lesson)).toBe(70);
    const local = parseLessons({ [lesson.slug]: { slide: 0, completed: true, bestScore: 2, attempts: 1, xp: 60 } });
    const remote = parseLessons({ [lesson.slug]: { slide: 0, completed: true, bestScore: 2, attempts: 1 } });
    expect(mergeLessons(remote, local)[lesson.slug]!.xp).toBe(60);
  });
});

describe("phone lesson completion", () => {
  it("passing extends the streak by one per day without a check-in tap", () => {
    expect(finishPhoneLesson(lesson, correct, "2026-11-01").streak?.streak).toBe(1);
    expect(finishPhoneLesson(lesson, correct, "2026-11-01").streak?.streak).toBe(1);
    expect(finishPhoneLesson(courseLessons[1]!, courseLessons[1]!.quiz.map((q) => q.answer), "2026-11-02").streak?.streak).toBe(2);
    expect(getDaily()).toMatchObject({ last: "2026-11-02", streak: 2 });
  });

  it("not passing leaves the streak alone", () => {
    expect(finishPhoneLesson(lesson, wrong, "2026-11-01").streak).toBeNull();
    expect(getDaily().streak).toBe(0);
  });

  it("spreads 5 questions evenly over 6 slides and moves skipped questions to the end on resume", () => {
    const kinds = buildSteps(lesson).steps.map((s) => s.kind[0]).join("");
    expect(kinds).toBe("sqsqsqsqssq");
    const resumed = buildSteps(lesson, 3);
    expect(resumed.steps[resumed.start]).toEqual({ kind: "slide", i: 3 });
    expect(resumed.steps.slice(resumed.start).filter((s) => s.kind === "quiz").map((s) => s.i)).toEqual([3, 4, 0, 1, 2]);
    expect(resumed.steps.filter((s) => s.kind === "slide")).toHaveLength(6);
  });

  it("daily goal is a lesson, then a replay once everything is done", () => {
    expect(phoneGoal(getAllProgress())).toMatchObject({ mode: "finish", done: false, slug: courseLessons[0]!.slug });
    for (const l of courseLessons) recordQuiz(l, l.quiz.map((q) => q.answer));
    expect(phoneGoal(getAllProgress())).toMatchObject({ mode: "replay", done: true });
  });
});
