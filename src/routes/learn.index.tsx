import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { lessons, getCompleted } from "@/lib/lessons";
import { CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learn — Stockify" },
      { name: "description", content: "Your beginner investing lesson modules and progress." },
      { property: "og:title", content: "Learn — Stockify" },
      { property: "og:description", content: "Bite-sized investing lessons." },
    ],
  }),
  component: Learn,
});

function Learn() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => setDone(getCompleted()), []);
  const pct = Math.round((done.length / lessons.length) * 100);
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Welcome back 👋</h1>
      <p className="mt-1 text-muted-foreground">Pick up where you left off.</p>
      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex justify-between text-sm"><span className="font-medium">Course progress</span><span className="text-primary">{done.length}/{lessons.length} lessons</span></div>
        <Progress value={pct} className="mt-3 h-2.5" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l, i) => {
          const isDone = done.includes(l.slug);
          return (
            <Link key={l.slug} to="/learn/$slug" params={{ slug: l.slug }} className="group rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/50">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{l.emoji}</span>
                {isDone ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <span className="text-xs text-muted-foreground">Lesson {i + 1}</span>}
              </div>
              <h3 className="mt-4 font-semibold group-hover:text-primary">{l.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{l.blurb}</p>
              <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{l.minutes} min</p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
