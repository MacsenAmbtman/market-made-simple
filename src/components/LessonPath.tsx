import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Flame, Lock, LineChart, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseLessons, getAllProgress, isUnlockedOnPhone, totalXp, upcoming, type LessonProgress } from "@/lib/lessons";
import { LOCKED_MESSAGE, takeLockedFlash } from "@/lib/phone-lesson";
import { ACCOUNT_SYNCED_EVENT } from "@/lib/local-store";
import { useDaily } from "@/hooks/use-daily";
import { PhoneDailyGoal } from "@/components/PhoneDailyGoal";

// Phone home: a Duolingo-style vertical path. Nodes zig-zag; the next unfinished lesson glows.
const OFFSETS = ["translate-x-0", "translate-x-12", "translate-x-0", "-translate-x-12"];
const NODE = "grid h-20 w-20 place-items-center rounded-full border-b-4 transition-transform active:translate-y-1 active:border-b-0 motion-reduce:transform-none";

export function LessonPath() {
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { streak } = useDaily();

  useEffect(() => {
    const load = () => setProgress(getAllProgress());
    load();
    setReady(true);
    if (takeLockedFlash()) setMessage(LOCKED_MESSAGE);
    window.addEventListener(ACCOUNT_SYNCED_EVENT, load);
    return () => window.removeEventListener(ACCOUNT_SYNCED_EVENT, load);
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 2800);
    return () => clearTimeout(id);
  }, [message]);

  const doneCount = courseLessons.filter((l) => progress[l.slug]?.completed).length;
  const current = courseLessons.find((l) => !progress[l.slug]?.completed);
  const allDone = ready && !current;
  const xp = totalXp(progress);

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">Unit 1: Stock basics</h1>
          <p className="text-sm text-muted-foreground tabular-nums">{doneCount} of {courseLessons.length} lessons done</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold tabular-nums">
          <span className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1" aria-label={`${xp} XP`}>
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />{xp} XP
          </span>
          <span className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1" aria-label={`${streak}-day streak`}>
            <Flame className={`h-4 w-4 ${streak ? "text-orange-400" : "text-muted-foreground"}`} aria-hidden />{streak}
          </span>
        </div>
      </div>

      <div className="mt-4"><PhoneDailyGoal progress={progress} /></div>

      <div aria-live="polite" className="sticky top-20 z-10 mt-3 h-0">
        {message && (
          <p className="mx-auto w-fit rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-card animate-in fade-in slide-in-from-top-2 motion-reduce:animate-none">
            {message}
          </p>
        )}
      </div>

      <ol className="mt-8 flex flex-col items-center gap-6">
        {courseLessons.map((l, idx) => {
          const done = !!progress[l.slug]?.completed;
          const isCurrent = current?.slug === l.slug;
          const locked = !isUnlockedOnPhone(l.slug, progress);
          return (
            <li key={l.slug} className={`flex flex-col items-center ${OFFSETS[idx % OFFSETS.length]}`}>
              {isCurrent && (
                <span className="mb-2 rounded-lg border bg-card px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-card">Start</span>
              )}
              <Link
                to="/learn/$slug"
                params={{ slug: l.slug }}
                onClick={(e) => { if (locked) { e.preventDefault(); setMessage(LOCKED_MESSAGE); } }}
                aria-label={`${l.title}${done ? " (completed)" : locked ? " (locked)" : ""}`}
                className={`${NODE} ${
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
        {upcoming.map((u, idx) => (
          <li key={u.title} className={`flex flex-col items-center ${OFFSETS[(courseLessons.length + idx) % OFFSETS.length]}`}>
            <div aria-label={`${u.title} (coming soon)`} className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground">
              <Lock className="h-6 w-6" aria-hidden />
            </div>
            <span className="mt-2 max-w-40 text-center text-sm font-semibold text-muted-foreground">{u.title}</span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Coming soon</span>
          </li>
        ))}
        <li className="flex flex-col items-center">
          <Link
            to="/simulator"
            aria-label="Your first paper trade"
            className={`${NODE} ${allDone ? "border-primary/60 bg-primary text-primary-foreground shadow-glow" : "border-border bg-card text-muted-foreground"}`}
          >
            <LineChart className="h-8 w-8" />
          </Link>
          <span className="mt-2 text-center text-sm font-semibold">First paper trade</span>
          <span className="text-xs text-muted-foreground">On your computer</span>
        </li>
      </ol>
      <Button asChild size="lg" className="mt-8 h-14 w-full text-base shadow-glow">
        {current || !ready ? (
          <Link to="/learn/$slug" params={{ slug: current?.slug ?? courseLessons[0]!.slug }}>
            {doneCount === 0 ? "Start Lesson 1" : "Continue learning"}
          </Link>
        ) : (
          <Link to="/learn/$slug" params={{ slug: courseLessons[0]!.slug }}>Replay a lesson</Link>
        )}
      </Button>
    </div>
  );
}
