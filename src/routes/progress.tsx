import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { lessons, getCompleted } from "@/lib/lessons";
import { CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — Stockify" },
      { name: "description", content: "Track the investing lessons you've completed." },
      { property: "og:title", content: "My Progress — Stockify" },
      { property: "og:description", content: "Your Stockify learning progress." },
    ],
  }),
  component: MyProgress,
});

function MyProgress() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => setDone(getCompleted()), []);
  const pct = Math.round((done.length / lessons.length) * 100);
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">My Progress</h1>
      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-card">
        <p className="font-display text-5xl font-bold text-primary">{pct}%</p>
        <p className="text-sm text-muted-foreground">{done.length} of {lessons.length} lessons complete</p>
        <Progress value={pct} className="mt-4 h-2.5" />
      </div>
      <ul className="mt-6 space-y-2">
        {lessons.map((l) => (
          <li key={l.slug} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
            {done.includes(l.slug) ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
            {l.title}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
