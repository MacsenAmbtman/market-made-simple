import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Monitor } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { markOnboardingDone } from "@/lib/onboarding";
import { sendWorkstationLink } from "@/lib/share-link";

type Option = { label: string; feedback?: string; good?: boolean };
const STEPS: { q: string; options: Option[] }[] = [
  { q: "What is your main stock goal?", options: [{ label: "Understand Investing" }, { label: "Grow My Savings" }, { label: "Learn the Lingo" }] },
  { q: "What is your experience level?", options: [{ label: "Total Beginner" }, { label: "Know the Basics" }, { label: "Intermediate" }] },
  {
    q: "Scenario Check: AAPL falls 5% after earnings. What's your move?",
    options: [
      { label: "Buy the Dip", good: true, feedback: "Bold — if the company is still strong, a dip can be a discount, but only buy what you can hold." },
      { label: "Wait & See", good: true, feedback: "Smart — letting the dust settle avoids reacting to one day of noise." },
      { label: "Panic Sell", good: false, feedback: "Careful — selling in fear often locks in a loss right before prices recover." },
    ],
  },
];

const READS: Record<string, string> = {
  "Understand Investing": "A stock is a tiny slice of a company. Over years, good companies tend to grow — so time in the market usually beats timing the market.",
  "Grow My Savings": "Small amounts invested regularly can grow a lot over time, because your returns start earning returns of their own.",
  "Learn the Lingo": "Shares, dividends, index funds — every word gets a plain-English explanation, one short lesson at a time.",
};

/** Phone setup quiz. Reaching the results card saves it as done so it only shows once. */
export function OnboardingQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [picked, setPicked] = useState<Option | null>(null);
  const [linkNote, setLinkNote] = useState<string | null>(null);

  const choose = (o: Option) => {
    if (step === 2) {
      if (picked) return;
      setPicked(o);
      return;
    }
    const next = [...answers]; next[step] = o.label;
    setAnswers(next); setStep(step + 1);
  };

  const finishScenario = () => {
    const next = [...answers]; next[2] = picked!.label;
    setAnswers(next); setPicked(null); setStep(3);
    markOnboardingDone();
    trackEvent("onboarding_complete", { goal: next[0], level: next[1] });
  };

  const sendLink = async () => {
    const r = await sendWorkstationLink();
    if (r === "copied") setLinkNote("Link copied — paste it on your computer.");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-5 flex gap-1.5" aria-label={`Step ${step + 1} of 4`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step < 3 ? (
        <>
          <h2 className="text-2xl font-bold leading-tight">{STEPS[step]!.q}</h2>
          <div className="mt-5 grid gap-3">
            {STEPS[step]!.options.map((o) => {
              const sel = picked?.label === o.label;
              return (
                <button
                  key={o.label}
                  onClick={() => choose(o)}
                  disabled={!!picked && !sel}
                  className={`min-h-14 rounded-2xl border-2 px-4 text-left text-lg font-semibold transition active:scale-[0.98] motion-reduce:transform-none ${
                    sel ? (o.good ? "border-primary bg-primary/15" : "border-destructive bg-destructive/15") : "border-border bg-background hover:border-primary/60"
                  } disabled:opacity-40`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {picked && (
            <div className="mt-4" aria-live="polite">
              <p className={`text-base ${picked.good ? "text-primary" : "text-destructive"}`}>{picked.feedback}</p>
              <Button size="lg" className="mt-4 h-14 w-full text-base" onClick={finishScenario}>Continue</Button>
            </div>
          )}
        </>
      ) : (
        <div>
          <h2 className="text-2xl font-bold leading-tight">Your Daily Stockify Path is Ready!</h2>
          <div className="mt-4 rounded-2xl bg-background p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Clock className="h-3.5 w-3.5" />2-minute read</p>
            <p className="mt-2 text-base leading-relaxed">{READS[answers[0] ?? ""] ?? READS["Understand Investing"]}</p>
          </div>
          <Button asChild size="lg" className="mt-5 h-14 w-full text-base shadow-glow">
            <Link to="/learn/$slug" params={{ slug: "what-is-a-stock" }}>Start Lesson 1 <ArrowRight /></Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="mt-3 h-12 w-full">
            <Link to="/learn">See my learning path</Link>
          </Button>
          <button type="button" onClick={sendLink} className="mx-auto mt-4 flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Monitor className="h-4 w-4" /> Send the practice link to my computer
          </button>
          {linkNote && <p className="text-center text-sm text-primary" aria-live="polite">{linkNote}</p>}
        </div>
      )}
    </div>
  );
}
