import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Minus, RotateCcw, ShoppingCart, Siren, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/simulator";
import { BUY_SHARES, buildPath, POST_POINTS, PRE_POINTS, scenarioOutcome, type Scenario, type ScenarioChoice } from "@/lib/scenarios";

type Phase = "warmup" | "decide" | "reacting" | "done";
const STEP_MS = 110;

const choices: { value: ScenarioChoice; label: string; icon: typeof Minus; hint: (s: Scenario) => string }[] = [
  { value: "buy", label: "Buy", icon: ShoppingCart, hint: () => `Buy ${BUY_SHARES} more shares` },
  { value: "hold", label: "Hold", icon: Minus, hint: () => "Do nothing" },
  { value: "sell", label: "Sell", icon: TrendingDown, hint: (s) => `Sell all ${s.owned} shares` },
];

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;
const pctChange = (a: number, b: number) => ((b - a) / a) * 100;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** A live mini-market: quiet trading, a breaking headline, the learner's decision, then the price reaction. */
export function ScenarioCard({ scenario: s }: { scenario: Scenario }) {
  const path = useMemo(() => buildPath(s), [s]);
  const [phase, setPhase] = useState<Phase>("warmup");
  const [visible, setVisible] = useState(1);
  const [choice, setChoice] = useState<ScenarioChoice | null>(null);

  // Reveal points one at a time: pre-news on mount, then the reaction after a decision.
  const limit = phase === "warmup" ? PRE_POINTS : PRE_POINTS + POST_POINTS;
  useEffect(() => {
    if (phase !== "warmup" && phase !== "reacting") return;
    if (reducedMotion()) return setVisible(limit);
    const id = setInterval(() => setVisible((v) => Math.min(v + 1, limit)), STEP_MS);
    return () => clearInterval(id);
  }, [phase, limit]);

  useEffect(() => {
    if (phase === "warmup" && visible >= PRE_POINTS) setPhase("decide");
    if (phase === "reacting" && visible >= PRE_POINTS + POST_POINTS) setPhase("done");
  }, [phase, visible]);

  const decide = (c: ScenarioChoice) => {
    setChoice(c);
    setPhase("reacting");
  };
  const retry = () => {
    setChoice(null);
    setVisible(PRE_POINTS);
    setPhase("decide");
  };

  const data = path.slice(0, visible).map((price, i) => ({ i, price }));
  const current = path[visible - 1] ?? s.startPrice;
  const up = current >= s.startPrice;
  const outcome = choice ? scenarioOutcome(s, choice, path) : null;
  const newsHit = phase !== "warmup";

  return (
    <div className="mt-6 overflow-hidden rounded-xl border bg-background/40">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2 text-xs">
        <span className="flex items-center gap-2 font-semibold">
          {s.sym} <span className="font-normal text-muted-foreground">{s.company}</span>
        </span>
        <span className="flex items-center gap-1.5 tabular-nums">
          <span className={`h-1.5 w-1.5 rounded-full ${phase === "done" ? "bg-muted-foreground" : "animate-pulse bg-primary"}`} />
          {fmt(current)}
          <span className={up ? "text-primary" : "text-destructive"}>{pctChange(s.startPrice, current) >= 0 ? "+" : ""}{pctChange(s.startPrice, current).toFixed(1)}%</span>
        </span>
      </div>

      <div className="h-36 px-2 pt-2" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <XAxis hide dataKey="i" type="number" domain={[0, PRE_POINTS + POST_POINTS - 1]} />
            <YAxis hide domain={[Math.min(...path) * 0.995, Math.max(...path) * 1.005]} />
            <ReferenceLine y={s.startPrice} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.4} />
            {visible > PRE_POINTS && <ReferenceLine x={PRE_POINTS} stroke="var(--muted-foreground)" strokeOpacity={0.6} label={{ value: "News", fill: "var(--muted-foreground)", fontSize: 10, position: "insideTopLeft" }} />}
            <Line type="monotone" dataKey="price" dot={false} strokeWidth={2} stroke={up ? "var(--primary)" : "var(--destructive)"} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t p-4">
        {!newsHit ? (
          <p className="text-sm text-muted-foreground">Markets are quiet. You own {s.owned} shares of {s.sym} at {fmt(s.startPrice)}…</p>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive"><Siren className="h-3.5 w-3.5" />Breaking · {s.source}</p>
            <p className="mt-1 font-semibold">{s.headline}</p>
          </div>
        )}

        {phase === "decide" && (
          <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Your decision">
            {choices.map(({ value, label, icon: Icon, hint }) => (
              <button key={value} type="button" onClick={() => decide(value)} className="flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition hover:border-primary hover:bg-muted">
                <Icon className="h-4 w-4" aria-hidden />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[11px] text-muted-foreground">{hint(s)}</span>
              </button>
            ))}
          </div>
        )}

        {phase === "reacting" && <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">You chose <span className="font-semibold capitalize text-foreground">{choice}</span>. Watching the market react…</p>}

        {phase === "done" && choice && outcome && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">You chose <span className="font-semibold capitalize">{choice}</span></span>
              {s.best && (choice === s.best
                ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">Strong move</span>
                : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Consider: {s.best}</span>)}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <dt className="text-xs text-muted-foreground">Price move</dt>
                <dd className="tabular-nums">{fmt(s.startPrice)} → {fmt(outcome.endPrice)}</dd>
              </div>
              {outcome.fillPrice != null && (
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <dt className="text-xs text-muted-foreground">Your {choice} filled at</dt>
                  <dd className="tabular-nums">
                    {fmt(outcome.fillPrice)}
                    {outcome.fillPrice !== outcome.newsPrice && <span className="block text-xs text-muted-foreground">last price was {fmt(outcome.newsPrice)}</span>}
                  </dd>
                </div>
              )}
              <div className="rounded-lg bg-muted/50 p-2.5">
                <dt className="text-xs text-muted-foreground">Your result</dt>
                <dd className={`font-semibold tabular-nums ${outcome.pnl >= 0 ? "text-primary" : "text-destructive"}`}>
                  {signed(outcome.pnl)}
                  {choice !== "hold" && <span className="block text-xs font-normal text-muted-foreground">Holding: {signed(outcome.holdPnl)}</span>}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.feedback[choice]}</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={retry}><RotateCcw /> Try a different choice</Button>
          </div>
        )}
      </div>
    </div>
  );
}
