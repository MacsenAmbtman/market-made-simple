import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check, Clock, Monitor, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const WORKSTATION_URL = "https://stockifylearn.lovable.app/simulator";

type Option = { label: string; feedback?: string; good?: boolean };
const STEPS: { q: string; options: Option[] }[] = [
  { q: "What is your main stock goal?", options: [{ label: "Learn Day Trading" }, { label: "Understand Investing" }, { label: "Practice Risk-Free" }] },
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
  "Learn Day Trading": "Day traders buy and sell within one day. Start with the candlestick basics, set a stop-loss on every trade, and never risk more than 1-2% of your cash.",
  "Understand Investing": "A stock is a tiny slice of a company. Over years, good companies tend to grow — so time in the market usually beats timing the market.",
  "Practice Risk-Free": "Paper trading uses fake money so you can test ideas with zero risk. Try a trade, watch what happens, and learn from every result.",
};

export function OnboardingQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [picked, setPicked] = useState<Option | null>(null);

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
    trackEvent("onboarding_complete", { goal: next[0], level: next[1] });
  };

  const sendLink = async () => {
    trackEvent("send_workstation_link");
    const data = { title: "Stockify Learn Workstation", text: "Open this on my computer to start paper trading", url: WORKSTATION_URL };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch { return; }
    try { await navigator.clipboard.writeText(WORKSTATION_URL); toast.success("Link copied — paste it on your computer."); }
    catch { toast(WORKSTATION_URL); }
  };

  const restart = () => { setStep(0); setAnswers([]); setPicked(null); };

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-5 flex gap-1.5" aria-label={`Step ${step + 1} of 4`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step < 3 ? (
        <>
          <h2 className="text-2xl font-bold leading-tight">{STEPS[step].q}</h2>
          <div className="mt-5 grid gap-3">
            {STEPS[step].options.map((o) => {
              const sel = picked?.label === o.label;
              return (
                <button
                  key={o.label}
                  onClick={() => choose(o)}
                  disabled={!!picked && !sel}
                  className={`min-h-14 rounded-2xl border-2 px-4 text-left text-lg font-semibold transition active:scale-[0.98] ${
                    sel ? (o.good ? "border-primary bg-primary/15" : "border-destructive bg-destructive/15") : "border-border bg-background hover:border-primary/60"
                  } disabled:opacity-40`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {picked && (
            <div className={`mt-4 rounded-2xl p-4 text-base ${picked.good ? "bg-primary/10 text-foreground" : "bg-destructive/10 text-foreground"}`}>
              {picked.feedback}
              <Button className="mt-4 h-12 w-full text-base" onClick={finishScenario}>See my path</Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-primary"><Check className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-wide">All set</span></div>
          <h2 className="mt-2 text-2xl font-bold leading-tight">Your Daily Stockify Path is Ready!</h2>
          <p className="mt-1 text-sm text-muted-foreground">{answers[1]} · {answers[0]}</p>
          <div className="mt-5 rounded-2xl bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Clock className="h-4 w-4" /> Quick 2-minute read</div>
            <p className="mt-2 text-base leading-relaxed">{READS[answers[0]]}</p>
            <Link to="/learn/$slug" params={{ slug: "what-is-a-stock" }} className="mt-3 inline-block text-sm font-semibold text-primary">Start Lesson 1</Link>
          </div>
          <Button className="mt-5 h-auto min-h-14 w-full whitespace-normal py-3 text-base font-bold" onClick={sendLink}>
            <Monitor className="mr-2 h-5 w-5 shrink-0" /> Send Workstation Link to Computer to Start Paper Trading
          </Button>
          <button onClick={restart} className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4" /> Retake quiz</button>
        </>
      )}
    </div>
  );
}
