import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Lock, LineChart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseLessons, getAllProgress, type LessonProgress } from "@/lib/lessons";

// Phone home: a Duolingo-style vertical path. Nodes zig-zag; the next unfinished lesson glows.
const OFFSETS = ["translate-x-0", "translate-x-12", "translate-x-0", "-translate-x-12"];

export function LessonPath() {
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  useEffect(() => setProgress(getAllProgress()), []);

  const doneCount = courseLessons.filter((l) => progress[l.slug]?.completed).length;
  const current = courseLessons.find((l) => !progress[l.slug]?.completed);
  const allDone = !current;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Unit 1: Stock basics</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{doneCount}/{courseLessons.length}</span>
      </div>
      <ol className="mt-6 flex flex-col items-center gap-6">
        {courseLessons.map((l, idx) => {
          const done = !!progress[l.slug]?.completed;
          const isCurrent = current?.slug === l.slug;
          const locked = !done && !isCurrent;
          return (
            <li key={l.slug} className={`flex flex-col items-center ${OFFSETS[idx % OFFSETS.length]}`}>
              {isCurrent && (
                <span className="mb-2 rounded-lg border bg-card px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-card">Start</span>
              )}
              <Link
                to="/learn/$slug"
                params={{ slug: l.slug }}
                aria-label={`${l.title}${done ? " (completed)" : locked ? " (locked)" : ""}`}
                className={`grid h-20 w-20 place-items-center rounded-full border-b-4 transition-transform active:translate-y-1 active:border-b-0 ${
                  done ? "border-primary/60 bg-primary text-primary-foreground"
                  : isCurrent ? "border-primary/60 bg-primary text-primary-foreground shadow-glow ring-4 ring-primary/25"
                  : "border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-8 w-8" /> : locked ? <Lock className="h-7 w-7" /> : <Star className="h-8 w-8" />}
              </Link>
              <span className={`mt-2 max-w-40 text-center text-sm font-semibold ${locked ? "text-muted-foreground" : ""}`}>{l.title}</span>
            </li>
          );
        })}
        <li className="flex flex-col items-center">
          <Link
            to="/simulator"
            aria-label="Your first paper trade"
            className={`grid h-20 w-20 place-items-center rounded-full border-b-4 ${allDone ? "border-primary/60 bg-primary text-primary-foreground shadow-glow" : "border-border bg-card text-muted-foreground"}`}
          >
            <LineChart className="h-8 w-8" />
          </Link>
          <span className="mt-2 text-center text-sm font-semibold">First paper trade</span>
        </li>
      </ol>
      <Button asChild size="lg" className="mt-8 h-14 w-full text-base shadow-glow">
        {current ? (
          <Link to="/learn/$slug" params={{ slug: current.slug }}>
            {doneCount === 0 ? "Start Free Lesson 1" : "Continue learning"}
          </Link>
        ) : (
          <Link to="/simulator">Make your first paper trade</Link>
        )}
      </Button>
    </div>
  );
}
