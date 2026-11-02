import { describe, expect, it } from "vitest";
import { groupCandles, orderBook } from "@/lib/daytrade";

describe("workstation helpers", () => {
  it("merges three 5-minute candles into one 15-minute candle", () => {
    const c = [
      { o: 10, h: 11, l: 9, c: 10.5, v: 100 },
      { o: 10.5, h: 12, l: 10, c: 11, v: 50 },
      { o: 11, h: 11.5, l: 8, c: 9, v: 25 },
    ];
    expect(groupCandles(c, 3)).toEqual([{ o: 10, h: 12, l: 8, c: 9, v: 175 }]);
  });
  it("puts bids below and asks above the price", () => {
    const b = orderBook(100, 4);
    expect(b.bids.every((x) => x.price < 100)).toBe(true);
    expect(b.asks.every((x) => x.price > 100)).toBe(true);
    expect(b.bids).toHaveLength(5);
  });
});
