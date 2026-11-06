import { courseLessons, type LessonProgress } from "./lessons";

/** Where the desktop homepage buttons go. Kept as data so tests can check them. */
export const HOME_CTAS = {
  primary: { label: "Start practising", to: "/learn/$slug", slug: "what-is-a-stock" },
  secondary: { label: "Try the simulator", to: "/simulator" },
} as const;

/** For returning visitors with progress: the next unfinished course lesson (or the last one). Null for first-timers. */
export function resumeTarget(progress: Record<string, LessonProgress>): { slug: string; title: string } | null {
  const touched = courseLessons.some((l) => progress[l.slug]?.completed || (progress[l.slug]?.attempts ?? 0) > 0);
  if (!touched) return null;
  const next = courseLessons.find((l) => !progress[l.slug]?.completed) ?? courseLessons[courseLessons.length - 1]!;
  return { slug: next.slug, title: next.title };
}
