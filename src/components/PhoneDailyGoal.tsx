import { Link } from "@tanstack/react-router";
import { Check, Target } from "lucide-react";
import { phoneGoal } from "@/lib/phone-lesson";
import type { LessonProgress } from "@/lib/lessons";

/** Phone daily goal: finish one lesson today (or replay one once everything is done). */
export function PhoneDailyGoal({ progress, practice }: { progress: Record<string, LessonProgress>; practice?: LessonProgress | undefined }) {
  const goal = phoneGoal(progress, undefined, practice);
  const title = goal.mode === "finish" ? "Finish 1 lesson today" : "Replay a lesson";
  return (
    <Link
      to="/learn/$slug"
      params={{ slug: goal.slug }}
      className="flex min-h-16 items-center gap-3 rounded-2xl border bg-card px-4 py-3 transition active:scale-[0.98] motion-reduce:transform-none"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${goal.done ? "bg-primary text-primary-foreground" : "bg-accent text-primary"}`}>
        {goal.done ? <Check className="h-5 w-5" /> : <Target className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily goal</span>
        <span className="block truncate font-semibold">{title}</span>
      </span>
      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{goal.done ? "Done" : "0 / 1"}</span>
    </Link>
  );
}
