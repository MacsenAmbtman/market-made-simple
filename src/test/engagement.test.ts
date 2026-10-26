import { beforeEach, describe, expect, it } from "vitest";
import { addDays, CHALLENGES, challengeFor, challengeReward, claimChallenge, currentStreak, dayKey, getDaily, nextCheckIn, type ChallengeCtx } from "@/lib/daily";
import { totalRewards } from "@/lib/rewards";
import { BUY_SHARES, buildPath, POST_POINTS, PRE_POINTS, scenarioOutcome, type Scenario } from "@/lib/scenarios";
import { initialState, placeLimitOrder, placeMarketOrder, stepMarket, type SimState } from "@/lib/simulator";

beforeEach(() => localStorage.clear());

const ctxFor = (sim: SimState, today = dayKey()): ChallengeCtx => ({ sim, lessons: {}, today });
/** First date (from a fixed start) whose rotating challenge has the given id. */
function dayWith(id: string) {
  let d = "2026-01-01";
  while (challengeFor(d).id !== id) d = addDays(d, 1);
  return d;
}

describe("streaks", () => {
  it("counts consecutive days and resets after a missed day", () => {
    let s = nextCheckIn({ last: null, streak: 0, best: 0 }, "2026-02-27");
    expect(s).toEqual({ last: "2026-02-27", streak: 1, best: 1 });
    expect(nextCheckIn(s, "2026-02-27")).toBe(s); // same day is a no-op
    s = nextCheckIn(s, "2026-02-28");
    s = nextCheckIn(s, "2026-03-01"); // across a month boundary
    expect(s.streak).toBe(3);
    s = nextCheckIn(s, "2026-03-03");
    expect(s).toEqual({ last: "2026-03-03", streak: 1, best: 3 });
  });

  it("reports a broken streak as 0 until the next check-in", () => {
    const s = { last: "2026-03-01", streak: 4, best: 4 };
    expect(currentStreak(s, "2026-03-02")).toBe(4);
    expect(currentStreak(s, "2026-03-03")).toBe(0);
  });

  it("scales the reward with the streak, capped at day 7", () => {
    expect([1, 2, 7, 30].map(challengeReward)).toEqual([250, 300, 550, 550]);
  });
});

describe("daily challenges", () => {
  it("rotates deterministically through the pool", () => {
    expect(challengeFor("2026-05-05")).toBe(challengeFor("2026-05-05"));
    const seen = new Set(Array.from({ length: 60 }, (_, i) => challengeFor(addDays("2026-01-01", i)).id));
    expect(seen.size).toBeGreaterThan(3);
  });

  it("only counts trades made today", () => {
    const ch = CHALLENGES.find((c) => c.id === "three-trades")!;
    let sim = initialState();
    for (let i = 0; i < 3; i++) sim = placeMarketOrder(sim, "KO", "buy", 1).state;
    expect(ch.progress(ctxFor(sim))).toBe(3);
    expect(ch.progress(ctxFor(sim, addDays(dayKey(), 1)))).toBe(0);
  });

  it("detects filled limit orders and passed quizzes", () => {
    const limit = CHALLENGES.find((c) => c.id === "limit-fill")!;
    const sim = placeLimitOrder(initialState(), "AAPL", "buy", 1, 1000).state; // marketable, fills now
    expect(limit.progress(ctxFor(sim))).toBe(1);

    const quiz = CHALLENGES.find((c) => c.id === "quiz")!;
    expect(quiz.progress({ sim, lessons: { "what-is-a-stock": { slide: 0, completed: true, bestScore: 3, attempts: 1, lastScore: 3, lastAttemptAt: Date.now() } }, today: dayKey() })).toBe(1);
  });

  it("grants the bonus once per day and counts as a check-in", () => {
    const day = dayWith("diversify");
    let sim = initialState();
    for (const sym of ["AAPL", "KO", "SPY"]) sim = placeMarketOrder(sim, sym, "buy", 1).state;
    const incomplete = placeMarketOrder(initialState(), "KO", "buy", 1).state;

    expect(claimChallenge(ctxFor(incomplete, day))).toBe(0);
    expect(claimChallenge(ctxFor(sim, day))).toBe(250);
    expect(claimChallenge(ctxFor(sim, day))).toBe(0);
    expect(totalRewards()).toBe(250);
    expect(getDaily()).toMatchObject({ last: day, streak: 1 });
  });
});

describe("trade records", () => {
  it("records time, order type and entry price", () => {
    let s = placeMarketOrder(initialState(), "KO", "buy", 2).state;
    expect(s.trades[0]).toMatchObject({ kind: "market", side: "buy" });
    expect(typeof s.trades[0]?.at).toBe("number");
    s = stepMarket(s, () => 0.9);
    s = placeMarketOrder(s, "KO", "sell", 2).state;
    expect(s.trades[0]).toMatchObject({ side: "sell", entry: 61.2 });
  });
});

describe("news scenarios", () => {
  const sc: Scenario = {
    id: "test", sym: "TST", company: "Test Co", headline: "News", source: "Wire",
    startPrice: 100, owned: 10, gap: -0.1, drift: -0.05, slippage: 0.01,
    feedback: { buy: "", hold: "", sell: "" },
  };

  it("builds the same path every time, gapping on the news and ending at the drift level", () => {
    const path = buildPath(sc);
    expect(path).toEqual(buildPath(sc));
    expect(path).toHaveLength(PRE_POINTS + POST_POINTS);
    expect(path[PRE_POINTS]!).toBeLessThan(92);
    expect(path.at(-1)).toBe(95);
  });

  it("computes each decision's result, including slippage", () => {
    const path = buildPath(sc);
    const news = path[PRE_POINTS]!;
    const hold = scenarioOutcome(sc, "hold", path);
    expect(hold.pnl).toBe(-50);
    const sell = scenarioOutcome(sc, "sell", path);
    expect(sell.fillPrice).toBeCloseTo(news * 0.99, 2);
    expect(sell.pnl).toBeCloseTo(10 * (sell.fillPrice! - 100), 2);
    const buy = scenarioOutcome(sc, "buy", path);
    expect(buy.pnl).toBeCloseTo(-50 + BUY_SHARES * (95 - buy.fillPrice!), 2);
  });
});
