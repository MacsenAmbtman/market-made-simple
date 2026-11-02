// "Save your streak" prompt for signed-out phone learners. It appears after the celebration
// for Lesson 1, once more after Lesson 3, and then never again on its own. It never blocks
// learning: "Not now" always carries on to the next lesson.

import { courseLessons } from "./lessons";

const SEEN_KEY = "stockify:save-prompt-seen";

/** Lessons whose first pass offers the prompt (Lesson 1 and Lesson 3 of the investing course). */
export const SAVE_PROMPT_LESSONS: readonly string[] = [courseLessons[0]!.slug, courseLessons[2]!.slug];

export function shouldShowSavePrompt(input: { slug: string; passed: boolean; signedOut: boolean; seen: readonly string[] }): boolean {
  if (!input.passed || !input.signedOut) return false;
  if (!SAVE_PROMPT_LESSONS.includes(input.slug)) return false;
  return !input.seen.includes(input.slug);
}

export function readSavePromptSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function markSavePromptSeen(slug: string) {
  try {
    const seen = readSavePromptSeen();
    if (!seen.includes(slug)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, slug]));
  } catch {
    // Storage blocked (private mode, some in-app browsers): the prompt may show again, never breaks.
  }
}

/** Where sign-up goes afterwards. Only known in-app paths are accepted. */
export const AFTER_SIGNUP_PATHS = ["/learn"] as const;
export type AfterSignup = (typeof AFTER_SIGNUP_PATHS)[number];
export function parseNext(raw: unknown): AfterSignup | undefined {
  return AFTER_SIGNUP_PATHS.find((p) => p === raw);
}
