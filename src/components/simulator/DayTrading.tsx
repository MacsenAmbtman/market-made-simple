import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceChart } from "@/components/simulator/charts";
import { trackEvent } from "@/lib/analytics";
import { DAY_BARS, DAY_CASH, DAY_TICK_MS, dayOver, dayPrice, dayRecap, dayTrade, dayValue, newDay, stepDay, type DayState } from "@/lib/daytrade";
import { fmt } from "@/lib/simulator";

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;

function clock(bar: number) {
  const mins = 9 * 60 + 30 + bar * 5;
  const h = Math.floor(mins / 60);
  return `${((h + 11) % 12) + 1}:${String(mins % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function DayTrading() {
  const [day, setDay] = useState<DayState | null>(null);
  const [qty, setQty] = useState("10");
  const [error, setError] = useState("");
  const ref = useRef(day);
  ref.current = day;

  const running = !!day && !dayOver(day);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && ref.current) setDay(stepDay(ref.current));
    }, DAY_TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  const start = () => { trackEvent("daytrade_start"); setError(""); setDay(newDay()); };

  if (!day) {
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-2xl border bg-card p-6 text-center shadow-card sm:p-8">
        <h2 className="font-display text-2xl font-bold">One trading day in about 4 minutes</h2>
        <p className="mt-3 text-muted-foreground">
          You get {fmt(DAY_CASH)} and one stock. Buy low, sell high, and finish before the closing bell. Any shares you still hold count at the closing price.
        </p>
        <Button size="lg" className="mt-6 h-12 w-full sm:w-auto" onClick={start}><Play /> Start the day</Button>
        <p className="mt-4 text-xs text-muted-foreground">This is separate from your long-term portfolio.</p>
      </div>
    );
  }

  const price = dayPrice(day);
  const open = day.prices[0]!;
  const move = ((price - open) / open) * 100;
  const value = dayValue(day);
  const bar = day.prices.length - 1;

  const trade = (side: "buy" | "sell") => {
    const n = Number(qty);
    const next = dayTrade(day, side, n);
    if (!next) {
      setError(side === "buy" ? "Not enough cash for that many shares." : "You don't own that many shares.");
      return;
    }
    trackEvent("daytrade_trade", { side, shares: n });
    setError("");
    setDay(next);
  };

  if (dayOver(day)) {
    const r = dayRecap(day);
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <p className="text-sm text-muted-foreground">Closing bell · {day.name}</p>
        <h2 className={`mt-1 font-display text-4xl font-bold tabular-nums ${r.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{signed(r.pnl)}</h2>
        <p className="mt-1 text-muted-foreground">today, across {day.trades} {day.trades === 1 ? "trade" : "trades"}</p>
        <div className="mt-5 rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">If you had bought at the open and done nothing</p>
          <p className={`font-display text-xl font-bold tabular-nums ${r.holdPnl >= 0 ? "text-primary" : "text-destructive"}`}>{signed(r.holdPnl)}</p>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          {r.beatHold ? "Nice — you beat buy-and-hold today. " : "Buy-and-hold did as well or better today. "}
          In real life, most people who day trade lose money over time, and fees make it harder still. Practising here is free, so use it to learn how fast prices can turn.
        </p>
        <Button size="lg" className="mt-6 h-12 w-full" onClick={start}><RotateCcw /> Play another day</Button>
      </div>
    );
  }

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
      <div className="sticky top-16 z-10 min-w-0 rounded-2xl border bg-card p-4 shadow-card sm:p-5 lg:static">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-2xl font-bold tabular-nums">{fmt(price)}</p>
            <p className={`text-sm ${move >= 0 ? "text-primary" : "text-destructive"}`}>{move >= 0 ? "+" : ""}{move.toFixed(2)}%</p>
            <p className="text-sm text-muted-foreground">{day.sym}</p>
          </div>
          <p className="text-sm tabular-nums text-muted-foreground">{clock(bar)} · closes 4:00 PM</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(bar / DAY_BARS) * 100}%` }} />
        </div>
        <div className="mt-4 h-44 lg:h-72"><PriceChart data={day.prices} tick={bar} /></div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-muted-foreground">Cash</p><p className="font-semibold tabular-nums">{fmt(day.cash)}</p></div>
          <div><p className="text-muted-foreground">Shares</p><p className="font-semibold tabular-nums">{day.shares}</p></div>
          <div className="col-span-2"><p className="text-muted-foreground">Today</p><p className={`font-display text-xl font-bold tabular-nums ${value >= DAY_CASH ? "text-primary" : "text-destructive"}`}>{signed(value - DAY_CASH)}</p></div>
        </div>
        <label className="mt-4 block text-sm text-muted-foreground" htmlFor="day-qty">Shares</label>
        <Input
          id="day-qty"
          inputMode="numeric"
          value={qty}
          onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
          className="mt-1 h-12 text-base"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button className="h-12 text-base" onClick={() => trade("buy")}>Buy</Button>
          <Button className="h-12 text-base" variant="destructive" onClick={() => trade("sell")}>Sell</Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
      </div>
    </div>
  );
}
