import { useRef, useState } from "react";
import { Check, RotateCcw, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

type Call = "buy" | "pass";
export type SwipeCard = { sym: string; name: string; headline: string; trend: number[]; answer: Call; why: string };

export const SWIPE_CARDS: SwipeCard[] = [
  { sym: "NVDA", name: "Chip maker", headline: "Raises next-quarter sales forecast by 15% after demand surges.", trend: [40, 44, 43, 50, 55, 62], answer: "buy", why: "A higher forecast means more expected profit. Good surprises tend to lift the price." },
  { sym: "CAFE", name: "Coffee chain", headline: "Closing 200 stores after two quarters of falling sales.", trend: [60, 57, 52, 50, 45, 41], answer: "pass", why: "Shrinking sales and closures signal trouble. Buying a falling business is risky." },
  { sym: "SHOE", name: "Sneaker brand", headline: "Stock jumped 40% this week on a viral social media post. Nothing else changed.", trend: [30, 31, 33, 45, 58, 70], answer: "pass", why: "Hype without new earnings often fades. Chasing a spike can mean buying the top." },
  { sym: "BANK", name: "Big bank", headline: "Steady profits for 10 years and pays a growing dividend.", trend: [40, 42, 45, 47, 50, 53], answer: "buy", why: "Reliable profits and dividends are classic long-term investor favourites." },
  { sym: "PILL", name: "Drug company", headline: "Its main drug just failed a key safety trial.", trend: [70, 68, 69, 50, 44, 42], answer: "pass", why: "A failed trial can wipe out future revenue. Wait until the dust settles." },
];

const THRESHOLD = 90;

function Trend({ points }: { points: number[] }) {
  const max = Math.max(...points), min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${40 - ((p - min) / (max - min || 1)) * 36 - 2}`).join(" ");
  const up = points[points.length - 1]! >= points[0]!;
  return (
    <svg viewBox="0 0 100 40" className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline points={d} fill="none" strokeWidth="2.5" vectorEffect="non-scaling-stroke" className={up ? "stroke-primary" : "stroke-destructive"} />
    </svg>
  );
}

export function SwipeDeck() {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [result, setResult] = useState<{ call: Call; card: SwipeCard } | null>(null);
  const [score, setScore] = useState(0);
  const start = useRef<number | null>(null);

  const done = i >= SWIPE_CARDS.length;
  const card = SWIPE_CARDS[i];

  const decide = (call: Call) => {
    if (!card || result) return;
    const right = call === card.answer;
    if (right) setScore((s) => s + 1);
    trackEvent("swipe_answer", { sym: card.sym, call, correct: right });
    setDx(0);
    setResult({ call, card });
  };
  const next = () => { setResult(null); setDx(0); setI((n) => n + 1); };
  const restart = () => { setI(0); setScore(0); setResult(null); setDx(0); };

  if (done) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-center shadow-card">
        <p className="text-sm text-muted-foreground">Deck complete</p>
        <p className="mt-1 font-display text-4xl font-bold text-primary">{score} / {SWIPE_CARDS.length}</p>
        <p className="mt-2 text-muted-foreground">{score >= 4 ? "Sharp instincts." : "Every swipe teaches you something."}</p>
        <Button variant="secondary" className="mt-5 min-h-12 w-full text-base" onClick={restart}><RotateCcw /> Play again</Button>
      </div>
    );
  }

  const tilt = dx / 20;
  const hint = result ? result.call : dx > 30 ? "buy" : dx < -30 ? "pass" : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold uppercase tracking-wider text-primary">Buy or pass</span>
        <span className="text-muted-foreground tabular-nums">{i + 1} / {SWIPE_CARDS.length} · Score {score}</span>
      </div>
      <div className="relative h-80 touch-pan-y select-none">
        {SWIPE_CARDS[i + 1] && <div className="absolute inset-0 translate-y-2 scale-95 rounded-3xl border bg-card/60" aria-hidden />}
        <div
          className="absolute inset-0 flex flex-col rounded-3xl border bg-card p-5 shadow-card"
          style={{ transform: `translateX(${dx}px) rotate(${tilt}deg)`, transition: start.current === null ? "transform 0.3s ease" : "none" }}
          onPointerDown={(e) => { if (result) return; start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
          onPointerMove={(e) => { if (start.current !== null) setDx(e.clientX - start.current); }}
          onPointerUp={() => {
            if (start.current === null) return;
            start.current = null;
            if (dx > THRESHOLD) decide("buy");
            else if (dx < -THRESHOLD) decide("pass");
            else setDx(0);
          }}
          onPointerCancel={() => { start.current = null; setDx(0); }}
        >
          {hint && (
            <span className={`absolute top-5 rounded-lg border-2 px-3 py-1 font-display text-lg font-bold ${hint === "buy" ? "left-5 border-primary text-primary" : "right-5 border-destructive text-destructive"}`}>
              {hint === "buy" ? "BUY" : "PASS"}
            </span>
          )}
          <p className="mt-10 font-display text-3xl font-bold">{card!.sym}</p>
          <p className="text-sm text-muted-foreground">{card!.name}</p>
          <p className="mt-4 text-lg font-semibold leading-snug">{card!.headline}</p>
          <div className="mt-auto"><Trend points={card!.trend} /></div>
        </div>
      </div>

      {result ? (
        <div className={`mt-4 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 ${result.call === result.card.answer ? "bg-primary/10" : "bg-destructive/10"}`} aria-live="polite">
          <p className={`flex items-center gap-2 font-semibold ${result.call === result.card.answer ? "text-primary" : "text-destructive"}`}>
            {result.call === result.card.answer ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            {result.call === result.card.answer ? "Good call" : `Most investors would ${result.card.answer}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{result.card.why}</p>
          <Button className="mt-3 min-h-12 w-full text-base" onClick={next}>Next card</Button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="min-h-14 text-base" onClick={() => decide("pass")}><ThumbsDown /> Pass</Button>
          <Button className="min-h-14 text-base" onClick={() => decide("buy")}><ThumbsUp /> Buy</Button>
        </div>
      )}
      <p className="mt-2 text-center text-xs text-muted-foreground">Swipe right to buy, left to pass</p>
    </div>
  );
}

export function DesktopCTA() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-accent p-5 text-center">
      <p className="font-semibold">Want to execute real paper strategies?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Open <span className="font-semibold text-primary">stockifylearn.lovable.app</span> on your desktop for candlestick charts, stop-loss and limit orders, and the full trading workstation.
      </p>
    </div>
  );
}
