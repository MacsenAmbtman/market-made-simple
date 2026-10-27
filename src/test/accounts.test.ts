import { describe, expect, it } from "vitest";
import { fromRow, mergeDaily, mergeLessons, mergeRewards, mergeSnapshots, parseLessons, toRow, type Snapshot } from "@/lib/account-data";
import { passwordResetEmail, reminderEmail, TAGLINE, welcomeEmail } from "@/lib/email-templates";
import { lessons } from "@/lib/lessons";
import { pickReminder, type ReminderInput } from "@/lib/reminders";
import { initialState, placeMarketOrder } from "@/lib/simulator";

const blank = (): Snapshot => ({ lessons: {}, rewards: [], daily: { last: null, streak: 0, best: 0 }, simulator: null, simulatorAt: null });
const traded = () => placeMarketOrder(initialState(), "AAPL", "buy", 1).state;
const slug = lessons[0]!.slug;
const reward = (id: string) => ({ id, amount: 500, label: id, t: 1 });

describe("merging account data", () => {
  it("keeps the best of each lesson's progress", () => {
    const merged = mergeLessons(
      { [slug]: { slide: 2, completed: false, bestScore: 1, attempts: 1, lastScore: 1, lastAttemptAt: 10 } },
      { [slug]: { slide: 0, completed: true, bestScore: 3, attempts: 2, lastScore: 3, lastAttemptAt: 20, completedAt: 20 } },
    );
    expect(merged[slug]).toEqual({ slide: 2, completed: true, bestScore: 3, attempts: 2, lastScore: 3, lastAttemptAt: 20, completedAt: 20 });
  });

  it("unions rewards by id so bonuses are never doubled", () => {
    expect(mergeRewards([reward("a"), reward("b")], [reward("b"), reward("c")]).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("takes the streak from the most recent check-in and the best of both", () => {
    expect(mergeDaily({ last: "2026-10-20", streak: 9, best: 9 }, { last: "2026-10-26", streak: 2, best: 4 })).toEqual({ last: "2026-10-26", streak: 2, best: 9 });
    expect(mergeDaily({ last: "2026-10-26", streak: 3, best: 3 }, { last: "2026-10-26", streak: 5, best: 5 })).toEqual({ last: "2026-10-26", streak: 5, best: 5 });
  });

  it("folds a guest's progress into the account on first sign-in", () => {
    const guest = { ...blank(), rewards: [reward("lesson:a")], simulator: traded(), simulatorAt: 5 };
    const merged = mergeSnapshots(guest, null, "user-1", blank());
    expect(merged.rewards).toHaveLength(1);
    expect(merged.simulator?.trades).toHaveLength(1);
  });

  it("prefers the account's used portfolio over a guest's", () => {
    const remote = { ...blank(), simulator: traded(), simulatorAt: 1 };
    const guest = { ...blank(), simulator: initialState(), simulatorAt: 99 };
    expect(mergeSnapshots(guest, null, "user-1", remote).simulator).toBe(remote.simulator);
  });

  it("keeps this device's portfolio when it is the same user's newer copy", () => {
    const remote = { ...blank(), simulator: traded(), simulatorAt: 1 };
    const local = { ...blank(), simulator: traded(), simulatorAt: 2 };
    expect(mergeSnapshots(local, "user-1", "user-1", remote).simulator).toBe(local.simulator);
  });

  it("never mixes in data another account left on this device", () => {
    const leftover = { ...blank(), rewards: [reward("someone-else")], simulator: traded(), simulatorAt: 99 };
    expect(mergeSnapshots(leftover, "user-2", "user-1", blank())).toEqual(blank());
  });

  it("round-trips through a database row", () => {
    const s: Snapshot = {
      lessons: { [slug]: { slide: 1, completed: true, bestScore: 3, attempts: 1, completedAt: 7 } },
      rewards: [reward("lesson:x")],
      daily: { last: "2026-10-26", streak: 4, best: 6 },
      simulator: traded(),
      simulatorAt: Date.parse("2026-10-26T12:00:00Z"),
    };
    const row = toRow(s);
    expect(row.completed_lessons).toEqual([slug]);
    expect(row.streak).toBe(4);
    const back = fromRow({ lessons: row.lessons, rewards: row.rewards, streak: 4, best_streak: 6, last_check_in: "2026-10-26", simulator: row.simulator, simulator_updated_at: row.simulator_updated_at ?? null });
    expect(back.daily).toEqual(s.daily);
    expect(back.simulator?.trades).toHaveLength(1);
    expect(back.simulatorAt).toBe(s.simulatorAt);
    expect(back.lessons[slug]?.completed).toBe(true);
  });

  it("only writes the columns for the parts that changed", () => {
    expect(Object.keys(toRow(blank(), new Set(["daily"] as const))).sort()).toEqual(["best_streak", "last_check_in", "streak"]);
  });

  it("drops malformed or unknown lesson data from the server", () => {
    expect(parseLessons({ nope: { completed: true }, [slug]: { completed: "yes", bestScore: 99, slide: -3 } })).toEqual({
      [slug]: { slide: 0, completed: false, bestScore: lessons[0]!.quiz.length, attempts: 0, lastScore: undefined, lastAttemptAt: undefined, completedAt: undefined },
    });
    expect(parseLessons([1, 2])).toEqual({});
  });
});

describe("reminder emails", () => {
  // 18:00 in New York on 27 Oct 2026 (UTC-4).
  const evening = new Date("2026-10-27T22:00:00Z");
  const base: ReminderInput = { timezone: "America/New_York", createdAt: "2026-10-01T00:00:00Z", lastReminderOn: null, lastCheckIn: null, streak: 0, completedLessons: [] };

  it("warns about a streak that ends tonight", () => {
    expect(pickReminder({ ...base, lastCheckIn: "2026-10-26", streak: 5 }, evening)).toEqual({ today: "2026-10-27", reminder: { kind: "streak", streak: 5 } });
  });

  it("sends nothing to someone who already checked in today", () => {
    expect(pickReminder({ ...base, lastCheckIn: "2026-10-27", streak: 6 }, evening)).toBeNull();
  });

  it("only sends in the user's local evening, once a day", () => {
    expect(pickReminder({ ...base, lastCheckIn: "2026-10-26", streak: 5 }, new Date("2026-10-27T14:00:00Z"))).toBeNull();
    expect(pickReminder({ ...base, lastCheckIn: "2026-10-26", streak: 5, lastReminderOn: "2026-10-27" }, evening)).toBeNull();
  });

  it("nudges toward the next unfinished lesson, but not every day", () => {
    expect(pickReminder({ ...base, lastCheckIn: "2026-10-20", completedLessons: [slug] }, evening)).toEqual({
      today: "2026-10-27",
      reminder: { kind: "lesson", lessonTitle: lessons[1]!.title },
    });
    expect(pickReminder({ ...base, lastCheckIn: "2026-10-20", lastReminderOn: "2026-10-26" }, evening)).toBeNull();
  });

  it("stops after a month of inactivity", () => {
    expect(pickReminder({ ...base, createdAt: "2026-08-01T00:00:00Z", lastCheckIn: "2026-09-01" }, evening)).toBeNull();
  });

  it("falls back to UTC for an unknown time zone", () => {
    expect(pickReminder({ ...base, timezone: "Not/AZone", lastCheckIn: "2026-10-26", streak: 2 }, new Date("2026-10-27T18:00:00Z"))?.today).toBe("2026-10-27");
  });
});

describe("email content", () => {
  it("leads the welcome email with the tagline and escapes the user's name", () => {
    const e = welcomeEmail({ name: "<b>Sam</b>", siteUrl: "https://example.com" });
    expect(e.subject).toContain(TAGLINE);
    expect(e.html).toContain("&lt;b&gt;Sam&lt;/b&gt;");
    expect(e.html).not.toContain("<b>Sam</b>");
    expect(e.text).toContain("https://example.com/learn");
  });

  it("puts the reset link in the password email", () => {
    expect(passwordResetEmail({ link: "https://x.test/verify?token=abc&type=recovery" }).html).toContain("https://x.test/verify?token=abc&amp;type=recovery");
  });

  it("includes an unsubscribe link in reminders", () => {
    const e = reminderEmail({ name: null, siteUrl: "https://s.test", unsubscribeUrl: "https://s.test/api/email/unsubscribe?token=t", reminder: { kind: "streak", streak: 3 } });
    expect(e.subject).toContain("3-day streak");
    expect(e.html).toContain("unsubscribe?token=t");
    expect(e.text).toContain("unsubscribe?token=t");
  });
});
