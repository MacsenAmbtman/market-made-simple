import { beforeEach, describe, expect, it } from "vitest";
import {
  courseLessons, dayTradingLessons, getAllProgress, getLesson, getPracticeEntry, isUnlockedOnPhone, lessonXp, lessons, LESSONS_KEY,
  passMark, recordQuiz, scoreOutOf, totalXp, units, upcoming, type Lesson,
} from "@/lib/lessons";
import { getRewards, grantReward, totalRewards } from "@/lib/rewards";
import { pickPractice, practicePool, practiceXpGain, recordPractice } from "@/lib/practice";
import { phoneGoal } from "@/lib/phone-lesson";
import { mergeLessons, parseLessons } from "@/lib/account-data";

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

const answers = (l: Lesson) => l.quiz.map((q) => q.answer);
const seed = (data: unknown) => localStorage.setItem(LESSONS_KEY, JSON.stringify(data));

describe("every lesson", () => {
  it("has a unique slug, 6 slides and exactly 5 well-formed questions", () => {
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length);
    for (const l of lessons) {
      expect(l.slides, l.slug).toHaveLength(6);
      expect(l.quiz, l.slug).toHaveLength(5);
      for (const q of l.quiz) {
        expect(q.options, q.q).toHaveLength(4);
        expect(new Set(q.options).size, q.q).toBe(4);
        expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, q.q).toBe(true);
        expect(q.explain.trim().length, q.q).toBeGreaterThan(10);
      }
    }
  });

  it("has 18 investing lessons in 5 units, before the 3 day-trading lessons", () => {
    expect(courseLessons).toHaveLength(18);
    expect(units).toHaveLength(5);
    expect(units.flatMap((u) => u.slugs)).toEqual(courseLessons.map((l) => l.slug));
    expect(lessons.map((l) => l.slug)).toEqual([...courseLessons, ...dayTradingLessons].map((l) => l.slug));
    expect(upcoming).toEqual([]);
  });

  it("pays $500 for each new lesson and keeps the original rewards", () => {
    expect(courseLessons.slice(0, 3).map((l) => l.reward)).toEqual([500, 750, 1000]);
    expect(courseLessons.slice(3).every((l) => l.reward === 500)).toBe(true);
  });
});

describe("pass mark", () => {
  it("is 4 out of 5", () => {
    expect(passMark(courseLessons[0]!)).toBe(4);
    const l = courseLessons[3]!;
    const three = answers(l).map((a, i) => (i < 2 ? (a + 1) % 4 : a));
    expect(recordQuiz(l, three).passed).toBe(false);
    const four = answers(l).map((a, i) => (i === 0 ? (a + 1) % 4 : a));
    expect(recordQuiz(l, four).passed).toBe(true);
  });
});

describe("existing users", () => {
  const old = { "what-is-a-stock": { slide: 5, completed: true, bestScore: 3, attempts: 1 }, "risk-and-reward": { slide: 5, completed: true, bestScore: 2, attempts: 1 } };

  it("keep completed lessons from the 3-question quizzes, shown out of 3", () => {
    seed(old);
    const p = getAllProgress();
    expect(p["risk-and-reward"]!.completed).toBe(true);
    expect(isUnlockedOnPhone("market-orders", p)).toBe(true);
    const stock = getLesson("what-is-a-stock")!;
    expect(`${p["what-is-a-stock"]!.bestScore}/${scoreOutOf(p["what-is-a-stock"], stock)}`).toBe("3/3");
    expect(lessonXp(p["what-is-a-stock"], stock)).toBe(70);
  });

  it("stay completed after failing a replay, and keep the old best score", () => {
    seed(old);
    const l = getLesson("what-is-a-stock")!;
    recordQuiz(l, l.quiz.map((q) => (q.answer + 1) % 4));
    const p = getAllProgress()[l.slug]!;
    expect(p.completed).toBe(true);
    expect(`${p.bestScore}/${scoreOutOf(p, l)}`).toBe("3/3");
  });

  it("are never paid a lesson's bonus cash twice", () => {
    seed(old);
    grantReward({ id: "lesson:what-is-a-stock", amount: 500, label: "old" });
    const l = getLesson("what-is-a-stock")!;
    expect(recordQuiz(l, answers(l)).rewardGranted).toBe(0);
    expect(totalRewards()).toBe(500);
  });

  it("don't get the perfect-score XP again after an old perfect 3/3", () => {
    seed(old);
    const l = getLesson("what-is-a-stock")!;
    expect(recordQuiz(l, answers(l)).xpGained).toBe(10);
  });
});

describe("practice", () => {
  it("only draws from completed lessons", () => {
    expect(practicePool(getAllProgress())).toEqual([]);
    const l = courseLessons[0]!;
    recordQuiz(l, answers(l));
    const round = pickPractice(getAllProgress());
    expect(round).toHaveLength(5);
    expect(round.every((q) => q.slug === l.slug)).toBe(true);
    expect(new Set(round.map((q) => q.i)).size).toBe(5);
  });

  it("gives 2 XP per correct answer, capped at 20 a day", () => {
    expect(recordPractice(5, "2026-11-02").xpGained).toBe(10);
    expect(recordPractice(4, "2026-11-02").xpGained).toBe(8);
    expect(recordPractice(5, "2026-11-02")).toMatchObject({ xpGained: 2, capReached: true });
    expect(recordPractice(5, "2026-11-02").xpGained).toBe(0);
    expect(recordPractice(3, "2026-11-03").xpGained).toBe(6);
    expect(getPracticeEntry()?.xp).toBe(26);
    expect(totalXp(getAllProgress(), getPracticeEntry()?.xp)).toBe(26);
    expect(practiceXpGain(undefined, 15, "2026-11-04")).toBe(20);
  });

  it("never pays bonus cash or changes lesson results", () => {
    const l = courseLessons[0]!;
    recordQuiz(l, answers(l));
    const before = getAllProgress();
    const rewards = getRewards().length;
    recordPractice(5, "2026-11-02");
    expect(getRewards()).toHaveLength(rewards);
    expect(getAllProgress()).toEqual(before);
  });

  it("counts toward the replay daily goal once every lesson is finished", () => {
    for (const l of courseLessons) recordQuiz(l, answers(l));
    const progress = getAllProgress();
    const stale = Object.fromEntries(Object.entries(progress).map(([k, p]) => [k, { ...p, lastAttemptAt: 0 }]));
    expect(phoneGoal(stale, "2026-11-02").done).toBe(false);
    recordPractice(2, "2026-11-02");
    expect(phoneGoal(stale, "2026-11-02", getPracticeEntry())).toMatchObject({ mode: "replay", done: true });
  });

  it("syncs practice XP with the account", () => {
    recordPractice(5, "2026-11-02");
    const local = parseLessons(JSON.parse(localStorage.getItem(LESSONS_KEY)!));
    const remote = parseLessons({ __practice: { xp: 4, attempts: 1, practiceDay: "2026-11-01", practiceDayXp: 4 } });
    expect(mergeLessons(remote, local).__practice).toMatchObject({ xp: 10, attempts: 1, practiceDay: "2026-11-02", practiceDayXp: 10 });
  });
});
