import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Coins, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getProgress, lessons, PASS_SCORE, recordQuiz, saveSlide, type Lesson, type QuizOutcome } from "@/lib/lessons";
import { fmt } from "@/lib/simulator";
import { ScenarioCard } from "./ScenarioCard";

type Phase = "slides" | "quiz" | "result";

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [phase, setPhase] = useState<Phase>("slides");
  const [slide, setSlide] = useState(0);
  const [completedBefore, setCompletedBefore] = useState(false);
  const [q, setQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);

  // Resume where the learner left off (read after mount to keep SSR markup stable).
  useEffect(() => {
    const p = getProgress(lesson.slug);
    setCompletedBefore(p.completed);
    if (!p.completed) setSlide(Math.min(p.slide, lesson.slides.length - 1));
  }, [lesson]);

  const goSlide = (i: number) => {
    setSlide(i);
    saveSlide(lesson.slug, i);
  };

  const startQuiz = () => {
    setPhase("quiz");
    setQ(0);
    setAnswers([]);
    setPicked(null);
    setOutcome(null);
  };

  const nextQuestion = () => {
    if (picked === null) return;
    const all = [...answers, picked];
    setAnswers(all);
    setPicked(null);
    if (q + 1 < lesson.quiz.length) return setQ(q + 1);
    const result = recordQuiz(lesson, all);
    if (result.passed) setCompletedBefore(true);
    setOutcome(result);
    setPhase("result");
  };

  // Arrow keys move between slides.
  useEffect(() => {
    if (phase !== "slides") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight" && slide < lesson.slides.length - 1) goSlide(slide + 1);
      if (e.key === "ArrowLeft" && slide > 0) goSlide(slide - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const steps = lesson.slides.length + lesson.quiz.length;
  const done = phase === "slides" ? slide + 1 : phase === "quiz" ? lesson.slides.length + q + (picked !== null ? 1 : 0) : steps;
  const pct = Math.round((done / steps) * 100);

  return (
    <>
      <div className="sticky top-16 z-10 -mx-4 bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex items-center gap-3">
          <Link to="/learn" aria-label="Back to lessons" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <Progress value={pct} className="h-2.5 flex-1" aria-label="Lesson progress" />
          <span className="w-10 text-right text-sm tabular-nums text-primary">{pct}%</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl pb-10">
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{lesson.title}</span>
          <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"><Coins className="h-3 w-3" />+{fmt(lesson.reward)} simulator bonus</span>
          {completedBefore && <span className="flex items-center gap-1 text-xs text-primary"><Check className="h-3 w-3" />Completed</span>}
        </div>

        {phase === "slides" && (
          <SlideView
            lesson={lesson}
            index={slide}
            onPrev={() => goSlide(slide - 1)}
            onNext={() => goSlide(slide + 1)}
            onJump={goSlide}
            onQuiz={startQuiz}
          />
        )}

        {phase === "quiz" && (
          <QuizView lesson={lesson} index={q} picked={picked} onPick={setPicked} onNext={nextQuestion} />
        )}

        {phase === "result" && outcome && (
          <ResultView
            lesson={lesson}
            answers={answers}
            outcome={outcome}
            onRetry={startQuiz}
            onReview={() => { setPhase("slides"); goSlide(0); }}
          />
        )}
      </div>
    </>
  );
}

function SlideView({ lesson, index, onPrev, onNext, onJump, onQuiz }: { lesson: Lesson; index: number; onPrev: () => void; onNext: () => void; onJump: (i: number) => void; onQuiz: () => void }) {
  const s = lesson.slides[index];
  if (!s) return null;
  const last = index === lesson.slides.length - 1;
  return (
    <section aria-roledescription="slide" aria-label={`Slide ${index + 1} of ${lesson.slides.length}`}>
      <div key={index} className="mt-4 min-h-80 rounded-2xl border bg-card p-6 shadow-card animate-in fade-in slide-in-from-right-4 duration-300 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Slide {index + 1} of {lesson.slides.length}</p>        <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">{s.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{s.body}</p>
        {s.stat && (
          <div className="mt-6 rounded-xl border bg-background/40 p-4">
            <p className="font-display text-3xl font-bold text-primary">{s.stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.stat.label}</p>
          </div>
        )}
        {s.scenario && <ScenarioCard key={s.scenario.id} scenario={s.scenario} />}
        {s.callout && <p className="mt-6 rounded-xl bg-accent/60 px-4 py-3 text-sm font-medium text-accent-foreground">{s.callout}</p>}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={onPrev} disabled={index === 0}><ArrowLeft /> Back</Button>
        <div className="flex gap-1.5">
          {lesson.slides.map((_, i) => (
            <button key={i} type="button" onClick={() => onJump(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground"}`} />
          ))}
        </div>
        {last ? (
          <Button onClick={onQuiz} className="shadow-glow">Take the quiz <ArrowRight /></Button>
        ) : (
          <Button onClick={onNext}>Next <ArrowRight /></Button>
        )}
      </div>
    </section>
  );
}

function QuizView({ lesson, index, picked, onPick, onNext }: { lesson: Lesson; index: number; picked: number | null; onPick: (i: number) => void; onNext: () => void }) {
  const item = lesson.quiz[index];
  if (!item) return null;
  const revealed = picked !== null;
  const last = index === lesson.quiz.length - 1;
  return (
    <section key={index} className="mt-4 rounded-2xl border bg-card p-6 shadow-card animate-in fade-in duration-300 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question {index + 1} of {lesson.quiz.length}</p>
      <h1 className="mt-3 text-xl font-bold sm:text-2xl">{item.q}</h1>
      <div className="mt-6 grid gap-2" role="radiogroup">
        {item.options.map((o, oi) => {
          const right = oi === item.answer;
          const style = !revealed
            ? "hover:border-primary/60 hover:bg-muted"
            : right
              ? "border-primary bg-accent text-accent-foreground"
              : oi === picked
                ? "border-destructive bg-destructive/15"
                : "opacity-60";
          return (
            <button key={o} type="button" role="radio" aria-checked={picked === oi} disabled={revealed} onClick={() => onPick(oi)} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${style}`}>
              {o}
              {revealed && right && <Check className="h-4 w-4 shrink-0 text-primary" />}
              {revealed && !right && oi === picked && <X className="h-4 w-4 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-300" aria-live="polite">
          <p className={`font-semibold ${picked === item.answer ? "text-primary" : "text-destructive"}`}>{picked === item.answer ? "Correct!" : "Not quite."}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.explain}</p>
          <Button className="mt-5 w-full sm:w-auto" onClick={onNext}>{last ? "See results" : "Next question"} <ArrowRight /></Button>
        </div>
      )}
    </section>
  );
}

function ResultView({ lesson, answers, outcome, onRetry, onReview }: { lesson: Lesson; answers: number[]; outcome: QuizOutcome; onRetry: () => void; onReview: () => void }) {
  const next = lessons[lessons.findIndex((l) => l.slug === lesson.slug) + 1];
  return (
    <section className="mt-4 rounded-2xl border bg-card p-6 text-center shadow-card animate-in fade-in zoom-in-95 duration-300 sm:p-8" aria-live="polite">      <h1 className="text-3xl font-bold sm:text-4xl">{outcome.passed ? "Lesson complete!" : "Almost there"}</h1>
      <p className="mt-2 text-muted-foreground">
        You got <span className="font-semibold text-foreground">{outcome.score} of {lesson.quiz.length}</span> right.
        {!outcome.passed && ` You need ${PASS_SCORE} to pass.`}
      </p>

      {outcome.rewardGranted > 0 && (
        <div className="mx-auto mt-6 max-w-sm rounded-xl border border-primary bg-accent p-4 text-accent-foreground shadow-glow">
          <p className="flex items-center justify-center gap-2 font-display text-2xl font-bold"><Coins className="h-6 w-6" />+{fmt(outcome.rewardGranted)}</p>
          <p className="mt-1 text-sm">Bonus cash added to your Paper Simulator.</p>
        </div>
      )}
      {outcome.passed && outcome.alreadyRewarded && (
        <p className="mt-4 text-sm text-muted-foreground">You've already collected the {fmt(lesson.reward)} bonus for this lesson.</p>
      )}

      <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm">
        {lesson.quiz.map((item, i) => {
          const ok = answers[i] === item.answer;
          return (
            <li key={item.q} className="flex items-start gap-2">
              {ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
              <span className={ok ? "" : "text-muted-foreground"}>{item.q}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {outcome.passed ? (
          <>
            <Button asChild><Link to="/simulator">Open the simulator <ArrowRight /></Link></Button>
            {next ? (
              <Button asChild variant="secondary"><Link to="/learn/$slug" params={{ slug: next.slug }}>Next: {next.title}</Link></Button>
            ) : (
              <Button asChild variant="secondary"><Link to="/learn">All lessons</Link></Button>
            )}
          </>
        ) : (
          <>
            <Button onClick={onRetry}><RotateCcw /> Try again</Button>
            <Button variant="secondary" onClick={onReview}>Review the slides</Button>
          </>
        )}
      </div>
      {outcome.passed && (
        <button type="button" onClick={onRetry} className="mt-4 text-xs text-muted-foreground hover:text-foreground hover:underline">Retake quiz</button>
      )}
    </section>
  );
}
