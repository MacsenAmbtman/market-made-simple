import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/AppShell";
import { Layers, Globe2, LineChart, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stockify Learn — The stock market, finally in plain English" },
      { name: "description", content: "Bite-sized stock market lessons for complete beginners, plus a risk-free paper trading simulator." },
      { property: "og:title", content: "Stockify Learn — The stock market, finally in plain English" },
      { property: "og:description", content: "Bite-sized investing lessons and a $10,000 paper simulator." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Layers, title: "Bite-sized modules", text: "5-minute lessons with quick quizzes. Zero textbooks. Zero stress." },
  { icon: Globe2, title: "Real-world examples", text: "Learn with brands you know — coffee shops, phones, and cars." },
  { icon: LineChart, title: "Paper Simulator", text: "Practice with $10,000 of fake cash. Zero risk, real lessons." },
];

function HeaderActions() {
  const { status } = useAuth();
  if (status === "loading") return <div className="h-9" aria-hidden />;
  if (status === "signed-in") {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost"><Link to="/dashboard">Dashboard</Link></Button>
        <AccountMenu />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
      <Button asChild><Link to="/signup">Sign up</Link></Button>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <div className="pt-10 md:pt-16">
        <div
          role="img"
          aria-label="Stockify"
          className="w-full select-none bg-band border-y border-border/40"
        >
          <span className="block py-[clamp(0.75rem,2.5vw,1.75rem)] text-center font-display text-[clamp(2.25rem,10vw,8rem)] font-bold leading-none tracking-tight text-foreground">
            STOCKIFY
          </span>
        </div>
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between p-5">
        <LogoMark />
        <HeaderActions />
      </header>
      <section className="mx-auto max-w-4xl px-5 pt-10 pb-20 text-center md:pt-16">
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">
          The stock market, <span className="text-primary">finally in plain English.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Short, friendly lessons that turn "what's a stock?" into confident first steps.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow"><Link to="/learn/$slug" params={{ slug: "what-is-a-stock" }}>Start Free Lesson 1 <ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="ghost"><Link to="/simulator">Try the simulator</Link></Button>
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
      <SiteFooter />
    </div>
  );
}
