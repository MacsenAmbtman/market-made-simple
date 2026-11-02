import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelOrder,
  initialState,
  loadState,
  placeLimitOrder,
  placeMarketOrder,
  saveState,
  START_CASH,
  stepMarket,
  totalValue,
  type SimState,
} from "@/lib/simulator";

const setPrice = (s: SimState, sym: string, price: number): SimState => ({ ...s, prices: { ...s.prices, [sym]: [...(s.prices[sym] ?? []), price] } });

describe("market orders", () => {
  it("buys shares and debits cash at the current price", () => {
    const { state, result } = placeMarketOrder(initialState(), "AAPL", "buy", 10);
    expect(result.ok).toBe(true);
    expect(state.holdings["AAPL"]).toEqual({ shares: 10, cost: 1894 });
    expect(state.cash).toBe(START_CASH - 1894);
    expect(totalValue(state)).toBeCloseTo(START_CASH);
  });

  it("rejects buys larger than available cash", () => {
    const { state, result } = placeMarketOrder(initialState(), "SPY", "buy", 100);
    expect(result.ok).toBe(false);
    expect(state.cash).toBe(START_CASH);
  });

  it("rejects selling shares you don't own and non-integer quantities", () => {
    expect(placeMarketOrder(initialState(), "KO", "sell", 1).result.ok).toBe(false);
    expect(placeMarketOrder(initialState(), "KO", "buy", 1.5).result.ok).toBe(false);
  });

  it("tracks realized gains using average cost", () => {
    let s = placeMarketOrder(initialState(), "KO", "buy", 10).state; // 10 @ 61.20
    s = setPrice(s, "KO", 70);
    const r = placeMarketOrder(s, "KO", "sell", 4);
    expect(r.result.ok && r.result.trade?.realized).toBeCloseTo(4 * (70 - 61.2));
    expect(r.state.holdings["KO"]?.shares).toBe(6);
    expect(r.state.holdings["KO"]?.cost).toBeCloseTo(6 * 61.2);
    const all = placeMarketOrder(r.state, "KO", "sell", 6).state;
    expect(all.holdings["KO"]).toBeUndefined();
    expect(all.realized).toBeCloseTo(10 * (70 - 61.2));
  });
});

describe("limit orders", () => {
  it("rests below market, reserves cash, and fills when price drops", () => {
    const placed = placeLimitOrder(initialState(), "TSLA", "buy", 10, 200);
    expect(placed.result.ok && placed.result.order).toBeTruthy();
    expect(placed.state.orders).toHaveLength(1);
    // Reserved cash can't be spent by a market order.
    expect(placeMarketOrder(placed.state, "SPY", "buy", 16).result.ok).toBe(false);

    const filled = stepMarket(setPrice(placed.state, "TSLA", 199), () => 0.5);
    expect(filled.orders).toHaveLength(0);
    expect(filled.holdings["TSLA"]?.shares).toBe(10);
  });

  it("fills immediately when marketable", () => {
    const r = placeLimitOrder(initialState(), "AAPL", "buy", 1, 500);
    expect(r.result.ok && r.result.trade?.price).toBe(189.4);
    expect(r.state.orders).toHaveLength(0);
  });

  it("can be cancelled, releasing the reservation", () => {
    const placed = placeLimitOrder(initialState(), "KO", "buy", 100, 50).state;
    expect(cancelOrder(placed, placed.orders[0]!.id).orders).toHaveLength(0);
  });

  it("won't let the same shares be sold twice", () => {
    let s = placeMarketOrder(initialState(), "KO", "buy", 5).state;
    s = placeLimitOrder(s, "KO", "sell", 5, 100).state;
    expect(placeMarketOrder(s, "KO", "sell", 1).result.ok).toBe(false);
  });
});

describe("market simulation", () => {
  it("appends a price per stock and a portfolio value point each tick", () => {
    const s = stepMarket(initialState());
    expect(s.tick).toBe(1);
    expect(s.prices["AAPL"]).toHaveLength(2);
    expect(s.valueHistory.at(-1)).toEqual({ t: 1, value: START_CASH });
  });

  it("caps history length", () => {
    let s = initialState();
    for (let i = 0; i < 200; i++) s = stepMarket(s);
    expect(s.prices["AAPL"]?.length).toBe(120);
    expect(s.valueHistory.length).toBe(120);
  });
});

describe("persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips state through localStorage", () => {
    const s = placeMarketOrder(stepMarket(initialState()), "AAPL", "buy", 3).state;
    saveState(s);
    expect(loadState()).toEqual(s);
  });

  it("ignores corrupt or outdated data", () => {
    localStorage.setItem("stockify:simulator", "{not json");
    expect(loadState()).toBeNull();
    localStorage.setItem("stockify:simulator", JSON.stringify({ version: 0 }));
    expect(loadState()).toBeNull();
  });
});

import { fastForward as ff, initialState as init0 } from "@/lib/simulator";
import { DAY_BARS, DAY_CASH, dayOver, dayRecap, dayTrade, newDay, stepDay, setStop, setTarget, placeLimit, askPrice, bidPrice } from "@/lib/daytrade";

describe("modes", () => {
  it("fast-forwarding 5 years adds 60 monthly steps", () => {
    expect(ff(init0(), 5, () => 0.5).tick).toBe(60);
  });
  it("a trading day ends after 78 bars and compares to buy-and-hold", () => {
    let d = newDay("beginner", () => 0);
    d = dayTrade(d, "buy", 10)!;
    for (let i = 0; i < DAY_BARS; i++) d = stepDay(d, () => 0.6);
    expect(dayOver(d)).toBe(true);
    expect(dayTrade(d, "sell", 10)).toBeNull();
    const r = dayRecap(d);
    expect(r.holdPnl).toBeGreaterThan(r.pnl);
    expect(DAY_CASH).toBe(10000);
  });
  it("a stop-loss sells everything when the price falls to it", () => {
    let d = dayTrade(newDay("intermediate", () => 0), "buy", 10)!;
    d = setStop(d, d.candles[0]!.o * 0.995);
    for (let i = 0; i < 5 && d.shares; i++) d = stepDay(d, () => 0.1);
    expect(d.shares).toBe(0);
    expect(d.fills.at(-1)!.reason).toBe("stop");
    expect(d.stop).toBeUndefined();
  });
  it("a take-profit sells when the price rises to it", () => {
    let d = dayTrade(newDay("intermediate", () => 0), "buy", 10)!;
    d = setTarget(d, d.candles[0]!.o * 1.005);
    for (let i = 0; i < 5 && d.shares; i++) d = stepDay(d, () => 0.9);
    expect(d.fills.at(-1)!.reason).toBe("target");
    expect(d.fills.at(-1)!.pnl).toBeGreaterThan(0);
  });
  it("a limit buy waits until the price drops to it", () => {
    let d = placeLimit(newDay("advanced", () => 0), "buy", 5, 180)!;
    expect(d.shares).toBe(0);
    for (let i = 0; i < 20 && !d.shares; i++) d = stepDay(d, () => 0.1);
    expect(d.shares).toBe(5);
    expect(d.fills[0]!.price).toBeLessThanOrEqual(180);
  });
  it("only advanced has a bid/ask spread", () => {
    const a = newDay("advanced", () => 0);
    expect(askPrice(a)).toBeGreaterThan(bidPrice(a));
    const b = newDay("beginner", () => 0);
    expect(askPrice(b)).toBe(bidPrice(b));
  });
});
