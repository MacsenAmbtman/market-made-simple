import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isOnboardingDone, skipFirstQuestion } from "@/lib/onboarding";
import { useIsPhone } from "@/hooks/use-is-phone";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/AppShell";
import { Layers, Globe2, LineChart, ArrowRight } from "lucide-react";
import { HOME_CTAS, resumeTarget } from "@/lib/home";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SiteFooter } from "@/components/SiteFooter";
import { FirstQuestion } from "@/components/FirstQuestion";
import { getAllProgress } from "@/lib/lessons";

const features = [
  { icon: Layers, title: "Bite-sized modules", text: "5-minute lessons with quick quizzes. Zero textbooks. Zero stress." },
  { icon: Globe2, title: "Real-world examples", text: "Learn with brands you know — coffee shops, phones, and cars." },
  { icon: LineChart, title: "Paper Simulator", text: "Practice with $10,000 of fake cash. Zero risk, real lessons." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stockify Learn — The stock market, finally in plain English" },
      { name: "description", content: "Bite-sized stock market lessons for complete beginners, plus a risk-free paper trading simulator." },
      { property: "og:title", content: "Stockify Learn — The stock market, finally in plain English" },
      { property: "og:description", content: "Bite-sized investing lessons and a $10,000 paper simulator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});


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
      <Button asChild variant="ghost" className="max-md:h-9 max-md:px-3 max-md:text-sm max-md:text-muted-foreground"><Link to="/login">Sign in</Link></Button>
      {/* Phones keep the first screen about "Start Lesson 1"; only a small Sign in link shows. */}
      <Button asChild className="hidden md:inline-flex"><Link to="/signup">Sign up</Link></Button>
    </div>
  );
}

function Landing() {
  const isPhone = useIsPhone();
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [resume, setResume] = useState<ReturnType<typeof resumeTarget>>(null);
  useEffect(() => { setResume(resumeTarget(getAllProgress())); }, []);
  // Phones: first visit shows one quick question; anyone who answered it before (or the old
  // setup quiz) or already has lesson progress goes straight to the path.
  useEffect(() => {
    if (!isPhone) return;
    if (skipFirstQuestion(isOnboardingDone(), getAllProgress())) void navigate({ to: "/learn", replace: true });
    else setShowQuiz(true);
  }, [isPhone, navigate]);
  return (
    <div className="min-h-screen bg-hero">
      <div className="hidden pt-16 md:block">
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
      <header className="mx-auto flex max-w-6xl items-center justify-between p-5 max-md:pt-[max(1.25rem,env(safe-area-inset-top))]">
        <LogoMark />
        <div className="flex items-center gap-2">
          <HeaderActions />
        </div>
      </header>
      {/* Phones: one quick question, shown once; afterwards phones open the path on /learn. */}
      <section className="px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden">
        {showQuiz && <FirstQuestion />}
      </section>
      <section className="mx-auto hidden max-w-4xl px-5 pt-14 pb-16 text-center md:block">
        <h1 className="text-6xl font-bold leading-tight">
          The stock market, <span className="text-primary">finally in plain English.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Free five-minute lessons for complete beginners, then practise what you learn with simulated money. No real cash, no jargon.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow">
            <Link to={HOME_CTAS.primary.to} params={{ slug: HOME_CTAS.primary.slug }} onClick={() => trackEvent("home_cta_click", { button: "start_practising" })}>{HOME_CTAS.primary.label} <ArrowRight /></Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to={HOME_CTAS.secondary.to} onClick={() => trackEvent("home_cta_click", { button: "try_simulator" })}>{HOME_CTAS.secondary.label}</Link>
          </Button>
        </div>
        {resume && (
          <p className="mt-6 text-sm text-muted-foreground">
            Welcome back.{" "}
            <Link to="/learn/$slug" params={{ slug: resume.slug }} onClick={() => trackEvent("home_cta_click", { button: "resume" })} className="font-medium text-primary hover:underline">Continue with "{resume.title}" →</Link>
          </p>
        )}
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
      <p className="mx-auto hidden max-w-2xl px-5 pb-12 text-center text-sm text-muted-foreground md:block">Educational only, not financial advice. Every trade in Stockify uses simulated money, and past prices never guarantee future results.</p>
      {/* The phone opening question fits one screen; the footer returns everywhere else. */}
      <div className={showQuiz ? "max-md:hidden" : undefined}><SiteFooter /></div>
    </div>
  );
}
