// Day-trading mini-game: one fast "trading day", separate from the long-term portfolio.

import { round2, STOCKS } from "./simulator";

export const DAY_CASH = 10000;
export const DAY_BARS = 78; // 5-minute bars in a 6.5-hour session
export const DAY_TICK_MS = 3000; // about 4 minutes per day

export type DayState = {
  sym: string;
  name: string;
  prices: number[]; // prices[0] = opening price
  cash: number;
  shares: number;
  trades: number;
};

export function newDay(rand: () => number = Math.random): DayState {
  const def = STOCKS[Math.floor(rand() * STOCKS.length)] ?? STOCKS[0]!;
  return { sym: def.sym, name: def.name, prices: [def.price], cash: DAY_CASH, shares: 0, trades: 0 };
}

export const dayPrice = (d: DayState) => d.prices.at(-1)!;
export const dayOver = (d: DayState) => d.prices.length > DAY_BARS;
export const dayValue = (d: DayState) => round2(d.cash + d.shares * dayPrice(d));

/** Intraday moves are bigger and have no upward drift. */
export function stepDay(d: DayState, rand: () => number = Math.random): DayState {
  if (dayOver(d)) return d;
  const vol = (STOCKS.find((s) => s.sym === d.sym)?.vol ?? 0.01) * 0.6;
  const next = Math.max(0.5, round2(dayPrice(d) * (1 + (rand() + rand() - 1) * vol * 1.7)));
  return { ...d, prices: [...d.prices, next] };
}

export function dayTrade(d: DayState, side: "buy" | "sell", shares: number): DayState | null {
  if (dayOver(d) || !Number.isInteger(shares) || shares < 1) return null;
  const cost = round2(shares * dayPrice(d));
  if (side === "buy") {
    if (cost > d.cash + 1e-9) return null;
    return { ...d, cash: round2(d.cash - cost), shares: d.shares + shares, trades: d.trades + 1 };
  }
  if (shares > d.shares) return null;
  return { ...d, cash: round2(d.cash + cost), shares: d.shares - shares, trades: d.trades + 1 };
}

/** Your result vs. simply buying at the open and holding to the close. */
export function dayRecap(d: DayState) {
  const pnl = round2(dayValue(d) - DAY_CASH);
  const holdShares = Math.floor(DAY_CASH / d.prices[0]!);
  const holdPnl = round2(holdShares * (dayPrice(d) - d.prices[0]!));
  return { pnl, holdPnl, beatHold: pnl > holdPnl };
}
