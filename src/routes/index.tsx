import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/AppShell";
import { Layers, Globe2, LineChart, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SiteFooter } from "@/components/SiteFooter";
import { SwipeDeck, DesktopCTA } from "@/components/SwipeDeck";

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
          <span className="block py-[clamp(0.75rem,2.5vw,1.75rem)] text-center font-display text-[clamp(2.25rem,10vw,8rem)] max-sm:text-[clamp(2.75rem,13.5vw,8rem)] font-bold leading-none tracking-tight text-foreground">
            STOCKIFY
          </span>
        </div>
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between p-5">
        <LogoMark />
        <div className="flex items-center gap-2">
          <HeaderActions />
        </div>
      </header>
      {/* Phones: app-style home — one daily swipe challenge, then the learning path. */}
      <section className="px-5 pt-2 pb-8 md:hidden">
        <h1 className="text-center text-3xl font-bold leading-tight">
          The stock market, <span className="text-primary">finally in plain English.</span>
        </h1>
        <ul className="mt-4 flex justify-center gap-2 text-xs font-medium text-muted-foreground">
          {["3-min lessons", "100% risk-free", "$10k paper cash"].map((s) => (
            <li key={s} className="rounded-full border bg-card px-3 py-1.5">{s}</li>
          ))}
        </ul>
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Daily market pulse</p>
            <p className="text-xs text-muted-foreground">Swipe right to buy, left to pass</p>
          </div>
          <SwipeDeck />
        </div>
        <div className="mt-9">
          <h2 className="text-xl font-bold">Your learning path</h2>
          <ol className="relative mt-4 space-y-3 before:absolute before:left-5 before:top-5 before:bottom-5 before:w-px before:bg-border">
            {[
              { n: 1, title: "What is a Stock?", text: "Own a slice of a company", slug: "what-is-a-stock" },
              { n: 2, title: "Risk & Reward", text: "Why prices wiggle", slug: "risk-and-reward" },
              { n: 3, title: "Your first paper trade", text: "$10,000 fake cash, zero risk", slug: null },
            ].map((step) => {
              const inner = (
                <>
                  <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold ${step.n === 1 ? "bg-primary text-primary-foreground shadow-glow" : "border bg-card text-muted-foreground"}`}>{step.n}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{step.title}</span>
                    <span className="block text-sm text-muted-foreground">{step.text}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </>
              );
              const cls = "flex min-h-16 items-center gap-4 rounded-2xl border bg-card p-3 shadow-card";
              return (
                <li key={step.n}>
                  {step.slug ? (
                    <Link to="/learn/$slug" params={{ slug: step.slug }} className={cls}>{inner}</Link>
                  ) : (
                    <Link to="/simulator" className={cls}>{inner}</Link>
                  )}
                </li>
              );
            })}
          </ol>
          <Button asChild size="lg" className="mt-5 h-14 w-full text-base shadow-glow">
            <Link to="/learn/$slug" params={{ slug: "what-is-a-stock" }}>Start Free Lesson 1 <ArrowRight /></Link>
          </Button>
        </div>
        <div className="mt-9"><DesktopCTA /></div>
      </section>
      <section className="mx-auto hidden max-w-4xl px-5 pt-16 pb-20 text-center md:block">
        <h1 className="text-6xl font-bold leading-tight">
          The stock market, <span className="text-primary">finally in plain English.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Short, friendly lessons that turn "what's a stock?" into confident first steps.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow"><Link to="/learn/$slug" params={{ slug: "what-is-a-stock" }}>Start Free Lesson 1 <ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="ghost"><Link to="/simulator">Try the simulator</Link></Button>
        </div>
      </section>
      <section className="mx-auto hidden max-w-6xl gap-5 px-5 pb-16 md:grid md:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border bg-card p-6 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto hidden max-w-6xl px-5 pb-24 md:block">
        <div className="rounded-2xl border bg-card p-10 shadow-card">
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
