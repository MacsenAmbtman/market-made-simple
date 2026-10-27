// Keeps this browser's stockify:* stores and the signed-in user's user_progress row in step.
// localStorage stays the working copy (offline-friendly, instant); the account is the backup
// that follows the user across devices. Browser-only: call from effects, never during SSR.

import { supabase } from "@/integrations/supabase/client";
import { accountDb } from "./account-db";
import { fromRow, isEmpty, mergeSnapshots, toRow, type LocalOwner, type Snapshot } from "./account-data";
import { DAILY_EVENT, DAILY_KEY, getDaily } from "./daily";
import { getAllProgress, LESSONS_KEY } from "./lessons";
import { ACCOUNT_SYNCED_EVENT, LOCAL_WRITE_EVENT } from "./local-store";
import { getRewards, REWARDS_EVENT, REWARDS_KEY } from "./rewards";
import { loadState, SIM_KEY } from "./simulator";

const META_KEY = "stockify:account";
const QUICK_PUSH_MS = 2_000;
// The market ticks every 1.5s, so portfolio-only changes are batched more coarsely.
const SIM_PUSH_MS = 15_000;

const PART_BY_KEY: Record<string, keyof Snapshot> = {
  [LESSONS_KEY]: "lessons",
  [REWARDS_KEY]: "rewards",
  [DAILY_KEY]: "daily",
  [SIM_KEY]: "simulator",
};

type Meta = { owner: LocalOwner; simulatorAt: number | null };

function readMeta(): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) || "null") as Partial<Meta> | null;
    return { owner: typeof m?.owner === "string" ? m.owner : null, simulatorAt: typeof m?.simulatorAt === "number" ? m.simulatorAt : null };
  } catch {
    return { owner: null, simulatorAt: null };
  }
}

function writeMeta(m: Meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* storage blocked */ }
}

function readLocal(): Snapshot {
  // Only stored lessons count; getAllProgress pads every lesson with blanks.
  const stored = Object.fromEntries(Object.entries(getAllProgress()).filter(([, p]) => p.attempts > 0 || p.completed || p.slide > 0));
  return { lessons: stored, rewards: getRewards(), daily: getDaily(), simulator: loadState(), simulatorAt: readMeta().simulatorAt };
}

function writeLocal(s: Snapshot) {
  const set = (key: string, value: unknown) => {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage blocked */ }
  };
  set(LESSONS_KEY, s.lessons);
  set(REWARDS_KEY, s.rewards);
  set(DAILY_KEY, s.daily);
  set(SIM_KEY, s.simulator);
}

function announce() {
  window.dispatchEvent(new Event(ACCOUNT_SYNCED_EVENT));
  window.dispatchEvent(new Event(REWARDS_EVENT));
  window.dispatchEvent(new Event(DAILY_EVENT));
}

/** Wipe account data from this browser (on sign-out), leaving a fresh guest session. */
export function clearLocalAccountData() {
  for (const key of [...Object.keys(PART_BY_KEY), META_KEY, "stockify-completed"]) {
    try { localStorage.removeItem(key); } catch { /* storage blocked */ }
  }
  announce();
}

export type AccountSync = {
  /** Push anything not yet saved to the account. */
  flush: () => Promise<void>;
  stop: () => Promise<void>;
};

/** Pull and merge the user's saved data, then keep pushing local changes until stopped. */
export function startAccountSync(userId: string, onError: (e: unknown) => void = console.error): AccountSync {
  const db = accountDb(supabase);
  const dirty = new Set<keyof Snapshot>();
  let ready = false; // never push before the account's copy has been merged in
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let due = Infinity;
  let inFlight: Promise<void> = Promise.resolve();

  const push = (parts: Set<keyof Snapshot> | "all") =>
    (inFlight = inFlight.then(async () => {
      const { error } = await db.from("user_progress").upsert({ user_id: userId, ...toRow(readLocal(), parts) }, { onConflict: "user_id" });
      if (error) throw error;
    }).catch((e: unknown) => {
      // Re-queue so the next change or flush retries it.
      if (parts !== "all") parts.forEach((p) => dirty.add(p));
      onError(e);
    }));

  const flush = async () => {
    clearTimeout(timer);
    timer = undefined;
    due = Infinity;
    if (!ready || dirty.size === 0) return inFlight;
    const parts = new Set(dirty);
    dirty.clear();
    return push(parts);
  };

  const schedule = (delay: number) => {
    const at = Date.now() + delay;
    if (at >= due) return;
    clearTimeout(timer);
    due = at;
    timer = setTimeout(() => void flush(), delay);
  };

  const onWrite = (e: Event) => {
    const part = PART_BY_KEY[(e as CustomEvent<string>).detail];
    if (!part || stopped) return;
    if (part === "simulator") writeMeta({ ...readMeta(), simulatorAt: Date.now() });
    dirty.add(part);
    if (ready) schedule(part === "simulator" ? SIM_PUSH_MS : QUICK_PUSH_MS);
  };
  const onHide = () => {
    if (document.visibilityState === "hidden") void flush();
  };

  window.addEventListener(LOCAL_WRITE_EVENT, onWrite);
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);

  const pull = async () => {
    const { data, error } = await db
      .from("user_progress")
      .select("lessons, rewards, streak, best_streak, last_check_in, simulator, simulator_updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (stopped) return;
    const remote = fromRow(data);
    const { owner } = readMeta();
    const merged = mergeSnapshots(readLocal(), owner, userId, remote);
    writeLocal(merged);
    writeMeta({ owner: userId, simulatorAt: merged.simulatorAt });
    announce();
    ready = true;
    // Upload whatever the account didn't already have (guest progress, or a first sign-in).
    if (!data || !isEmpty(merged)) await push("all");
    dirty.clear();
  };

  void pull().catch((e: unknown) => {
    onError(e);
    // One retry; until a pull succeeds, local changes stay local rather than overwrite the account.
    if (!stopped) setTimeout(() => void pull().catch(onError), 5_000);
  });

  return {
    flush,
    stop: async () => {
      await flush();
      stopped = true;
      window.removeEventListener(LOCAL_WRITE_EVENT, onWrite);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    },
  };
}
