import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { markOnboardingDone } from "@/lib/onboarding";
import { FIRST_QUESTION } from "@/lib/first-question";

const TAP = "transition-transform active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none";

/** First-time phone visitors: one quick question, then straight into Lesson 1. Shown once. */
export function FirstQuestion() {
  const [picked, setPicked] = useState<number | null>(null);
  const q = FIRST_QUESTION;

  useEffect(() => { trackEvent("first_question_shown"); }, []);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    markOnboardingDone();
    trackEvent("first_question_answered", { correct: i === q.answer });
  };

  const right = picked === q.answer;

  return (
    <div className="flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Quick question</p>
      <h1 className="mt-2 text-2xl font-bold leading-snug">{q.question}</h1>
      <div className="mt-4 grid gap-2.5" role="radiogroup">
        {q.options.map((o, i) => {
          const style = picked === null
            ? "border-border bg-card"
            : i === q.answer ? "border-primary bg-accent text-accent-foreground"
            : i === picked ? "border-destructive bg-destructive/15"
            : "border-border bg-card opacity-50";
          return (
            <button key={o} type="button" role="radio" aria-checked={picked === i} disabled={picked !== null} onClick={() => choose(i)}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-base font-semibold ${TAP} ${style}`}>
              {o}
              {picked !== null && i === q.answer && <Check className="h-5 w-5 shrink-0 text-primary" />}
              {picked !== null && i !== q.answer && i === picked && <X className="h-5 w-5 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 min-h-[4.5rem]" aria-live="polite">
        {picked !== null && (
          <p className="text-sm leading-snug animate-in fade-in duration-200 motion-reduce:animate-none">
            <span className={`font-bold ${right ? "text-primary" : "text-foreground"}`}>{right ? "Nice — that's it. " : "Good guess, but not quite. "}</span>
            {q.teach}
          </p>
        )}
      </div>
      <Button asChild size="lg" className={`mt-2 h-14 w-full text-lg shadow-glow ${TAP}`}>
        <Link to="/learn/$slug" params={{ slug: "what-is-a-stock" }} onClick={() => markOnboardingDone()}>Start Lesson 1 <ArrowRight /></Link>
      </Button>
      <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground">
        Educational only, not financial advice. Daily Grind Coffee is a made-up company.
      </p>
    </div>
  );
}
