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
