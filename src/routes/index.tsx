import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/AppShell";
import { Layers, Globe2, LineChart, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stockify — Learn to invest without the jargon" },
      { name: "description", content: "Bite-sized stock market lessons for complete beginners, plus a risk-free paper trading simulator." },
      { property: "og:title", content: "Stockify — Learn to invest without the jargon" },
      { property: "og:description", content: "Bite-sized investing lessons and a $10,000 paper simulator." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Layers, title: "Bite-sized modules", text: "5-minute lessons with quick quizzes. No textbooks, no jargon." },
  { icon: Globe2, title: "Real-world examples", text: "Learn with brands you know — coffee shops, phones, and cars." },
  { icon: LineChart, title: "Paper Simulator", text: "Practice with $10,000 of fake cash. Zero risk, real lessons." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-5">
        <Logo />
        <Button asChild variant="ghost"><Link to="/learn">Dashboard</Link></Button>
      </header>
      <section className="mx-auto max-w-4xl px-5 pt-16 pb-20 text-center md:pt-24">
        <span className="inline-block rounded-full border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Free for beginners</span>
        <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
          Learn to invest <span className="text-primary">without the confusing jargon.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Short, friendly lessons that turn "what's a stock?" into confident first steps.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow"><Link to="/learn/$slug" params={{ slug: "what-is-a-stock" }}>Start Free Lesson 1 <ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/simulator">Try the simulator</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border bg-card p-6 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="rounded-2xl border bg-card p-6 shadow-card md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Paper portfolio</p>
              <p className="font-display text-4xl font-bold">$11,284.50</p>
              <p className="text-sm text-primary">+12.8% since you started</p>
            </div>
            <Button asChild variant="secondary"><Link to="/simulator">Open simulator</Link></Button>
          </div>
          <div className="mt-8 flex h-32 items-end gap-2">
            {[30, 42, 38, 50, 47, 60, 58, 70, 66, 78, 74, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-primary/80" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
