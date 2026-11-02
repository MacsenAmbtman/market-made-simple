import { beforeEach, describe, expect, it } from "vitest";
import { courseLessons, dayTradingLessons, getAllProgress, getCompleted, getLesson, getProgress, lessons, recordQuiz, saveSlide, type Lesson } from "@/lib/lessons";
import { getRewards, grantReward, totalRewards } from "@/lib/rewards";
import { applyRewards, contributed, initialState, START_CASH } from "@/lib/simulator";

const lesson = getLesson("what-is-a-stock") as Lesson;
const correct = lesson.quiz.map((q) => q.answer);
const wrong = lesson.quiz.map((q) => (q.answer + 1) % q.options.length);

beforeEach(() => localStorage.clear());

describe("lesson content", () => {
  it("starts the course with the original three modules, then the day-trading track", () => {
    expect(courseLessons.slice(0, 3).map((l) => l.title)).toEqual(["What is a Stock?", "Understanding Risk & Reward", "How Market Orders Work"]);
    expect(dayTradingLessons.map((l) => l.level)).toEqual(["Beginner", "Intermediate", "Advanced"]);
    for (const l of lessons) {
      expect(l.slides.length).toBeGreaterThan(0);
      expect(l.quiz).toHaveLength(5);
      for (const q of l.quiz) expect(q.options[q.answer]).toBeDefined();
    }
  });
});

describe("progress", () => {
  it("saves the last slide viewed", () => {
    saveSlide(lesson.slug, 3);
    expect(getProgress(lesson.slug).slide).toBe(3);
  });

  it("does not complete or reward a failed quiz", () => {
    const r = recordQuiz(lesson, wrong);
    expect(r).toMatchObject({ score: 0, passed: false, rewardGranted: 0 });
    expect(getProgress(lesson.slug)).toMatchObject({ completed: false, attempts: 1 });
    expect(getRewards()).toHaveLength(0);
  });

  it("completes on 4 of 5 and grants the reward exactly once", () => {
    const first = recordQuiz(lesson, correct.map((a, i) => (i === 4 ? wrong[4]! : a)));
    expect(first).toMatchObject({ score: 4, passed: true, rewardGranted: lesson.reward, alreadyRewarded: false });
    const again = recordQuiz(lesson, correct);
    expect(again).toMatchObject({ score: 5, passed: true, rewardGranted: 0, alreadyRewarded: true });
    expect(totalRewards()).toBe(lesson.reward);
    expect(getProgress(lesson.slug)).toMatchObject({ completed: true, bestScore: 5, attempts: 2 });
    expect(getCompleted()).toEqual([lesson.slug]);
  });

  it("migrates completions from the old storage key", () => {
    localStorage.setItem("stockify-completed", JSON.stringify(["what-is-a-stock", "removed-lesson"]));
    expect(getAllProgress()["what-is-a-stock"]?.completed).toBe(true);
    expect(getCompleted()).toEqual(["what-is-a-stock"]);
  });
});

describe("simulator rewards", () => {
  it("credits each reward to cash once and raises the return baseline", () => {
    grantReward({ id: "lesson:a", amount: 500, label: "A" });
    const { state, applied } = applyRewards(initialState(), getRewards());
    expect(applied).toHaveLength(1);
    expect(state.cash).toBe(START_CASH + 500);
    expect(contributed(state)).toBe(START_CASH + 500);

    grantReward({ id: "lesson:b", amount: 750, label: "B" });
    const second = applyRewards(state, getRewards());
    expect(second.applied.map((r) => r.id)).toEqual(["lesson:b"]);
    expect(second.state.cash).toBe(START_CASH + 1250);
    expect(applyRewards(second.state, getRewards()).applied).toHaveLength(0);
  });

  it("rejects duplicate reward ids", () => {
    expect(grantReward({ id: "x", amount: 100, label: "X" })).toBe(true);
    expect(grantReward({ id: "x", amount: 100, label: "X" })).toBe(false);
    expect(totalRewards()).toBe(100);
  });
});
