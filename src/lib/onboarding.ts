// Phone setup quiz: shown once, then skipped. Retaking from Progress clears the flag.

export const ONBOARDING_KEY = "stockify:onboarding";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(ONBOARDING_KEY) === "done"; } catch { return false; }
}
export function markOnboardingDone() {
  try { localStorage.setItem(ONBOARDING_KEY, "done"); } catch { /* storage blocked */ }
}
export function resetOnboarding() {
  try { localStorage.removeItem(ONBOARDING_KEY); } catch { /* storage blocked */ }
}
