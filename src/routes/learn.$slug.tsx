import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { lessons, markCompleted } from "@/lib/lessons";
import { ArrowLeft, Check, X } from "lucide-react";

export const Route = createFileRoute("/learn/$slug")({
  loader: ({ params }) => {
    const lesson = lessons.find((l) => l.slug === params.slug);
    if (!lesson) throw notFound();
    return lesson;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Lesson"} — Stockify` },
      { name: "description", content: loaderData?.blurb ?? "A Stockify lesson." },
      { property: "og:title", content: `${loaderData?.title ?? "Lesson"} — Stockify` },
      { property: "og:description", content: loaderData?.blurb ?? "A Stockify lesson." },
    ],
  }),
  component: Lesson,
});

const sections = [
  { h: "A slice of the pie", p: "A stock is a tiny piece of ownership in a company. Buy one share of a coffee chain and you literally own a sliver of every café, bean, and espresso machine." },
  { h: "Why companies sell slices", p: "Companies sell shares to raise money to grow — open new stores, build products, hire people. In return, shareholders share in the success." },
  { h: "How you make money", p: "Two ways: the share price goes up and you sell for more than you paid, or the company pays you a slice of its profits, called a dividend." },
];

const quiz = [
  { q: "What does owning a stock mean?", options: ["You lent the company money", "You own a small piece of the company", "You work for the company"], a: 1 },
  { q: "A payment of company profits to shareholders is called a…", options: ["Dividend", "Bond", "Fee"], a: 0 },
];

function Lesson() {
  const lesson = Route.useLoaderData();
  const [answers, setAnswers] = useState<(number | null)[]>(quiz.map(() => null));
  const answered = answers.filter((a) => a !== null).length;
  const pct = Math.round(((sections.length + answered) / (sections.length + quiz.length)) * 100);
  const allRight = answers.every((a, i) => a === quiz[i]?.a);
  if (allRight) markCompleted(lesson.slug);

  return (
    <AppShell>
      <div className="sticky top-0 z-10 -mx-4 bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex items-center gap-3">
          <Link to="/learn" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <Progress value={pct} className="h-2.5 flex-1" />
          <span className="text-sm text-primary">{pct}%</span>
        </div>
      </div>
      <div className="mx-auto max-w-2xl">
        <p className="mt-6 text-4xl">{lesson.emoji}</p>
        <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[["~58M", "US shareholders"], ["$0", "to start learning"], [`${lesson.minutes} min`, "to finish"]].map(([v, l]) => (
            <div key={l} className="rounded-xl border bg-card p-4 text-center shadow-card">
              <p className="font-display text-2xl font-bold text-primary">{v}</p>
              <p className="mt-1 text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          {sections.map((s) => (
            <div key={s.h} className="rounded-2xl border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold">{s.h}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-10 text-xl font-bold">Quick check ✅</h2>
        <div className="mt-4 space-y-4">
          {quiz.map((item, qi) => (
            <div key={item.q} className="rounded-2xl border bg-card p-6 shadow-card">
              <p className="font-medium">{item.q}</p>
              <div className="mt-4 grid gap-2">
                {item.options.map((o, oi) => {
                  const picked = answers[qi] === oi;
                  const right = oi === item.a;
                  const state = picked ? (right ? "border-primary bg-accent" : "border-destructive bg-destructive/15") : "hover:bg-muted";
                  return (
                    <button key={o} onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${state}`}>
                      {o}
                      {picked && (right ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-destructive" />)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {allRight && (
          <div className="mt-6 rounded-2xl border border-primary bg-accent p-6 text-center">
            <p className="font-semibold text-accent-foreground">🎉 Lesson complete!</p>
            <Button asChild className="mt-4"><Link to="/learn">Back to lessons</Link></Button>
          </div>
        )}
        <div className="h-10" />
      </div>
    </AppShell>
  );
}
