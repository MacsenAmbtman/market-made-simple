import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lightbulb, Play, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CandleChart, type ChartLine } from "@/components/simulator/CandleChart";
import { trackEvent } from "@/lib/analytics";
import {
  askPrice, avgCost, beginnerTip, bidPrice, cancelLimit, DAY_BARS, DAY_CASH, DAY_TICK_MS, dayBar, dayOpen, dayOver, dayPrice,
  dayRecap, dayTrade, dayValue, hasExits, isAdvanced, LEVELS, moveLimit, newDay, placeLimit, setStop, setTarget, stepDay, groupCandles, orderBook,
  type DayState, type Fill, type Level,
} from "@/lib/daytrade";
import { fmt, round2 } from "@/lib/simulator";

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;
const REASON: Record<Fill["reason"], string> = { market: "Market", stop: "Stop-loss", target: "Take-profit", limit: "Limit" };

function clock(bar: number) {
  const mins = 9 * 60 + 30 + bar * 5;
  const h = Math.floor(mins / 60);
  return `${((h + 11) % 12) + 1}:${String(mins % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function announce(f: Fill, sym: string) {
  const what = `${f.side === "buy" ? "Bought" : "Sold"} ${f.shares} ${sym} at ${fmt(f.price)}`;
  const desc = f.pnl !== undefined ? `${signed(f.pnl)} on this trade` : undefined;
  if (f.reason === "stop") toast.error(`Stop-loss hit: ${what}`, { description: desc });
  else if (f.reason === "target") toast.success(`Take-profit hit: ${what}`, { description: desc });
  else toast(`Order filled: ${what}`, { description: desc });
}

export function DayTrading() {
  const [day, setDay] = useState<DayState | null>(null);
  const [level, setLevel] = useState<Level>("beginner");
  const [qty, setQty] = useState("10");
  const [limitPrice, setLimitPrice] = useState("");
  const [error, setError] = useState("");
  const [group, setGroup] = useState(1);
  const ref = useRef(day);
  ref.current = day;
  const seen = useRef(0);

  const running = !!day && !dayOver(day);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && ref.current) setDay(stepDay(ref.current));
    }, DAY_TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  // Pop up every fill once, including ones triggered automatically by the chart.
  useEffect(() => {
    if (!day) return;
    day.fills.slice(seen.current).forEach((f) => announce(f, day.sym));
    seen.current = day.fills.length;
  }, [day]);

  const start = () => {
    trackEvent("daytrade_start", { level });
    setError("");
    setLimitPrice("");
    seen.current = 0;
    setDay(newDay(level));
  };

  if (!day) {
    return (
      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <h2 className="text-center font-display text-2xl font-bold">One trading day in about 4 minutes</h2>
        <p className="mt-3 text-center text-muted-foreground">
          You get {fmt(DAY_CASH)} and one stock. Buy low, sell high, and finish before the closing bell.
        </p>
        <p className="mt-6 text-sm font-medium">Choose your level</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Level">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={level === l.id}
              onClick={() => setLevel(l.id)}
              className={`rounded-xl border p-4 text-left transition-colors hover:border-primary/60 ${level === l.id ? "border-primary bg-accent" : ""}`}
            >
              <p className="font-display font-bold">{l.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{l.blurb}</p>
            </button>
          ))}
        </div>
        <Button size="lg" className="mt-6 h-12 w-full" onClick={start}><Play /> Start the day</Button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New to this? <Link to="/learn/$slug" params={{ slug: "day-trading-basics" }} className="text-primary hover:underline">Take the Day Trading Basics lesson first</Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">This is separate from your long-term portfolio.</p>
      </div>
    );
  }

  const price = dayPrice(day);
  const open = dayOpen(day);
  const move = ((price - open) / open) * 100;
  const value = dayValue(day);
  const bar = dayBar(day);
  const exits = hasExits(day.level);
  const adv = isAdvanced(day.level);
  const levelTitle = LEVELS.find((l) => l.id === day.level)!.title;

  const act = (next: DayState | null, msg: string) => {
    if (!next) return setError(msg);
    setError("");
    setDay(next);
  };
  const trade = (side: "buy" | "sell") => {
    const n = Number(qty);
    trackEvent("daytrade_trade", { side, shares: n, level: day.level });
    act(dayTrade(day, side, n), side === "buy" ? "Not enough cash for that many shares." : "You don't own that many shares.");
  };
  const limit = (side: "buy" | "sell") => {
    const p = Number(limitPrice);
    trackEvent("daytrade_limit", { side });
    act(placeLimit(day, side, Number(qty), p), side === "buy" ? "Enter a price, and make sure you have the cash." : "Enter a price, and make sure you own the shares.");
  };

  const lines: ChartLine[] = [{ id: "last", price, label: "Now", tone: "muted" }];
  if (day.shares) lines.push({ id: "avg", price: avgCost(day), label: "Your buy", tone: "muted" });
  if (day.stop !== undefined) lines.push({ id: "stop", price: day.stop, label: "Stop-loss", tone: "down", onDrag: (p) => setDay((d) => d && setStop(d, p)) });
  if (day.target !== undefined) lines.push({ id: "target", price: day.target, label: "Take-profit", tone: "up", onDrag: (p) => setDay((d) => d && setTarget(d, p)) });
  for (const o of day.limits) lines.push({ id: o.id, price: o.price, label: `Limit ${o.side}`, tone: o.side === "buy" ? "up" : "down", onDrag: (p) => setDay((d) => d && moveLimit(d, o.id, p)) });

  const fillList = (
    <ul className="divide-y text-sm">
      {[...day.fills].reverse().map((f, i) => (
        <li key={i} className="flex items-center justify-between gap-2 py-2">
          <span>
            <span className={f.side === "buy" ? "text-primary" : "text-destructive"}>{f.side === "buy" ? "Buy" : "Sell"}</span> {f.shares} at {fmt(f.price)}
            <span className="block text-xs text-muted-foreground">{clock(f.bar)} · {REASON[f.reason]}</span>
          </span>
          {f.pnl !== undefined && <span className={`tabular-nums ${f.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{signed(f.pnl)}</span>}
        </li>
      ))}
    </ul>
  );

  if (dayOver(day)) {
    const r = dayRecap(day);
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <p className="text-sm text-muted-foreground">Closing bell · {day.name} · {levelTitle}</p>
        <h2 className={`mt-1 font-display text-4xl font-bold tabular-nums ${r.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{signed(r.pnl)}</h2>
        <p className="mt-1 text-muted-foreground">
          today, across {r.trades} {r.trades === 1 ? "order" : "orders"}
          {r.closedTrades > 0 && ` · ${r.wins} of ${r.closedTrades} sells made money`}
        </p>
        <div className="mt-5 rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">If you had bought at the open and done nothing</p>
          <p className={`font-display text-xl font-bold tabular-nums ${r.holdPnl >= 0 ? "text-primary" : "text-destructive"}`}>{signed(r.holdPnl)}</p>
        </div>
        <div className="mt-5"><CandleChart candles={day.candles} slots={DAY_BARS + 1} height={180} /></div>
        {day.fills.length > 0 && <div className="mt-4"><p className="text-sm font-medium">Your trades</p>{fillList}</div>}
        <p className="mt-5 text-sm text-muted-foreground">
          {r.beatHold ? "Nice — you beat buy-and-hold today. " : "Buy-and-hold did as well or better today. "}
          In real life, most people who day trade lose money over time, and fees make it harder still. Practising here is free, so use it to learn how fast prices can turn.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button size="lg" className="h-12" onClick={start}><RotateCcw /> Play another day</Button>
          <Button size="lg" variant="secondary" className="h-12" onClick={() => setDay(null)}>Change level</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 grid items-start gap-6 md:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-3">
              <p className="font-display text-2xl font-bold tabular-nums">{fmt(price)}</p>
              <p className={`text-sm ${move >= 0 ? "text-primary" : "text-destructive"}`}>{move >= 0 ? "+" : ""}{move.toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground">{day.sym} · {levelTitle}</p>
            </div>
            <p className="text-sm tabular-nums text-muted-foreground">{clock(bar)} · closes 4:00 PM</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${(bar / DAY_BARS) * 100}%` }} />
          </div>
          <div className="mt-3 flex gap-1" role="group" aria-label="Candle interval">
            {[1, 3, 6].map((g) => (
              <Button key={g} size="sm" variant={group === g ? "default" : "ghost"} aria-pressed={group === g} onClick={() => { setGroup(g); trackEvent("chart_interval", { minutes: g * 5 }); }}>
                {g * 5}m
              </Button>
            ))}
          </div>
          <div className="mt-2">
            <CandleChart candles={groupCandles(day.candles, group)} slots={Math.ceil((DAY_BARS + 1) / group)} lines={lines} showVolume={adv} height={adv ? 320 : 280} />
          </div>
          {exits && (day.stop !== undefined || day.target !== undefined || day.limits.length > 0) && (
            <p className="mt-2 text-xs text-muted-foreground">Drag the coloured lines up or down to move your orders.</p>
          )}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <OrderBook price={price} bar={bar} />
          <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
            <p className="font-semibold">Active position</p>
            {day.shares > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Symbol</p><p className="font-semibold">{day.sym}</p></div>
                <div><p className="text-muted-foreground">Shares</p><p className="font-semibold tabular-nums">{day.shares}</p></div>
                <div><p className="text-muted-foreground">Avg cost</p><p className="font-semibold tabular-nums">{fmt(avgCost(day))}</p></div>
                <div><p className="text-muted-foreground">Market value</p><p className="font-semibold tabular-nums">{fmt(day.shares * price)}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Unrealized P/L</p><p className={`font-display text-lg font-bold tabular-nums ${price >= avgCost(day) ? "text-primary" : "text-destructive"}`}>{signed(day.shares * (price - avgCost(day)))}</p></div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No open position. Buy shares to see live profit and loss here.</p>
            )}
          </div>
        </div>
        {day.level === "beginner" && (
          <div className="flex gap-3 rounded-2xl border bg-card p-4 text-sm shadow-card" aria-live="polite">
            <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
            <p>{beginnerTip(day)}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground">Cash</p><p className="font-semibold tabular-nums">{fmt(day.cash)}</p></div>
            <div><p className="text-muted-foreground">Shares</p><p className="font-semibold tabular-nums">{day.shares}{day.shares > 0 && <span className="font-normal text-muted-foreground"> @ {fmt(avgCost(day))}</span>}</p></div>
            <div className="col-span-2"><p className="text-muted-foreground">Today</p><p className={`font-display text-xl font-bold tabular-nums ${value >= DAY_CASH ? "text-primary" : "text-destructive"}`}>{signed(value - DAY_CASH)}</p></div>
          </div>
          {adv && (
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border p-3 text-sm">
              <div><p className="text-muted-foreground">Bid (you sell)</p><p className="font-semibold tabular-nums text-destructive">{fmt(bidPrice(day))}</p></div>
              <div><p className="text-muted-foreground">Ask (you buy)</p><p className="font-semibold tabular-nums text-primary">{fmt(askPrice(day))}</p></div>
            </div>
          )}
          <label className="mt-4 block text-sm text-muted-foreground" htmlFor="day-qty">Shares</label>
          <Input id="day-qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} className="mt-1 h-12 text-base" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button className="h-12 text-base" onClick={() => trade("buy")}>Buy now</Button>
            <Button className="h-12 text-base" variant="destructive" onClick={() => trade("sell")}>Sell now</Button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
        </div>

        {exits && (
          <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
            <p className="font-semibold">Automatic exits</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {day.shares ? "Sell all your shares automatically if the price reaches a line." : "Buy some shares first, then set where you'd sell."}
            </p>
            <div className="mt-3 grid gap-3">
              <ExitRow
                label="Stop-loss"
                hint="Sell if it falls to"
                tone="down"
                value={day.stop}
                disabled={!day.shares}
                onAdd={() => setDay(setStop(day, round2(avgCost(day) * 0.99)))}
                onClear={() => setDay(setStop(day, undefined))}
              />
              <ExitRow
                label="Take-profit"
                hint="Sell if it rises to"
                tone="up"
                value={day.target}
                disabled={!day.shares}
                onAdd={() => setDay(setTarget(day, round2(avgCost(day) * 1.02)))}
                onClear={() => setDay(setTarget(day, undefined))}
              />
            </div>
          </div>
        )}

        {adv && (
          <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
            <p className="font-semibold">Limit order</p>
            <p className="mt-1 text-sm text-muted-foreground">Waits until the price reaches your number, then fills.</p>
            <label className="mt-3 block text-sm text-muted-foreground" htmlFor="day-limit">Price</label>
            <Input id="day-limit" inputMode="decimal" placeholder={price.toFixed(2)} value={limitPrice} onChange={(e) => setLimitPrice(e.target.value.replace(/[^\d.]/g, ""))} className="mt-1 h-12 text-base" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button variant="secondary" className="h-12" onClick={() => limit("buy")}>Limit buy</Button>
              <Button variant="secondary" className="h-12" onClick={() => limit("sell")}>Limit sell</Button>
            </div>
            {day.limits.length > 0 && (
              <ul className="mt-3 divide-y text-sm">
                {day.limits.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2">
                    <span>{o.side === "buy" ? "Buy" : "Sell"} {o.shares} at {fmt(o.price)}</span>
                    <Button size="icon" variant="ghost" aria-label="Cancel order" onClick={() => setDay(cancelLimit(day, o.id))}><X /></Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {day.fills.length > 0 && (
          <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
            <p className="font-semibold">Today's trades</p>
            {fillList}
          </div>
        )}
      </div>
    </div>
  );
}

function ExitRow({ label, hint, tone, value, disabled, onAdd, onClear }: {
  label: string; hint: string; tone: "up" | "down"; value: number | undefined; disabled: boolean; onAdd: () => void; onClear: () => void;
}) {
  const color = tone === "up" ? "text-primary" : "text-destructive";
  if (value === undefined)
    return <Button variant="secondary" className="h-12 justify-start" disabled={disabled} onClick={onAdd}>Add {label.toLowerCase()}</Button>;
  return (
    <div className="flex items-center justify-between rounded-xl border px-3 py-2">
      <div>
        <p className={`text-sm font-medium ${color}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{hint} {fmt(value)}</p>
      </div>
      <Button size="icon" variant="ghost" aria-label={`Remove ${label}`} onClick={onClear}><X /></Button>
    </div>
  );
}

function OrderBook({ price, bar }: { price: number; bar: number }) {
  const { bids, asks } = orderBook(price, bar);
  const max = Math.max(...bids.map((b) => b.size), ...asks.map((a) => a.size));
  const Row = ({ p, size, side }: { p: number; size: number; side: "bid" | "ask" }) => (
    <li className="relative flex justify-between px-2 py-0.5 tabular-nums">
      <span className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-primary/10" : "bg-destructive/10"}`} style={{ width: `${(size / max) * 100}%` }} aria-hidden />
      <span className={`relative ${side === "bid" ? "text-primary" : "text-destructive"}`}>{fmt(p)}</span>
      <span className="relative text-muted-foreground">{size}</span>
    </li>
  );
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
      <div className="flex justify-between"><p className="font-semibold">Order book</p><p className="text-xs text-muted-foreground">Price · Shares</p></div>
      <ul className="mt-2 text-sm">{[...asks].reverse().map((a) => <Row key={a.price} p={a.price} size={a.size} side="ask" />)}</ul>
      <p className="my-1 border-y py-1 text-center font-display font-bold tabular-nums">{fmt(price)}</p>
      <ul className="text-sm">{bids.map((b) => <Row key={b.price} p={b.price} size={b.size} side="bid" />)}</ul>
    </div>
  );
}
