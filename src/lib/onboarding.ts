// Phone opening question: shown once, then skipped. Uses the same saved flag as the old setup quiz.

import { store } from "./local-store";

export const ONBOARDING_KEY = "stockify:onboarding";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return false;
  try { return store.get(ONBOARDING_KEY) === "done"; } catch { return false; }
}
export function markOnboardingDone() {
  try { store.set(ONBOARDING_KEY, "done"); } catch { /* storage blocked */ }
}
export function resetOnboarding() {
  try { store.remove(ONBOARDING_KEY); } catch { /* storage blocked */ }
}

/** Phones skip the opening question if it was answered before (or the old setup quiz was done), or there is any lesson progress. */
export function skipFirstQuestion(done: boolean, progress: Record<string, { completed?: boolean; slide?: number; attempts?: number } | undefined>): boolean {
  if (done) return true;
  return Object.entries(progress).some(([slug, p]) => !slug.startsWith("__") && !!p && (!!p.completed || (p.slide ?? 0) > 0 || (p.attempts ?? 0) > 0));
}
