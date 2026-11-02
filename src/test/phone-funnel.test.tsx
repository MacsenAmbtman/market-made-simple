import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shouldInvite, INVITE_AFTER_SECONDS } from "@/lib/feedback-invite";
import { skipFirstQuestion } from "@/lib/onboarding";
import { markSavePromptSeen, parseNext, readSavePromptSeen, SAVE_PROMPT_LESSONS, shouldShowSavePrompt } from "@/lib/save-prompt";
import { courseLessons } from "@/lib/lessons";
import { mergeSnapshots, type Snapshot } from "@/lib/account-data";
import { isReturnVisit, trackEvent, trackReturnVisit } from "@/lib/analytics";
import { FIRST_QUESTION } from "@/lib/first-question";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <a href="#" onClick={onClick}>{children}</a>,
}));
const { FirstQuestion } = await import("@/components/FirstQuestion");

const never = { asked: false, submitted: false };
const engaged = { seconds: INVITE_AFTER_SECONDS + 30, screens: 8 };
const [lesson1, lesson2, lesson3] = courseLessons.map((l) => l.slug);

describe("feedback popup on phones", () => {
  it("never appears mid-lesson, in practice, on the first question or on sign-in screens", () => {
    for (const path of [`/learn/${lesson1}`, "/practice", "/", "/signup", "/login"]) {
      expect(shouldInvite({ ...engaged, path }, never, { completedLessons: 3 })).toBe(false);
    }
  });
  it("waits until at least one lesson is complete, then only on the path", () => {
    expect(shouldInvite({ ...engaged, path: "/learn" }, never, { completedLessons: 0 })).toBe(false);
    expect(shouldInvite({ ...engaged, path: "/learn" }, never, { completedLessons: 1 })).toBe(true);
  });
  it("still asks only once", () => {
    expect(shouldInvite({ ...engaged, path: "/learn" }, { asked: true, submitted: false }, { completedLessons: 2 })).toBe(false);
  });
});

describe("feedback popup on computers (unchanged)", () => {
  it("asks on any non-auth page once the threshold is met, lessons included", () => {
    expect(shouldInvite({ ...engaged, path: `/learn/${lesson1}` }, never)).toBe(true);
    expect(shouldInvite({ ...engaged, path: "/simulator" }, never)).toBe(true);
    expect(shouldInvite({ ...engaged, path: "/signup" }, never)).toBe(false);
    expect(shouldInvite({ seconds: INVITE_AFTER_SECONDS - 1, screens: 1, path: "/" }, never)).toBe(false);
  });
});

describe("one-question start", () => {
  it("shows for a brand-new visitor only", () => {
    expect(skipFirstQuestion(false, {})).toBe(false);
  });
  it("is skipped once answered (or after the old setup quiz)", () => {
    expect(skipFirstQuestion(true, {})).toBe(true);
  });
  it("is skipped for anyone with lesson progress", () => {
    expect(skipFirstQuestion(false, { [lesson1!]: { completed: false, slide: 2, attempts: 0 } })).toBe(true);
    expect(skipFirstQuestion(false, { [lesson1!]: { completed: true, slide: 0, attempts: 1 } })).toBe(true);
  });
  it("uses a fictional company", () => {
    expect(FIRST_QUESTION.question).toContain("(fictional)");
  });
});

describe("save your streak prompt", () => {
  const base = { passed: true, signedOut: true, seen: [] as string[] };
  it("shows after a guest passes Lesson 1 and Lesson 3, not Lesson 2", () => {
    expect(SAVE_PROMPT_LESSONS).toEqual([lesson1, lesson3]);
    expect(shouldShowSavePrompt({ ...base, slug: lesson1! })).toBe(true);
    expect(shouldShowSavePrompt({ ...base, slug: lesson2! })).toBe(false);
    expect(shouldShowSavePrompt({ ...base, slug: lesson3! })).toBe(true);
  });
  it("shows each time only once", () => {
    expect(shouldShowSavePrompt({ ...base, slug: lesson1!, seen: [lesson1!] })).toBe(false);
    expect(shouldShowSavePrompt({ ...base, slug: lesson3!, seen: [lesson1!, lesson3!] })).toBe(false);
  });
  it("never shows to signed-in people or after a failed attempt", () => {
    expect(shouldShowSavePrompt({ ...base, slug: lesson1!, signedOut: false })).toBe(false);
    expect(shouldShowSavePrompt({ ...base, slug: lesson1!, passed: false })).toBe(false);
  });
  it("sign-up only returns to known pages", () => {
    expect(parseNext("/learn")).toBe("/learn");
    expect(parseNext("https://evil.example")).toBeUndefined();
  });
});

describe("progress transfers on sign-up", () => {
  it("keeps every lesson, XP, streak, practice XP and bonus cash from the guest", () => {
    const guest: Snapshot = {
      lessons: {
        [lesson1!]: { slide: 0, completed: true, bestScore: 5, attempts: 1, lastScore: 5, lastAttemptAt: 10, completedAt: 10, xp: 60, outOf: 5 },
        __practice: { slide: 0, completed: false, bestScore: 0, attempts: 0, lastScore: 0, xp: 14, practiceDay: "2026-11-02" } as never,
      },
      rewards: [{ id: `lesson:${lesson1}`, amount: 500, label: "Lesson", t: 1 }],
      daily: { last: "2026-11-02", streak: 1, best: 1 },
      simulator: null,
      simulatorAt: null,
    };
    const empty: Snapshot = { lessons: {}, rewards: [], daily: { last: null, streak: 0, best: 0 }, simulator: null, simulatorAt: null };
    const merged = mergeSnapshots(guest, null, "new-user", empty);
    expect(merged.lessons[lesson1!]?.completed).toBe(true);
    expect(merged.lessons[lesson1!]?.xp).toBe(guest.lessons[lesson1!]?.xp);
    expect(merged.lessons["__practice"]?.xp).toBe(14);
    expect(merged.daily).toEqual({ last: "2026-11-02", streak: 1, best: 1 });
    expect(merged.rewards.map((r) => r.amount)).toEqual([500]);
  });
});

describe("tracking", () => {
  const gtag = vi.fn();
  beforeEach(() => { gtag.mockClear(); window.gtag = gtag; localStorage.clear(); });
  afterEach(() => { delete window.gtag; vi.restoreAllMocks(); });

  it("adds the device type to every event", () => {
    trackEvent("lesson_start", { lesson_slug: lesson1 });
    expect(gtag).toHaveBeenCalledWith("event", "lesson_start", { device: "computer", lesson_slug: lesson1 });
  });

  it("sends first_question_shown and first_question_answered without personal data", () => {
    render(<FirstQuestion />);
    fireEvent.click(screen.getByRole("radio", { name: FIRST_QUESTION.options[0] }));
    const names = gtag.mock.calls.map((c) => c[1]);
    expect(names).toEqual(["first_question_shown", "first_question_answered"]);
    expect(gtag.mock.calls[1]![2]).toEqual({ device: "computer", correct: true });
    expect(localStorage.getItem("stockify:onboarding")).toBe("done");
  });

  it("return_visit fires for an earlier-day visitor, once per day, never on the first visit", () => {
    expect(isReturnVisit(null, "2026-11-02")).toBe(false);
    trackReturnVisit("2026-11-01");
    expect(gtag).not.toHaveBeenCalled();
    trackReturnVisit("2026-11-02");
    trackReturnVisit("2026-11-02");
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "return_visit", { device: "computer", days_since: 1 });
  });
});

describe("blocked storage (private mode, in-app browsers)", () => {
  it("never throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readSavePromptSeen()).toEqual([]);
    expect(() => markSavePromptSeen(lesson1!)).not.toThrow();
    expect(() => trackReturnVisit("2026-11-02")).not.toThrow();
    vi.restoreAllMocks();
  });
});
