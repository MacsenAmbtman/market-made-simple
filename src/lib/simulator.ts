// Paper-trading engine: pure state + reducer so it can be unit-tested and persisted.

import type { Reward } from "./rewards";

export const START_CASH = 10000;
export const HISTORY_LEN = 120; // price/value points kept per series
export const TRADE_LOG_LEN = 100;
const STORAGE_KEY = "stockify:simulator";
const STORAGE_VERSION = 1;

export type StockDef = { sym: string; name: string; price: number; vol: number };

export const STOCKS: StockDef[] = [
  { sym: "AAPL", name: "Apple", price: 189.4, vol: 0.012 },
  { sym: "TSLA", name: "Tesla", price: 242.1, vol: 0.028 },
  { sym: "SPY", name: "S&P 500 Index", price: 512.3, vol: 0.006 },
  { sym: "KO", name: "Coca-Cola", price: 61.2, vol: 0.005 },
];

export type Side = "buy" | "sell";
export type Holding = { shares: number; cost: number }; // cost = total cost basis
export type Trade = { id: string; t: number; sym: string; side: Side; shares: number; price: number; realized?: number | undefined };
export type LimitOrder = { id: string; t: number; sym: string; side: Side; shares: number; limit: number };

export type SimState = {
  version: number;
  tick: number;
  cash: number;
  holdings: Record<string, Holding>;
  prices: Record<string, number[]>; // rolling history, last entry = current price
  valueHistory: { t: number; value: number }[];
  trades: Trade[]; // newest first
  orders: LimitOrder[];
  realized: number;
  bonus: number; // total reward capital added on top of START_CASH
  appliedRewards: string[]; // reward ids already credited
};

export type OrderResult = { ok: true; trade?: Trade | undefined; order?: LimitOrder } | { ok: false; error: string };

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const uid = () => Math.random().toString(36).slice(2, 10);
const keep = <T>(arr: T[], n: number) => (arr.length > n ? arr.slice(arr.length - n) : arr);

export function initialState(): SimState {
  return {
    version: STORAGE_VERSION,
    tick: 0,
    cash: START_CASH,
    holdings: {},
    prices: Object.fromEntries(STOCKS.map((s) => [s.sym, [s.price]])),
    valueHistory: [{ t: 0, value: START_CASH }],
    trades: [],
    orders: [],
    realized: 0,
    bonus: 0,
    appliedRewards: [],
  };
}

export const priceOf = (s: SimState, sym: string) => s.prices[sym]?.at(-1) ?? 0;

export function holdingsValue(s: SimState) {
  return Object.entries(s.holdings).reduce((sum, [sym, h]) => sum + h.shares * priceOf(s, sym), 0);
}
export const totalValue = (s: SimState) => s.cash + holdingsValue(s);

// Cash and shares already promised to resting limit orders can't be spent twice.
export function reservedCash(s: SimState) {
  return s.orders.filter((o) => o.side === "buy").reduce((sum, o) => sum + o.shares * o.limit, 0);
}
export function reservedShares(s: SimState, sym: string) {
  return s.orders.filter((o) => o.side === "sell" && o.sym === sym).reduce((sum, o) => sum + o.shares, 0);
}

/** Execute a fill at `price`. Returns null if the account can't cover it. */
function fill(s: SimState, sym: string, side: Side, shares: number, price: number): { state: SimState; trade: Trade } | null {
  const cost = round2(shares * price);
  const h = s.holdings[sym] ?? { shares: 0, cost: 0 };
  const holdings = { ...s.holdings };
  let cash = s.cash;
  let realized: number | undefined;

  if (side === "buy") {
    if (cost > cash - reservedCash(s) + 1e-9) return null;
    cash = round2(cash - cost);
    holdings[sym] = { shares: h.shares + shares, cost: round2(h.cost + cost) };
  } else {
    if (shares > h.shares) return null;
    const basis = h.shares ? (h.cost * shares) / h.shares : 0;
    realized = round2(cost - basis);
    cash = round2(cash + cost);
    const left = h.shares - shares;
    if (left > 0) holdings[sym] = { shares: left, cost: round2(h.cost - basis) };
    else delete holdings[sym];
  }

  const trade: Trade = { id: uid(), t: s.tick, sym, side, shares, price, realized };
  return {
    trade,
    state: {
      ...s,
      cash,
      holdings,
      realized: round2(s.realized + (realized ?? 0)),
      trades: [trade, ...s.trades].slice(0, TRADE_LOG_LEN),
    },
  };
}

export function placeMarketOrder(s: SimState, sym: string, side: Side, shares: number): { state: SimState; result: OrderResult } {
  if (!Number.isInteger(shares) || shares < 1) return { state: s, result: { ok: false, error: "Enter a whole number of shares." } };
  const price = priceOf(s, sym);
  if (side === "sell" && shares > (s.holdings[sym]?.shares ?? 0) - reservedShares(s, sym))
    return { state: s, result: { ok: false, error: `You don't have ${shares} free ${sym} shares to sell.` } };
  const f = fill(s, sym, side, shares, price);
  if (!f) return { state: s, result: { ok: false, error: "Not enough available cash." } };
  return { state: f.state, result: { ok: true, trade: f.trade } };
}

export function placeLimitOrder(s: SimState, sym: string, side: Side, shares: number, limit: number): { state: SimState; result: OrderResult } {
  if (!Number.isInteger(shares) || shares < 1) return { state: s, result: { ok: false, error: "Enter a whole number of shares." } };
  if (!(limit > 0)) return { state: s, result: { ok: false, error: "Enter a limit price above $0." } };
  limit = round2(limit);
  if (side === "buy" && shares * limit > s.cash - reservedCash(s) + 1e-9)
    return { state: s, result: { ok: false, error: "Not enough available cash to reserve for this order." } };
  if (side === "sell" && shares > (s.holdings[sym]?.shares ?? 0) - reservedShares(s, sym))
    return { state: s, result: { ok: false, error: `You don't have ${shares} free ${sym} shares to sell.` } };

  const order: LimitOrder = { id: uid(), t: s.tick, sym, side, shares, limit };
  // Marketable limit orders fill immediately, like a real exchange.
  const withOrder = { ...s, orders: [...s.orders, order] };
  const executed = executeOrders(withOrder);
  const resting = executed.orders.some((o) => o.id === order.id);
  return { state: executed, result: resting ? { ok: true, order } : { ok: true, trade: executed.trades[0] } };
}

export function cancelOrder(s: SimState, id: string): SimState {
  return { ...s, orders: s.orders.filter((o) => o.id !== id) };
}

/** Fill every resting limit order whose price condition is met at the current price. */
export function executeOrders(s: SimState): SimState {
  let state = s;
  for (const o of s.orders) {
    const price = priceOf(state, o.sym);
    const hit = o.side === "buy" ? price <= o.limit : price >= o.limit;
    if (!hit) continue;
    // Release this order's own reservation before filling it.
    const without = { ...state, orders: state.orders.filter((x) => x.id !== o.id) };
    const f = fill(without, o.sym, o.side, o.shares, price);
    state = f ? f.state : without; // unfillable orders are dropped
  }
  return state;
}

/** Advance the market one step with a random walk, then fill any triggered limit orders. */
export function stepMarket(s: SimState, rand: () => number = Math.random): SimState {
  const prices: Record<string, number[]> = {};
  for (const def of STOCKS) {
    const hist = s.prices[def.sym] ?? [def.price];
    const last = hist.at(-1)!;
    // Small upward drift; gaussian-ish shock from the sum of two uniforms.
    const shock = (rand() + rand() - 1) * def.vol * 1.7 + def.vol * 0.04;
    const next = Math.max(0.5, round2(last * (1 + shock)));
    prices[def.sym] = keep([...hist, next], HISTORY_LEN);
  }
  const tick = s.tick + 1;
  const moved = executeOrders({ ...s, tick, prices });
  return { ...moved, valueHistory: keep([...moved.valueHistory, { t: tick, value: round2(totalValue(moved)) }], HISTORY_LEN) };
}

/** Starting capital plus any bonus capital — the baseline returns are measured against. */
export const contributed = (s: SimState) => START_CASH + s.bonus;

/** Credit any rewards not yet applied. Returns the newly applied ones. */
export function applyRewards(s: SimState, rewards: Reward[]): { state: SimState; applied: Reward[] } {
  const applied = rewards.filter((r) => !s.appliedRewards.includes(r.id));
  if (!applied.length) return { state: s, applied };
  const amount = applied.reduce((sum, r) => sum + r.amount, 0);
  return {
    applied,
    state: {
      ...s,
      cash: round2(s.cash + amount),
      bonus: round2(s.bonus + amount),
      appliedRewards: [...s.appliedRewards, ...applied.map((r) => r.id)],
    },
  };
}

// ---------- persistence ----------

function isState(x: unknown): x is SimState {
  if (!x || typeof x !== "object") return false;
  const s = x as SimState;
  return (
    s.version === STORAGE_VERSION &&
    typeof s.cash === "number" &&
    typeof s.tick === "number" &&
    typeof s.realized === "number" &&
    !!s.holdings && typeof s.holdings === "object" &&
    !!s.prices && STOCKS.every((d) => { const p = s.prices[d.sym]; return Array.isArray(p) && p.length > 0; }) &&
    Array.isArray(s.valueHistory) && Array.isArray(s.trades) && Array.isArray(s.orders)
  );
}

export function loadState(): SimState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isState(parsed)) return null;
    // Saves from before rewards existed lack these fields.
    return { ...parsed, bonus: typeof parsed.bonus === "number" ? parsed.bonus : 0, appliedRewards: Array.isArray(parsed.appliedRewards) ? parsed.appliedRewards : [] };
  } catch {
    return null;
  }
}

export function saveState(s: SimState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked (private mode) — the simulator still works in memory.
  }
}

export function clearState() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
