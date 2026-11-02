import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronLeft, Coins, Flame, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllProgress, getPracticeEntry, getProgress, passMark, practiceXp, saveSlide, totalXp, type Lesson, type QuizQuestion } from "@/lib/lessons";
import { trackEvent } from "@/lib/analytics";
import { markSavePromptSeen, readSavePromptSeen, shouldShowSavePrompt } from "@/lib/save-prompt";
import { buildSteps, finishPhoneLesson, nextCourseLesson, quizOnlySteps, type PhoneFinish, type Step } from "@/lib/phone-lesson";
import { fmt } from "@/lib/simulator";
import { useAuth } from "@/hooks/use-auth";
import { ScenarioCard } from "./ScenarioCard";

export const TAP = "transition-transform active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none";
export const BOTTOM = "pb-[max(1rem,env(safe-area-inset-bottom))]";

/** Phone lesson: one idea per screen, quiz questions mixed in, a fixed Continue button. */
export function MobileLessonPlayer({ lesson }: { lesson: Lesson }) {
  const [steps, setSteps] = useState<Step[]>(() => buildSteps(lesson).steps);
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<PhoneFinish | null>(null);

  // Resume a partly finished lesson (read after mount to keep server markup stable).
  useEffect(() => {
    const p = getProgress(lesson.slug);
    trackEvent("lesson_start", { lesson_slug: lesson.slug, resumed: !p.completed && p.slide > 0 });
    if (p.completed || p.slide <= 0) return;
    const r = buildSteps(lesson, Math.min(p.slide, lesson.slides.length - 1));
    setSteps(r.steps);
    setAt(r.start);
  }, [lesson]);

  // Lock page scroll behind the full-screen lesson.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const step = steps[at];
  const pct = result ? 100 : Math.round((at / steps.length) * 100);

  const go = (i: number) => {
    setAt(i);
    setPicked(null);
    const s = steps[i];
    if (s?.kind === "slide") saveSlide(lesson.slug, s.i);
  };

  const advance = () => {
    let all = answers;
    if (step?.kind === "quiz") {
      if (picked === null) return;
      all = [...answers];
      all[step.i] = picked;
      setAnswers(all);
    }
    if (at + 1 < steps.length) return go(at + 1);
    const r = finishPhoneLesson(lesson, all);
    trackEvent(r.passed ? "lesson_complete" : "lesson_failed", { lesson_slug: lesson.slug, score: r.score, out_of: lesson.quiz.length });
    setResult(r);
  };

  // Back only walks through earlier slides; answered questions stay answered.
  const prevSlide = (() => {
    for (let i = at - 1; i >= 0; i--) if (steps[i]?.kind === "slide") return i;
    return -1;
  })();
  const canBack = !result && picked === null && prevSlide >= 0;

  const restart = (next: Step[]) => {
    setSteps(next);
    setAnswers([]);
    setResult(null);
    setPicked(null);
    setAt(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pt-[env(safe-area-inset-top)]" role="dialog" aria-label={lesson.title}>
      <div className="flex items-center gap-2 px-3 py-3">
        <Link to="/learn" aria-label="Close lesson" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground">
          <X className="h-6 w-6" />
        </Link>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Lesson progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
        </div>
        <button type="button" onClick={() => go(prevSlide)} disabled={!canBack} aria-label="Previous screen" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground disabled:opacity-0">
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      {result ? (
        <CompleteScreen lesson={lesson} result={result} answers={answers} onRetry={() => restart(quizOnlySteps(lesson))} onReview={() => restart(buildSteps(lesson).steps)} />
      ) : step?.kind === "slide" ? (
        <SlideScreen key={`s${at}`} lesson={lesson} index={step.i} onContinue={advance} />
      ) : step?.kind === "quiz" ? (
        <QuestionScreen key={`q${at}`} item={lesson.quiz[step.i]} picked={picked} onPick={setPicked} onContinue={advance} />
      ) : null}
    </div>
  );
}

function SlideScreen({ lesson, index, onContinue }: { lesson: Lesson; index: number; onContinue: () => void }) {
  const s = lesson.slides[index];
  if (!s) return null;
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-6 animate-in fade-in slide-in-from-right-4 duration-300 motion-reduce:animate-none">
        <h2 className="mt-4 text-3xl font-bold leading-tight">{s.title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{s.body}</p>
        {s.stat && (
          <div className="mt-6 rounded-xl border bg-card p-4">
            <p className="font-display text-3xl font-bold text-primary">{s.stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.stat.label}</p>
          </div>
        )}
        {s.scenario && <ScenarioCard key={s.scenario.id} scenario={s.scenario} />}
        {s.callout && <p className="mt-6 rounded-xl bg-accent/60 px-4 py-3 text-base font-medium text-accent-foreground">{s.callout}</p>}
      </div>
      <div className={`border-t px-5 pt-3 ${BOTTOM}`}>
        <Button size="lg" className={`h-14 w-full text-lg ${TAP}`} onClick={onContinue}>Continue</Button>
      </div>
    </>
  );
}

export function QuestionScreen({ item, picked, onPick, onContinue, label = "Quick check" }: { item: QuizQuestion | undefined; picked: number | null; onPick: (i: number) => void; onContinue: () => void; label?: string }) {
  if (!item) return null;
  const revealed = picked !== null;
  const right = picked === item.answer;
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-6 animate-in fade-in duration-300 motion-reduce:animate-none">
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary">{label}</p>
        <h2 className="mt-2 text-2xl font-bold leading-snug">{item.q}</h2>
        <div className="mt-6 grid gap-3" role="radiogroup">
          {item.options.map((o, oi) => {
            const isRight = oi === item.answer;
            const style = !revealed
              ? "border-border bg-card"
              : isRight ? "border-primary bg-accent text-accent-foreground"
              : oi === picked ? "border-destructive bg-destructive/15"
              : "border-border bg-card opacity-50";
            return (
              <button key={o} type="button" role="radio" aria-checked={picked === oi} disabled={revealed} onClick={() => onPick(oi)}
                className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold ${TAP} ${style}`}>
                {o}
                {revealed && isRight && <Check className="h-5 w-5 shrink-0 text-primary" />}
                {revealed && !isRight && oi === picked && <X className="h-5 w-5 shrink-0 text-destructive" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className={`border-t px-5 pt-4 ${BOTTOM} ${revealed ? (right ? "bg-accent" : "bg-destructive/15") : ""} ${revealed ? "animate-in slide-in-from-bottom-4 duration-200 motion-reduce:animate-none" : ""}`} aria-live="polite">
        {revealed && (
          <div className="mb-3">
            <p className={`text-lg font-bold ${right ? "text-primary" : "text-destructive"}`}>{right ? "Correct!" : "Not quite."}</p>
            <p className="mt-1 text-sm text-foreground/90">{item.explain}</p>
          </div>
        )}
        <Button size="lg" className={`h-14 w-full text-lg ${TAP}`} disabled={!revealed} onClick={onContinue}>Continue</Button>
      </div>
    </>
  );
}

function CompleteScreen({ lesson, result, answers, onRetry, onReview }: { lesson: Lesson; result: PhoneFinish; answers: number[]; onRetry: () => void; onReview: () => void }) {
  const { status } = useAuth();
  const next = nextCourseLesson(lesson.slug);
  const [saving, setSaving] = useState(false);
  // Decided once, as soon as sign-in status is known, so it can't flip mid-screen.
  const [offerSave, setOfferSave] = useState<boolean | null>(null);
  useEffect(() => {
    console.log("[savedbg]", offerSave, status, result.passed);
    if (offerSave !== null || status === "loading") return;
    setOfferSave(shouldShowSavePrompt({ slug: lesson.slug, passed: result.passed, signedOut: status === "signed-out", seen: readSavePromptSeen() }));
  }, [offerSave, status, lesson.slug, result.passed]);
  const missed = lesson.quiz.filter((q, i) => answers[i] !== q.answer);

  if (!result.passed) {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-5 pb-6 text-center animate-in fade-in duration-300 motion-reduce:animate-none">
          <h2 className="mt-10 text-3xl font-bold">Almost there</h2>
          <p className="mt-3 text-lg text-muted-foreground">You got {result.score} of {lesson.quiz.length}. You need {passMark(lesson)} to pass — one more go will do it.</p>
          {missed.length > 0 && (
            <ul className="mt-6 space-y-2 text-left">
              {missed.map((q) => (
                <li key={q.q} className="rounded-xl border bg-card p-3 text-sm"><span className="font-semibold">{q.q}</span><span className="mt-1 block text-muted-foreground">{q.explain}</span></li>
              ))}
            </ul>
          )}
        </div>
        <div className={`grid gap-3 border-t px-5 pt-3 ${BOTTOM}`}>
          <Button size="lg" className={`h-14 w-full text-lg ${TAP}`} onClick={onRetry}><RotateCcw /> Try the questions again</Button>
          <Button size="lg" variant="secondary" className={`h-12 w-full ${TAP}`} onClick={onReview}>Review the lesson</Button>
        </div>
      </>
    );
  }

  if (saving) return <SavePrompt lesson={lesson} streak={result.streak?.streak ?? 0} next={next} />;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-6 text-center">
        <div className="relative mx-auto mt-8 grid h-28 w-28 place-items-center">
          <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping motion-reduce:animate-none [animation-iteration-count:2]" aria-hidden />
          <span className="relative grid h-28 w-28 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow animate-in zoom-in-50 duration-500 motion-reduce:animate-none">
            <Check className="h-14 w-14" />
          </span>
        </div>
        <h2 className="mt-6 text-3xl font-bold">Lesson complete!</h2>
        <p className="mt-2 text-muted-foreground">{lesson.title}</p>
        <dl className="mt-8 grid grid-cols-2 gap-3 text-left">
          <Stat icon={<Flame className="h-5 w-5 text-orange-400" />} label="Day streak" value={String(result.streak?.streak ?? 0)} />
          <Stat icon={<Sparkles className="h-5 w-5 text-primary" />} label="XP earned" value={`+${result.xpGained}`} />
          <Stat icon={<Coins className="h-5 w-5 text-primary" />} label="Bonus cash" value={result.rewardGranted > 0 ? `+${fmt(result.rewardGranted)}` : "Collected"} />
          <Stat icon={<Check className="h-5 w-5 text-primary" />} label="Score" value={`${result.score} / ${lesson.quiz.length}`} />
        </dl>
        {result.rewardGranted > 0 && <p className="mt-4 text-sm text-muted-foreground">Bonus cash is waiting in your paper portfolio on the computer.</p>}
      </div>
      <div className={`border-t px-5 pt-3 ${BOTTOM}`}>
        {offerSave ? (
          <Button size="lg" className={`h-14 w-full text-lg shadow-glow ${TAP}`} onClick={() => setSaving(true)}>Continue <ArrowRight /></Button>
        ) : (
          <NextButton next={next} />
        )}
      </div>
    </>
  );
}

function NextButton({ next, onClick, variant }: { next: Lesson | undefined; onClick?: () => void; variant?: "secondary" }) {
  return (
    <Button asChild size="lg" variant={variant} className={`h-14 w-full text-lg ${variant ? "" : "shadow-glow"} ${TAP}`}>
      {next
        ? <Link to="/learn/$slug" params={{ slug: next.slug }} onClick={onClick}>{variant ? "Not now" : <>Next lesson <ArrowRight /></>}</Link>
        : <Link to="/learn" onClick={onClick}>{variant ? "Not now" : <>Back to the path <ArrowRight /></>}</Link>}
    </Button>
  );
}

/** Shown after the celebration for signed-out learners. Never blocks: "Not now" carries on. */
function SavePrompt({ lesson, streak, next }: { lesson: Lesson; streak: number; next: Lesson | undefined }) {
  const [xp, setXp] = useState(0);
  useEffect(() => {
    setXp(totalXp(getAllProgress(), practiceXp(getPracticeEntry())));
    markSavePromptSeen(lesson.slug);
    trackEvent("save_prompt_shown", { lesson_slug: lesson.slug });
  }, [lesson.slug]);
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-6 text-center animate-in fade-in duration-300 motion-reduce:animate-none">
        <h2 className="mt-10 text-3xl font-bold">Save your streak</h2>
        <p className="mx-auto mt-3 max-w-sm text-base text-muted-foreground">
          Right now your progress is only saved on this device and browser. Create a free account to keep it safe.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-3 text-left">
          <Stat icon={<Flame className="h-5 w-5 text-orange-400" />} label="Day streak" value={String(streak)} />
          <Stat icon={<Sparkles className="h-5 w-5 text-primary" />} label="Total XP" value={String(xp)} />
        </dl>
      </div>
      <div className={`grid gap-3 border-t px-5 pt-3 ${BOTTOM}`}>
        <Button asChild size="lg" className={`h-14 w-full text-lg shadow-glow ${TAP}`}>
          <Link to="/signup" search={{ next: "/learn" }} onClick={() => trackEvent("save_prompt_signup_click", { lesson_slug: lesson.slug })}>Create free account <ArrowRight /></Link>
        </Button>
        <NextButton next={next} variant="secondary" onClick={() => trackEvent("save_prompt_dismissed", { lesson_slug: lesson.slug })} />
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{icon}{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}
