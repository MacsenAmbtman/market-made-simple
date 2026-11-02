import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { BOTTOM, QuestionScreen, TAP } from "@/components/lesson/MobileLessonPlayer";
import { getAllProgress } from "@/lib/lessons";
import { pickPractice, practiceQuestion, PRACTICE, recordPractice, type PracticeItem, type PracticeResult } from "@/lib/practice";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Keep practising — Stockify Learn" },
      { name: "description", content: "Quick 5-question practice rounds from the investing lessons you've finished." },
      { property: "og:title", content: "Keep practising — Stockify Learn" },
      { property: "og:description", content: "Quick investing practice rounds with instant feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const [round, setRound] = useState<PracticeItem[] | null>(null);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<PracticeResult | null>(null);

  const start = () => {
    setRound(pickPractice(getAllProgress()));
    setAt(0);
    setPicked(null);
    setCorrect(0);
    setResult(null);
  };

  // Questions are random, so pick them after mount to keep the server render stable.
  useEffect(start, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const item = round?.[at];
  const question = item ? practiceQuestion(item) : undefined;

  const advance = () => {
    if (picked === null || !question || !round) return;
    const total = correct + (picked === question.answer ? 1 : 0);
    setCorrect(total);
    setPicked(null);
    if (at + 1 < round.length) return setAt(at + 1);
    setResult(recordPractice(total));
  };

  const pct = result ? 100 : round?.length ? Math.round((at / round.length) * 100) : 0;

  return (
    <AppShell>
      <div className="fixed inset-0 z-50 flex flex-col bg-background pt-[env(safe-area-inset-top)]" role="dialog" aria-label="Practice round">
        <div className="flex items-center gap-2 px-3 py-3">
          <Link to="/learn" aria-label="Close practice" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </Link>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Practice progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-11" aria-hidden />
        </div>

        {round && round.length === 0 ? (
          <div className="flex-1 px-5 pt-10 text-center">
            <h2 className="text-2xl font-bold">Finish a lesson first</h2>
            <p className="mt-3 text-muted-foreground">Practice uses questions from lessons you've completed.</p>
            <Button asChild size="lg" className={`mt-8 h-14 w-full text-lg ${TAP}`}><Link to="/learn">Back to path</Link></Button>
          </div>
        ) : result ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 pb-6 text-center">
              <h2 className="mt-10 text-3xl font-bold">Round complete</h2>
              <p className="mt-3 text-lg text-muted-foreground">You got {result.correct} of {round?.length ?? PRACTICE.roundSize} right.</p>
              <p className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-2xl border bg-card px-5 py-3 font-display text-2xl font-bold tabular-nums">
                <Sparkles className="h-6 w-6 text-primary" aria-hidden />+{result.xpGained} XP
              </p>
              {result.capReached && <p className="mt-3 text-sm text-muted-foreground">You've reached today's {PRACTICE.dailyCap} XP practice limit. Keep playing for fun — more XP tomorrow.</p>}
            </div>
            <div className={`grid gap-3 border-t px-5 pt-3 ${BOTTOM}`}>
              <Button size="lg" className={`h-14 w-full text-lg ${TAP}`} onClick={start}><RotateCcw /> Play again</Button>
              <Button asChild size="lg" variant="secondary" className={`h-12 w-full ${TAP}`}><Link to="/learn">Back to path <ArrowRight /></Link></Button>
            </div>
          </>
        ) : question ? (
          <QuestionScreen key={`p${at}-${item?.slug}-${item?.i}`} item={question} picked={picked} onPick={setPicked} onContinue={advance} label={`Practice · ${at + 1} of ${round?.length}`} />
        ) : null}
      </div>
    </AppShell>
  );
}
