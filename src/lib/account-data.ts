// Converting between this browser's stockify:* stores and the user_progress row,
// and merging the two when someone signs in. Pure functions, so they can be tested.

import type { ProgressRow } from "./account-db";
import { parseDaily, type DailyState } from "./daily";
import { lessons, type LessonProgress } from "./lessons";
import { parseRewards, type Reward } from "./rewards";
import { parseState, type SimState } from "./simulator";

export type Snapshot = {
  lessons: Record<string, LessonProgress>;
  rewards: Reward[];
  daily: DailyState;
  simulator: SimState | null;
  /** When the simulator was last saved (ms), used to pick the newer portfolio. */
  simulatorAt: number | null;
};

/** Who the data in this browser belongs to: null for a guest who hasn't signed in. */
export type LocalOwner = string | null;

const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback);
const optNum = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export function parseLessons(raw: unknown): Record<string, LessonProgress> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, LessonProgress> = {};
  for (const l of lessons) {
    const p = (raw as Record<string, unknown>)[l.slug];
    if (!p || typeof p !== "object") continue;
    const r = p as Partial<Record<keyof LessonProgress, unknown>>;
    out[l.slug] = {
      slide: Math.min(num(r.slide), l.slides.length - 1),
      completed: r.completed === true,
      bestScore: Math.min(num(r.bestScore), l.quiz.length),
      attempts: num(r.attempts),
      lastScore: optNum(r.lastScore),
      lastAttemptAt: optNum(r.lastAttemptAt),
      completedAt: optNum(r.completedAt),
    };
  }
  return out;
}

export function isEmpty(s: Snapshot) {
  return Object.keys(s.lessons).length === 0 && s.rewards.length === 0 && s.daily.last === null && !hasActivity(s.simulator);
}

/** A portfolio someone has actually used, as opposed to the untouched $10,000 starter. */
export const hasActivity = (sim: SimState | null) => !!sim && (sim.trades.length > 0 || sim.orders.length > 0 || sim.appliedRewards.length > 0);

function mergeLesson(a: LessonProgress, b: LessonProgress): LessonProgress {
  const latest = (a.lastAttemptAt ?? 0) >= (b.lastAttemptAt ?? 0) ? a : b;
  const done = [a.completedAt, b.completedAt].filter((t): t is number => t != null);
  return {
    slide: Math.max(a.slide, b.slide),
    completed: a.completed || b.completed,
    bestScore: Math.max(a.bestScore, b.bestScore),
    attempts: Math.max(a.attempts, b.attempts),
    lastScore: latest.lastScore,
    lastAttemptAt: latest.lastAttemptAt,
    completedAt: done.length ? Math.min(...done) : undefined,
  };
}

export function mergeLessons(a: Record<string, LessonProgress>, b: Record<string, LessonProgress>) {
  const out: Record<string, LessonProgress> = { ...a };
  for (const [slug, p] of Object.entries(b)) {
    const mine = out[slug];
    out[slug] = mine ? mergeLesson(mine, p) : p;
  }
  return out;
}

/** Union by id, so a bonus earned on either side is kept exactly once. */
export function mergeRewards(a: Reward[], b: Reward[]) {
  const seen = new Set(a.map((r) => r.id));
  return [...a, ...b.filter((r) => !seen.has(r.id))];
}

export function mergeDaily(a: DailyState, b: DailyState): DailyState {
  const best = Math.max(a.best, b.best);
  if (a.last === b.last) return { last: a.last, streak: Math.max(a.streak, b.streak), best };
  const newer = (a.last ?? "") > (b.last ?? "") ? a : b;
  return { last: newer.last, streak: newer.streak, best };
}

/**
 * Combine what's in this browser with what's in the account.
 * - Data left behind by a different account is ignored, so nothing leaks between users.
 * - Guest progress is folded in: lessons, rewards and streaks merge.
 * - Only one portfolio can win: the account's if it has been used, unless the browser's is newer.
 */
export function mergeSnapshots(local: Snapshot, owner: LocalOwner, userId: string, remote: Snapshot): Snapshot {
  if (owner !== null && owner !== userId) return remote;
  const localSimNewer = (local.simulatorAt ?? 0) > (remote.simulatorAt ?? 0);
  const simulator =
    !hasActivity(remote.simulator) ? (local.simulator ?? remote.simulator)
    : owner === userId && localSimNewer && local.simulator ? local.simulator
    : remote.simulator;
  return {
    lessons: mergeLessons(remote.lessons, local.lessons),
    rewards: mergeRewards(remote.rewards, local.rewards),
    daily: mergeDaily(local.daily, remote.daily),
    simulator,
    simulatorAt: simulator === local.simulator ? local.simulatorAt : remote.simulatorAt,
  };
}

export function fromRow(row: Pick<ProgressRow, "lessons" | "rewards" | "streak" | "best_streak" | "last_check_in" | "simulator" | "simulator_updated_at"> | null): Snapshot {
  if (!row) return { lessons: {}, rewards: [], daily: parseDaily(null), simulator: null, simulatorAt: null };
  const at = row.simulator_updated_at ? Date.parse(row.simulator_updated_at) : NaN;
  return {
    lessons: parseLessons(row.lessons),
    rewards: parseRewards(row.rewards),
    daily: parseDaily({ last: row.last_check_in, streak: row.streak, best: row.best_streak }),
    simulator: row.simulator == null ? null : parseState(row.simulator),
    simulatorAt: Number.isFinite(at) ? at : null,
  };
}

export type ProgressUpdate = Partial<Omit<ProgressRow, "user_id" | "updated_at">>;

/** The columns to write for the given parts of a snapshot. */
export function toRow(s: Snapshot, parts: ReadonlySet<keyof Snapshot> | "all" = "all"): ProgressUpdate {
  const has = (k: keyof Snapshot) => parts === "all" || parts.has(k);
  const row: ProgressUpdate = {};
  if (has("lessons")) {
    row.lessons = s.lessons;
    row.completed_lessons = lessons.filter((l) => s.lessons[l.slug]?.completed).map((l) => l.slug);
  }
  if (has("rewards")) row.rewards = s.rewards;
  if (has("daily")) {
    row.streak = s.daily.streak;
    row.best_streak = s.daily.best;
    row.last_check_in = s.daily.last;
  }
  if (has("simulator") || has("simulatorAt")) {
    row.simulator = s.simulator;
    row.simulator_updated_at = s.simulatorAt != null ? new Date(s.simulatorAt).toISOString() : null;
  }
  return row;
}
