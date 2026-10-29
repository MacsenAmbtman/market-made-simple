import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DailyChallenge } from "@/components/daily/DailyChallenge";
import { Progress } from "@/components/ui/progress";
import { getAllProgress, isRewarded, lessons, upcoming, type LessonProgress } from "@/lib/lessons";
import { REWARDS_EVENT, totalRewards } from "@/lib/rewards";
import { fmt } from "@/lib/simulator";
import { CheckCircle2, Clock, Coins, Lock } from "lucide-react";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learn — Stockify Learn" },
      { name: "description", content: "Your beginner investing lesson modules and progress." },
      { property: "og:title", content: "Learn — Stockify Learn" },
      { property: "og:description", content: "Bite-sized investing lessons." },
    ],
  }),
  component: Learn,
});

function Learn() {
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [rewarded, setRewarded] = useState<string[]>([]);
  const [earned, setEarned] = useState(0);
  useEffect(() => {
    setProgress(getAllProgress());
    setRewarded(lessons.filter((l) => isRewarded(l.slug)).map((l) => l.slug));
    const refreshEarned = () => setEarned(totalRewards());
    refreshEarned();
    window.addEventListener(REWARDS_EVENT, refreshEarned);
    return () => window.removeEventListener(REWARDS_EVENT, refreshEarned);
  }, []);

  const done = lessons.filter((l) => progress[l.slug]?.completed).length;
  const pct = Math.round((done / lessons.length) * 100);
  const available = lessons.reduce((s, l) => s + l.reward, 0);
  const nextUp = lessons.find((l) => !progress[l.slug]?.completed);

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="mt-1 text-muted-foreground">
        {nextUp ? <>Up next: <Link to="/learn/$slug" params={{ slug: nextUp.slug }} className="text-primary hover:underline">{nextUp.title}</Link></> : "You've finished every module — nice work!"}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex justify-between text-sm"><span className="font-medium">Course progress</span><span className="text-primary">{done}/{lessons.length} modules</span></div>
          <Progress value={pct} className="mt-3 h-2.5" />
        </div>
        <Link to="/simulator" className="rounded-2xl border bg-card p-5 shadow-card transition hover:border-primary/50">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Coins className="h-4 w-4 text-primary" />Bonus capital earned</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{fmt(earned)} <span className="text-sm font-normal text-muted-foreground">of {fmt(available)}</span></p>
        </Link>
      </div>

      <div className="mt-4">
        <DailyChallenge />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l, i) => {
          const p = progress[l.slug];
          const status = p?.completed ? `Best score ${p.bestScore}/${l.quiz.length}` : p && p.slide > 0 ? `Slide ${p.slide + 1} of ${l.slides.length}` : `${l.slides.length} slides · ${l.quiz.length}-question quiz`;
          return (
            <Link key={l.slug} to="/learn/$slug" params={{ slug: l.slug }} className="group flex flex-col rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/50">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-primary">Module {i + 1}</span>
                {p?.completed ? <CheckCircle2 className="h-5 w-5 text-primary" aria-label="Completed" /> : null}
              </div>
              <h3 className="mt-3 text-xl font-bold group-hover:text-primary">{l.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{l.blurb}</p>
              <p className="mt-2 text-xs text-muted-foreground">{status}</p>
              <div className="mt-auto flex items-center justify-between pt-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{l.minutes} min</span>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${rewarded.includes(l.slug) ? "text-muted-foreground" : "bg-accent text-accent-foreground"}`}>
                  <Coins className="h-3 w-3" />
                  {rewarded.includes(l.slug) ? `${fmt(l.reward)} earned` : `+${fmt(l.reward)}`}
                </span>
              </div>
            </Link>
          );
        })}
        {upcoming.map((l) => (
          <div key={l.title} className="flex flex-col rounded-2xl border border-dashed p-5 opacity-70">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Upcoming</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Coming soon</span>
            </div>
            <h3 className="mt-3 text-xl font-bold">{l.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{l.blurb}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
