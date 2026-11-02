// Day-trading mini-game: one fast "trading day", separate from the long-term portfolio.
// Prices are drawn as 5-minute candles. Higher levels unlock stop-loss / take-profit
// exits, limit orders and a bid/ask spread.

import { round2, STOCKS } from "./simulator";

export const DAY_CASH = 10000;
export const DAY_BARS = 78; // 5-minute bars in a 6.5-hour session
export const DAY_TICK_MS = 3000; // about 4 minutes per day
export const SPREAD = 0.0006; // advanced: buy at the ask, sell at the bid

export type Level = "beginner" | "intermediate" | "advanced";
export const LEVELS: { id: Level; title: string; blurb: string }[] = [
  { id: "beginner", title: "Beginner", blurb: "Candlestick chart with Buy and Sell, plus tips as you go." },
  { id: "intermediate", title: "Intermediate", blurb: "Adds stop-loss and take-profit lines you can drag on the chart." },
  { id: "advanced", title: "Advanced", blurb: "Adds limit orders, volume bars and a real bid/ask spread." },
];
export const hasExits = (l: Level) => l !== "beginner";
export const isAdvanced = (l: Level) => l === "advanced";

export type Candle = { o: number; h: number; l: number; c: number; v: number };
export type FillReason = "market" | "stop" | "target" | "limit";
export type Fill = { bar: number; side: "buy" | "sell"; shares: number; price: number; reason: FillReason; pnl?: number };
export type LimitOrder = { id: string; side: "buy" | "sell"; shares: number; price: number };

export type DayState = {
  sym: string;
  name: string;
  level: Level;
  candles: Candle[]; // candles[0] = opening bar
  cash: number;
  shares: number;
  cost: number; // total cost basis of shares held
  stop?: number | undefined;
  target?: number | undefined;
  limits: LimitOrder[];
  fills: Fill[]; // oldest first
};

const uid = () => Math.random().toString(36).slice(2, 9);
const volOf = (sym: string) => (STOCKS.find((s) => s.sym === sym)?.vol ?? 0.01) * 0.6;

export function newDay(level: Level = "beginner", rand: () => number = Math.random): DayState {
  const def = STOCKS[Math.floor(rand() * STOCKS.length)] ?? STOCKS[0]!;
  const o = def.price;
  return {
    sym: def.sym,
    name: def.name,
    level,
    candles: [{ o, h: o, l: o, c: o, v: 1500 }],
    cash: DAY_CASH,
    shares: 0,
    cost: 0,
    limits: [],
    fills: [],
  };
}

export const dayBar = (d: DayState) => d.candles.length - 1;
export const dayOpen = (d: DayState) => d.candles[0]!.o;
export const dayPrice = (d: DayState) => d.candles.at(-1)!.c;
export const dayOver = (d: DayState) => d.candles.length > DAY_BARS;
export const dayValue = (d: DayState) => round2(d.cash + d.shares * dayPrice(d));
export const askPrice = (d: DayState) => round2(dayPrice(d) * (isAdvanced(d.level) ? 1 + SPREAD : 1));
export const bidPrice = (d: DayState) => round2(dayPrice(d) * (isAdvanced(d.level) ? 1 - SPREAD : 1));
export const avgCost = (d: DayState) => (d.shares ? round2(d.cost / d.shares) : 0);

function buy(d: DayState, shares: number, price: number, reason: FillReason): DayState | null {
  const total = round2(shares * price);
  if (shares < 1 || total > d.cash + 1e-9) return null;
  return {
    ...d,
    cash: round2(d.cash - total),
    shares: d.shares + shares,
    cost: round2(d.cost + total),
    fills: [...d.fills, { bar: dayBar(d), side: "buy", shares, price, reason }],
  };
}

function sell(d: DayState, shares: number, price: number, reason: FillReason): DayState | null {
  if (shares < 1 || shares > d.shares) return null;
  const basis = (d.cost * shares) / d.shares;
  const pnl = round2(shares * price - basis);
  const left = d.shares - shares;
  return {
    ...d,
    cash: round2(d.cash + shares * price),
    shares: left,
    cost: left ? round2(d.cost - basis) : 0,
    // Exits only make sense while you hold shares.
    stop: left ? d.stop : undefined,
    target: left ? d.target : undefined,
    fills: [...d.fills, { bar: dayBar(d), side: "sell", shares, price, reason, pnl }],
  };
}

/** Market order at the current ask (buy) or bid (sell). */
export function dayTrade(d: DayState, side: "buy" | "sell", shares: number): DayState | null {
  if (dayOver(d) || !Number.isInteger(shares)) return null;
  return side === "buy" ? buy(d, shares, askPrice(d), "market") : sell(d, shares, bidPrice(d), "market");
}

export function setStop(d: DayState, price: number | undefined): DayState {
  return { ...d, stop: price === undefined ? undefined : round2(price) };
}
export function setTarget(d: DayState, price: number | undefined): DayState {
  return { ...d, target: price === undefined ? undefined : round2(price) };
}

export function placeLimit(d: DayState, side: "buy" | "sell", shares: number, price: number): DayState | null {
  if (dayOver(d) || !Number.isInteger(shares) || shares < 1 || !(price > 0)) return null;
  if (side === "buy" && shares * price > d.cash + 1e-9) return null;
  if (side === "sell" && shares > d.shares) return null;
  return { ...d, limits: [...d.limits, { id: uid(), side, shares, price: round2(price) }] };
}
export const cancelLimit = (d: DayState, id: string): DayState => ({ ...d, limits: d.limits.filter((o) => o.id !== id) });
export const moveLimit = (d: DayState, id: string, price: number): DayState => ({
  ...d,
  limits: d.limits.map((o) => (o.id === id ? { ...o, price: round2(price) } : o)),
});

/** Fill any orders the new candle traded through. Gaps fill at the open, like a real market. */
function triggerOrders(d: DayState, k: Candle): DayState {
  let s = d;
  // The stop is checked first: when a candle hits both, assume the worse outcome.
  if (s.shares && s.stop !== undefined && k.l <= s.stop) s = sell(s, s.shares, Math.min(s.stop, k.o), "stop") ?? s;
  if (s.shares && s.target !== undefined && k.h >= s.target) s = sell(s, s.shares, Math.max(s.target, k.o), "target") ?? s;
  for (const o of d.limits) {
    if (!s.limits.some((x) => x.id === o.id)) continue;
    const hit = o.side === "buy" ? k.l <= o.price : k.h >= o.price;
    if (!hit) continue;
    const without = { ...s, limits: s.limits.filter((x) => x.id !== o.id) };
    const price = o.side === "buy" ? Math.min(o.price, k.o) : Math.max(o.price, k.o);
    s = (o.side === "buy" ? buy(without, o.shares, price, "limit") : sell(without, Math.min(o.shares, without.shares), price, "limit")) ?? without;
  }
  return s;
}

/** Add the next 5-minute candle. Intraday moves are bigger and have no upward drift. */
export function stepDay(d: DayState, rand: () => number = Math.random): DayState {
  if (dayOver(d)) return d;
  const vol = volOf(d.sym);
  const o = dayPrice(d);
  let p = o, h = o, l = o;
  for (let i = 0; i < 4; i++) {
    p = Math.max(0.5, p * (1 + (rand() + rand() - 1) * vol * 0.9));
    h = Math.max(h, p);
    l = Math.min(l, p);
  }
  const c = round2(p);
  const bar = d.candles.length;
  // Volume is heaviest near the open and close, and on big moves.
  const session = 1 + 1.2 * Math.exp(-bar / 8) + 0.8 * Math.exp(-(DAY_BARS - bar) / 6);
  const v = Math.round(1000 * session * (0.6 + rand() * 0.8) * (1 + (Math.abs(c - o) / o / vol) * 0.8));
  const k: Candle = { o, h: round2(h), l: round2(l), c, v };
  return triggerOrders({ ...d, candles: [...d.candles, k] }, k);
}

/** Your result vs. simply buying at the open and holding to the close. */
export function dayRecap(d: DayState) {
  const pnl = round2(dayValue(d) - DAY_CASH);
  const open = dayOpen(d);
  const holdShares = Math.floor(DAY_CASH / open);
  const holdPnl = round2(holdShares * (dayPrice(d) - open));
  const sells = d.fills.filter((f) => f.side === "sell");
  const wins = sells.filter((f) => (f.pnl ?? 0) > 0).length;
  return { pnl, holdPnl, beatHold: pnl > holdPnl, trades: d.fills.length, wins, closedTrades: sells.length };
}

/** Beginner coaching, keyed by what's happening on the chart. */
export function beginnerTip(d: DayState): string {
  const bar = dayBar(d);
  const last = d.candles.at(-1)!;
  if (bar < 3) return "Each candle is 5 minutes. Green means the price ended higher than it started; red means lower.";
  if (bar < 8) return "The first half hour is often the jumpiest. Many traders wait for things to calm down before buying.";
  if (d.shares && dayPrice(d) < avgCost(d) * 0.99) return "You're down about 1% on this trade. Real traders decide in advance how much they'll lose before selling.";
  if (last.h - last.l > last.o * volOf(d.sym) * 2) return "Long thin lines (wicks) show the price swung a lot inside that candle before settling.";
  if (bar > DAY_BARS - 8) return "The closing bell is near. Day traders usually sell everything before 4:00 PM.";
  return d.shares ? "Watching a winner? Selling part of your shares locks in some profit." : "Look for a few candles in a row heading the same way. That's a trend.";
}
