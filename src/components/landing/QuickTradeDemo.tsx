import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const STAKE = 1000;
const PICKS = [
  { sym: "AAPL", price: 189.4, vol: 0.004 },
  { sym: "TSLA", price: 242.1, vol: 0.009 },
  { sym: "SPY", price: 512.3, vol: 0.002 },
];
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** Self-contained $1,000 mock trade for visitors — no account, nothing saved. */
export function QuickTradeDemo() {
  const [pick, setPick] = useState(PICKS[0]!);
  const [price, setPrice] = useState(pick.price);
  const [entry, setEntry] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setPrice(pick.price);
    timer.current = setInterval(() => setPrice((p) => +(p * (1 + (Math.random() - 0.48) * pick.vol * 2)).toFixed(2)), 700);
    return () => clearInterval(timer.current);
  }, [pick]);

  const shares = entry ? STAKE / entry : 0;
  const pl = entry ? shares * price - STAKE : 0;

  const buy = () => { setEntry(price); setResult(null); trackEvent("demo_trade_buy", { symbol: pick.sym }); };
  const sell = () => { setResult(pl); setEntry(null); trackEvent("demo_trade_sell", { symbol: pick.sym, pl }); };

  return (
    <div className="rounded-2xl border bg-card p-4 text-left shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Try a $1,000 mock trade</p>
        <span className="text-xs text-muted-foreground">No sign-up</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        {PICKS.map((p) => (
          <button key={p.sym} type="button" disabled={entry !== null} aria-pressed={pick.sym === p.sym} onClick={() => setPick(p)}
            className={`min-h-10 rounded-md text-sm font-semibold disabled:opacity-60 ${pick.sym === p.sym ? "bg-card text-foreground" : "text-muted-foreground"}`}>
            {p.sym}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <p className="font-display text-2xl font-bold tabular-nums">{usd(price)}</p>
        {entry !== null && (
          <p className={`text-sm font-semibold tabular-nums ${pl >= 0 ? "text-primary" : "text-destructive"}`}>{pl >= 0 ? "+" : "−"}{usd(Math.abs(pl))}</p>
        )}
      </div>
      {result !== null && (
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          You {result >= 0 ? "made" : "lost"} <span className={result >= 0 ? "text-primary" : "text-destructive"}>{usd(Math.abs(result))}</span> in fake money. Prices move both ways — that's the lesson.
        </p>
      )}
      {entry === null
        ? <Button className="mt-3 min-h-12 w-full text-base" onClick={buy}>Buy $1,000 of {pick.sym}</Button>
        : <Button variant="destructive" className="mt-3 min-h-12 w-full text-base" onClick={sell}>Sell now</Button>}
    </div>
  );
}

/** Shares the site link (native share sheet on phones), falling back to an email draft. */
export function SendToLaptop() {
  const send = async () => {
    const url = window.location.origin + "/simulator";
    trackEvent("send_to_laptop");
    const data = { title: "Stockify Learn", text: "Open the full trading workstation on my laptop", url };
    if (navigator.share) { try { await navigator.share(data); return; } catch { return; } }
    window.location.href = `mailto:?subject=${encodeURIComponent("Stockify Learn workstation")}&body=${encodeURIComponent(url)}`;
  };
  return (
    <button type="button" onClick={send} className="min-h-11 w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
      Send link to laptop for full desktop workstation
    </button>
  );
}
