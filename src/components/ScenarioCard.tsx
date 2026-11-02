import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Check, X, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

type Move = "up" | "down";
type Scenario = { setup: string; question: string; answer: Move; explain: string };

export const SCENARIOS: Scenario[] = [
  {
    setup: "Apple reports earnings today. Profit beat expectations and iPhone sales grew 8%.",
    question: "Predict the move after the announcement.",
    answer: "up",
    explain: "Beating expectations usually lifts a stock. Prices react to surprises, not just good news.",
  },
  {
    setup: "A coffee chain warns that bean costs will cut its profits next quarter.",
    question: "Which way does the stock likely go?",
    answer: "down",
    explain: "Lower expected profit means investors will pay less for each share today.",
  },
  {
    setup: "An electric car maker announces it will build twice as many cars next year.",
    question: "How might the market react?",
    answer: "up",
    explain: "More cars sold points to more future revenue, which tends to push the price up.",
  },
];

export function ScenarioCard() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<Move | null>(null);
  const s = SCENARIOS[i];
  const correct = pick === s.answer;

  const choose = (m: Move) => {
    if (pick) return;
    setPick(m);
    trackEvent("scenario_answer", { index: i, correct: m === s.answer });
  };

  return (
    <div className="rounded-3xl border bg-card p-5 text-left shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Scenario {i + 1} of {SCENARIOS.length}</p>
      <p className="mt-3 text-lg font-semibold leading-snug">{s.setup}</p>
      <p className="mt-2 text-muted-foreground">{s.question}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {(["up", "down"] as Move[]).map((m) => {
          const Icon = m === "up" ? TrendingUp : TrendingDown;
          const isAnswer = pick && m === s.answer;
          const isWrongPick = pick === m && m !== s.answer;
          return (
            <button
              key={m}
              type="button"
              onClick={() => choose(m)}
              disabled={!!pick}
              className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-base font-semibold transition-all active:scale-95 ${
                isAnswer ? "border-primary bg-primary/15 text-primary" : isWrongPick ? "border-destructive bg-destructive/15 text-destructive" : pick ? "opacity-50" : "border-border hover:border-primary/60"
              }`}
            >
              <Icon className="h-7 w-7" />
              {m === "up" ? "Goes up" : "Goes down"}
            </button>
          );
        })}
      </div>
      {pick && (
        <div className={`mt-4 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 ${correct ? "bg-primary/10" : "bg-destructive/10"}`} aria-live="polite">
          <p className={`flex items-center gap-2 font-semibold ${correct ? "text-primary" : "text-destructive"}`}>
            {correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            {correct ? "Nice call!" : "Not quite."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{s.explain}</p>
          <div className="mt-4 grid gap-2">
            {i < SCENARIOS.length - 1 ? (
              <Button className="min-h-12 text-base" onClick={() => { setI(i + 1); setPick(null); }}>Next scenario <ArrowRight /></Button>
            ) : (
              <Button variant="secondary" className="min-h-12 text-base" onClick={() => { setI(0); setPick(null); }}><RotateCcw /> Play again</Button>
            )}
          </div>
        </div>
      )}
      <Button asChild size="lg" className="mt-5 w-full min-h-14 rounded-xl text-lg shadow-glow">
        <Link to="/learn/$slug" params={{ slug: "what-is-a-stock" }}>Start Free Lesson 1 <ArrowRight /></Link>
      </Button>
    </div>
  );
}

export function DesktopTradingBanner() {
  return (
    <div className="mx-5 mb-6 rounded-2xl border border-primary/30 bg-accent p-4 text-center text-sm md:hidden">
      For full multi-chart day trading, open <span className="font-semibold text-primary">stockifylearn.lovable.app</span> on your desktop.
    </div>
  );
}
