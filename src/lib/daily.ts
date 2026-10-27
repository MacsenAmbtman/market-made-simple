// Daily check-in streak and a rotating daily challenge that pays bonus simulator capital.
// Days are the user's local calendar dates ("YYYY-MM-DD").

import { getAllProgress, PASS_SCORE, type LessonProgress } from "./lessons";
import { notifyLocalWrite } from "./local-store";
import { grantReward, hasReward } from "./rewards";
import { holdingsValue, totalValue, type SimState } from "./simulator";

export type DailyState = { last: string | null; streak: number; best: number };

export const DAILY_KEY = "stockify:daily";
export const DAILY_EVENT = "stockify:daily-changed";

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(key: string, n: number) {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y!, m! - 1, d! + n));
}

/** Read a streak from untrusted JSON (localStorage or the user's account). */
export function parseDaily(p: unknown): DailyState {
  if (!p || typeof p !== "object") return { last: null, streak: 0, best: 0 };
  const s = p as Partial<DailyState>;
  return {
    last: typeof s.last === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.last) ? s.last : null,
    streak: typeof s.streak === "number" && s.streak > 0 ? Math.floor(s.streak) : 0,
    best: typeof s.best === "number" && s.best > 0 ? Math.floor(s.best) : 0,
  };
}

export function getDaily(): DailyState {
  if (typeof window === "undefined") return parseDaily(null);
  try {
    return parseDaily(JSON.parse(localStorage.getItem(DAILY_KEY) || "null"));
  } catch {
    return parseDaily(null);
  }
}

/** The streak still alive today: checked in today or yesterday, otherwise broken (0). */
export function currentStreak(s: DailyState, today = dayKey()) {
  return s.last === today || s.last === addDays(today, -1) ? s.streak : 0;
}

/** Pure streak transition, exported for tests. */
export function nextCheckIn(s: DailyState, today: string): DailyState {
  if (s.last === today) return s;
  const streak = s.last === addDays(today, -1) ? s.streak + 1 : 1;
  return { last: today, streak, best: Math.max(s.best, streak) };
}

export function checkIn(today = dayKey()): DailyState {
  const next = nextCheckIn(getDaily(), today);
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
  notifyLocalWrite(DAILY_KEY);
  window.dispatchEvent(new Event(DAILY_EVENT));
  return next;
}

// ---------- challenges ----------

export type ChallengeCtx = { sim: SimState; lessons: Record<string, LessonProgress>; today: string };
export type Challenge = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  target: number;
  unit?: string;
  where: "/simulator" | "/learn";
  progress: (ctx: ChallengeCtx) => number;
};

const tradesToday = (ctx: ChallengeCtx) => ctx.sim.trades.filter((t) => t.at != null && dayKey(new Date(t.at)) === ctx.today);

export const CHALLENGES: Challenge[] = [
  { id: "three-trades", emoji: "⚡", title: "Active trader", description: "Make 3 trades today.", target: 3, where: "/simulator", progress: (c) => tradesToday(c).length },
  {
    id: "two-stocks", emoji: "🧺", title: "Spread it out", description: "Buy 2 different stocks today.", target: 2, where: "/simulator",
    progress: (c) => new Set(tradesToday(c).filter((t) => t.side === "buy").map((t) => t.sym)).size,
  },
  { id: "limit-fill", emoji: "🎯", title: "Name your price", description: "Get a limit order filled today.", target: 1, where: "/simulator", progress: (c) => tradesToday(c).filter((t) => t.kind === "limit").length },
  {
    id: "profit-sale", emoji: "💰", title: "Lock in a win", description: "Sell shares for a profit today.", target: 1, where: "/simulator",
    progress: (c) => tradesToday(c).filter((t) => t.side === "sell" && (t.realized ?? 0) > 0).length,
  },
  { id: "diversify", emoji: "🌐", title: "Diversify", description: "Hold 3 different stocks at the same time.", target: 3, where: "/simulator", progress: (c) => Object.keys(c.sim.holdings).length },
  {
    id: "invested", emoji: "📈", title: "Put cash to work", description: "Have at least half your portfolio invested in stocks.", target: 50, unit: "%", where: "/simulator",
    progress: (c) => Math.floor((holdingsValue(c.sim) / (totalValue(c.sim) || 1)) * 100),
  },
  {
    id: "quiz", emoji: "🧠", title: "Brain workout", description: "Pass any lesson quiz today (retakes count).", target: 1, where: "/learn",
    progress: (c) => Object.values(c.lessons).filter((p) => p.lastAttemptAt != null && dayKey(new Date(p.lastAttemptAt)) === c.today && (p.lastScore ?? 0) >= PASS_SCORE).length,
  },
];

/** Same challenge for everyone on a given date, rotating day to day. */
export function challengeFor(day: string): Challenge {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CHALLENGES[h % CHALLENGES.length]!;
}

/** Bonus grows with the streak: $250 on day 1, +$50 per day, capped at day 7 ($550). */
export const challengeReward = (streak: number) => 250 + 50 * (Math.min(Math.max(streak, 1), 7) - 1);

export const dailyRewardId = (day: string) => `daily:${day}`;
export const isClaimed = (day = dayKey()) => hasReward(dailyRewardId(day));

export function buildCtx(sim: SimState, today = dayKey()): ChallengeCtx {
  return { sim, lessons: getAllProgress(), today };
}

/** Claim today's challenge if complete. Counts as today's check-in. Returns the bonus granted (0 if none). */
export function claimChallenge(ctx: ChallengeCtx): number {
  const ch = challengeFor(ctx.today);
  if (ch.progress(ctx) < ch.target || isClaimed(ctx.today)) return 0;
  const { streak } = checkIn(ctx.today);
  const amount = challengeReward(streak);
  return grantReward({ id: dailyRewardId(ctx.today), amount, label: `Daily challenge: ${ch.title} (${streak}-day streak)` }) ? amount : 0;
}
