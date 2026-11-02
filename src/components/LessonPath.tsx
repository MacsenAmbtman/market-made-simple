import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Coins, Flame, Lock, Monitor, Repeat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  courseLessons, getAllProgress, getLesson, getPracticeEntry, isRewarded, isUnlockedOnPhone, lessonXp, practiceXp, totalXp, units, XP,
  type Lesson, type LessonProgress,
} from "@/lib/lessons";
import { LOCKED_MESSAGE, takeLockedFlash } from "@/lib/phone-lesson";
import { ACCOUNT_SYNCED_EVENT } from "@/lib/local-store";
import { useDaily } from "@/hooks/use-daily";
import { PhoneDailyGoal } from "@/components/PhoneDailyGoal";
import { fmt } from "@/lib/simulator";

// Phone home: "the rising line" — a thin vertical trail like a stock chart, filled green as lessons are finished.

/** One stretch of the trail: a segment of the vertical line plus an optional tick into the row. */
function Trail({ filled, tick = true, children }: { filled: boolean; tick?: boolean; children: ReactNode }) {
  return (
    <li className="relative py-1.5 pl-9">
      <span aria-hidden className={`absolute left-3 top-0 bottom-0 w-0.5 ${filled ? "bg-primary" : "bg-border"}`} />
      {tick && <span aria-hidden className={`absolute left-3 top-1/2 h-0.5 w-6 ${filled ? "bg-primary" : "bg-border"}`} />}
      {children}
    </li>
  );
}

/** Small rising-chart motif for unit headers. */
function RisingMotif({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 48 16" className={`h-4 w-12 shrink-0 ${active ? "text-primary" : "text-muted-foreground/50"}`} aria-hidden>
      <polyline points="1,14 10,10 17,12 26,6 33,8 47,2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LessonPath() {
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [practice, setPractice] = useState<LessonProgress | undefined>(undefined);
  const [rewarded, setRewarded] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const { streak } = useDaily();

  useEffect(() => {
    const load = () => {
      setProgress(getAllProgress());
      setPractice(getPracticeEntry());
      setRewarded(courseLessons.filter((l) => isRewarded(l.slug)).map((l) => l.slug));
    };
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
  const current = ready ? courseLessons.find((l) => !progress[l.slug]?.completed) : undefined;
  const xp = totalXp(progress, practiceXp(practice));

  // Bring the current lesson into view once progress is known.
  useEffect(() => {
    if (!ready || !current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    currentRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    // Only on first load of the path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const lockedClick = (e: React.MouseEvent) => { e.preventDefault(); setMessage(LOCKED_MESSAGE); };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">Your path</h1>
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

      <div className="mt-3"><PhoneDailyGoal progress={progress} practice={practice} /></div>

      {ready && doneCount > 0 && (
        <Link to="/practice" className="mt-2 flex min-h-11 items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm font-semibold transition active:scale-[0.98] motion-reduce:transform-none">
          <Repeat className="h-4 w-4 text-primary" aria-hidden />
          <span className="flex-1">Keep practising</span>
          <span className="text-xs font-normal text-muted-foreground">5 quick questions</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Link>
      )}

      <div aria-live="polite" className="sticky top-20 z-10 mt-2 h-0">
        {message && (
          <p className="mx-auto w-fit rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-card animate-in fade-in slide-in-from-top-2 motion-reduce:animate-none">
            {message}
          </p>
        )}
      </div>

      <ol className="mt-4">
        {units.map((unit, ui) => {
          const unitLessons = unit.slugs.map((s) => getLesson(s)).filter((l): l is Lesson => !!l);
          const unitDone = unitLessons.filter((l) => progress[l.slug]?.completed).length;
          const prevSlug = ui === 0 ? undefined : units[ui - 1]!.slugs.at(-1);
          const headerFilled = prevSlug ? !!progress[prevSlug]?.completed : doneCount > 0;
          return [
            <Trail key={`u${ui}`} filled={headerFilled} tick={false}>
              <div className={`flex items-center gap-2 ${ui > 0 ? "pt-5" : ""} pb-1`}>
                <RisingMotif active={unitDone > 0} />
                <h2 className="min-w-0 flex-1 truncate text-base font-bold">Unit {ui + 1}: {unit.name}</h2>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{unitDone}/{unitLessons.length}</span>
              </div>
            </Trail>,
            ...unitLessons.map((l) => {
              const p = progress[l.slug];
              const done = !!p?.completed;
              const isCurrent = current?.slug === l.slug;
              const locked = ready && !isUnlockedOnPhone(l.slug, progress);
              if (isCurrent) {
                const started = (p?.slide ?? 0) > 0 || (p?.attempts ?? 0) > 0;
                return (
                  <Trail key={l.slug} filled={false}>
                    <div ref={currentRef} className="scroll-mt-24 rounded-2xl border-2 border-primary bg-card p-4 shadow-glow">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Up next · {l.minutes} min</p>
                      <h3 className="mt-1 text-xl font-bold leading-tight">{l.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{l.blurb}</p>
                      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                        <span className="flex items-center gap-1"><Sparkles className="h-4 w-4 text-primary" aria-hidden />Up to {XP.first + XP.perfect} XP</span>
                        <span className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-primary" aria-hidden />
                          {rewarded.includes(l.slug) ? "Bonus cash collected" : `+${fmt(l.reward)} bonus cash`}
                        </span>
                      </p>
                      <Button asChild size="lg" className="mt-4 h-12 w-full text-base">
                        <Link to="/learn/$slug" params={{ slug: l.slug }}>{started ? "Continue" : "Start"} <ArrowRight /></Link>
                      </Button>
                    </div>
                  </Trail>
                );
              }
              return (
                <Trail key={l.slug} filled={done}>
                  <Link
                    to="/learn/$slug"
                    params={{ slug: l.slug }}
                    onClick={locked ? lockedClick : undefined}
                    aria-label={`${l.title}${done ? " (completed)" : locked ? " (locked)" : ""}`}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border bg-card px-3 py-2 transition active:scale-[0.98] motion-reduce:transform-none ${locked ? "opacity-60" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-semibold ${locked ? "text-muted-foreground" : ""}`}>{l.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{l.blurb}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end text-xs tabular-nums text-muted-foreground">
                      {done ? (
                        <>
                          <Check className="h-4 w-4 text-primary" aria-hidden />
                          <span className="text-primary">+{lessonXp(p, l)} XP</span>
                        </>
                      ) : (
                        <>
                          {locked && <Lock className="h-4 w-4" aria-hidden />}
                          <span>{l.minutes} min</span>
                        </>
                      )}
                    </span>
                  </Link>
                </Trail>
              );
            }),
            ...(ui === 0
              ? [
                  <Trail key="paper" filled={unitDone === unitLessons.length}>
                    <Link
                      to="/simulator"
                      aria-label="First paper trade, on your computer"
                      className="flex min-h-14 items-center gap-3 rounded-xl border border-dashed px-3 py-2 transition active:scale-[0.98] motion-reduce:transform-none"
                    >
                      <Monitor className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">First paper trade</span>
                        <span className="block truncate text-xs text-muted-foreground">Optional · on your computer</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </Trail>,
                ]
              : []),
          ];
        })}
        <Trail filled={ready && doneCount === courseLessons.length}>
          {ready && doneCount > 0 ? (
            <Link to="/practice" className="block rounded-2xl border bg-card p-4 transition active:scale-[0.98] motion-reduce:transform-none">
              <p className="flex items-center gap-2 font-bold"><Repeat className="h-5 w-5 text-primary" aria-hidden />Keep practising</p>
              <p className="mt-1 text-sm text-muted-foreground">A quick round of 5 questions from lessons you've finished. Earn up to 20 XP a day.</p>
            </Link>
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-muted-foreground">
              <p className="flex items-center gap-2 font-bold"><Repeat className="h-5 w-5" aria-hidden />Keep practising</p>
              <p className="mt-1 text-sm">Finish your first lesson to unlock endless practice.</p>
            </div>
          )}
        </Trail>
      </ol>
    </div>
  );
}
