// Ledger of bonus virtual capital earned outside the simulator (e.g. passing a lesson quiz).
// The simulator applies each reward once; it never reads lesson state directly.

import { notifyLocalWrite } from "./local-store";

export type Reward = { id: string; amount: number; label: string; t: number };

export const REWARDS_KEY = "stockify:rewards";
export const REWARDS_EVENT = "stockify:rewards-changed"; // same-tab notification

/** Keep only well-formed rewards from untrusted JSON (localStorage or the user's account). */
export function parseRewards(parsed: unknown): Reward[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (r): r is Reward => !!r && typeof r.id === "string" && typeof r.amount === "number" && r.amount > 0 && typeof r.label === "string",
  );
}

export function getRewards(): Reward[] {
  if (typeof window === "undefined") return [];
  try {
    return parseRewards(JSON.parse(localStorage.getItem(REWARDS_KEY) || "[]"));
  } catch {
    return [];
  }
}

export const hasReward = (id: string) => getRewards().some((r) => r.id === id);
export const totalRewards = () => getRewards().reduce((sum, r) => sum + r.amount, 0);

/** Grant a reward once. Returns false if `id` was already granted. */
export function grantReward(reward: Omit<Reward, "t">): boolean {
  if (typeof window === "undefined") return false;
  const all = getRewards();
  if (all.some((r) => r.id === reward.id)) return false;
  try {
    localStorage.setItem(REWARDS_KEY, JSON.stringify([...all, { ...reward, t: Date.now() }]));
  } catch {
    return false;
  }
  notifyLocalWrite(REWARDS_KEY);
  window.dispatchEvent(new Event(REWARDS_EVENT));
  return true;
}
