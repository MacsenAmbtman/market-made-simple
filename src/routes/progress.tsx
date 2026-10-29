import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { getAllProgress, isRewarded, lessons, type LessonProgress } from "@/lib/lessons";
import { totalRewards } from "@/lib/rewards";
import { fmt } from "@/lib/simulator";
import { CheckCircle2, Circle, Coins } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — Stockify Learn" },
      { name: "description", content: "Track the investing lessons you've completed." },
      { property: "og:title", content: "My Progress — Stockify Learn" },
      { property: "og:description", content: "Your Stockify learning progress." },
    ],
  }),
  component: MyProgress,
});

function MyProgress() {
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [rewarded, setRewarded] = useState<string[]>([]);
  const [earned, setEarned] = useState(0);
  useEffect(() => {
    setProgress(getAllProgress());
    setRewarded(lessons.filter((l) => isRewarded(l.slug)).map((l) => l.slug));
    setEarned(totalRewards());
  }, []);

  const done = lessons.filter((l) => progress[l.slug]?.completed).length;
  const pct = Math.round((done / lessons.length) * 100);
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">My Progress</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <p className="font-display text-5xl font-bold text-primary">{pct}%</p>
          <p className="text-sm text-muted-foreground">{done} of {lessons.length} modules complete</p>
          <Progress value={pct} className="mt-4 h-2.5" />
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <p className="flex items-center gap-2 font-display text-5xl font-bold"><Coins className="h-9 w-9 text-primary" />{fmt(earned)}</p>
          <p className="text-sm text-muted-foreground">Bonus capital earned for the Paper Simulator</p>
          <Link to="/simulator" className="mt-4 inline-block text-sm text-primary hover:underline">Put it to work →</Link>
        </div>
      </div>
      <ul className="mt-6 space-y-2">
        {lessons.map((l) => {
          const p = progress[l.slug];
          return (
            <li key={l.slug}>
              <Link to="/learn/$slug" params={{ slug: l.slug }} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 transition hover:border-primary/50">
                {p?.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                <span className="font-medium">{l.title}</span>
                <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                  {p && p.attempts > 0 && <span>Best {p.bestScore}/{l.quiz.length} · {p.attempts} {p.attempts === 1 ? "attempt" : "attempts"}</span>}
                  <span className={rewarded.includes(l.slug) ? "text-primary" : ""}>{rewarded.includes(l.slug) ? `+${fmt(l.reward)} earned` : `${fmt(l.reward)} available`}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
