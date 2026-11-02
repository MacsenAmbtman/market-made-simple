import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { courseLessons, getAllProgress, isRewarded, lessons, getPracticeEntry, practiceXp, scoreOutOf, totalXp, type LessonProgress } from "@/lib/lessons";
import { totalRewards } from "@/lib/rewards";
import { resetOnboarding } from "@/lib/onboarding";
import { fmt } from "@/lib/simulator";
import { CheckCircle2, Circle, Coins, RotateCcw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — Stockify Learn" },
      { name: "description", content: "Track the investing lessons you've completed." },
      { property: "og:title", content: "My Progress — Stockify Learn" },
      { property: "og:description", content: "Your Stockify learning progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyProgress,
});

function MyProgress() {
  const navigate = useNavigate();
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
  // Phones only count the investing course; day trading lives on the computer.
  const phoneDone = courseLessons.filter((l) => progress[l.slug]?.completed).length;
  const phonePct = Math.round((phoneDone / courseLessons.length) * 100);
  const xp = totalXp(progress, practiceXp(getPracticeEntry()));

  const retakeQuiz = () => {
    resetOnboarding();
    void navigate({ to: "/" });
  };

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">My Progress</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <p className="font-display text-5xl font-bold text-primary">
            <span className="md:hidden">{phonePct}%</span><span className="hidden md:inline">{pct}%</span>
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="md:hidden">{phoneDone} of {courseLessons.length} lessons complete</span>
            <span className="hidden md:inline">{done} of {lessons.length} modules complete</span>
          </p>
          <Progress value={pct} className="mt-4 hidden h-2.5 md:block" />
          <Progress value={phonePct} className="mt-4 h-2.5 md:hidden" />
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <p className="flex items-center gap-2 font-display text-5xl font-bold"><Sparkles className="h-9 w-9 text-primary" />{xp}</p>
          <p className="text-sm text-muted-foreground">XP earned from lessons</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <p className="flex items-center gap-2 font-display text-4xl font-bold sm:text-5xl"><Coins className="h-9 w-9 shrink-0 text-primary" />{fmt(earned)}</p>
          <p className="text-sm text-muted-foreground">Bonus capital earned for the Paper Simulator</p>
          <Link to="/simulator" className="mt-4 hidden text-sm text-primary hover:underline md:inline-block">Put it to work →</Link>
        </div>
      </div>
      <ul className="mt-6 space-y-2">
        {lessons.map((l) => {
          const p = progress[l.slug];
          return (
            <li key={l.slug} className={l.track ? "max-md:hidden" : undefined}>
              <Link to="/learn/$slug" params={{ slug: l.slug }} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-card px-4 py-3 transition hover:border-primary/50">
                {p?.completed ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
                <span className="min-w-0 font-medium">{l.title}</span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground max-md:w-full max-md:pl-8 md:ml-auto">
                  {p && p.attempts > 0 && <span>Best {p.bestScore}/{scoreOutOf(p, l)} · {p.attempts} {p.attempts === 1 ? "attempt" : "attempts"}</span>}
                  <span className={rewarded.includes(l.slug) ? "text-primary" : ""}>{rewarded.includes(l.slug) ? `+${fmt(l.reward)} earned` : `${fmt(l.reward)} available`}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={retakeQuiz} className="mt-6 flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:hidden">
        <RotateCcw className="h-4 w-4" /> Retake the setup quiz
      </button>
    </AppShell>
  );
}
