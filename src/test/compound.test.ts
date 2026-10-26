import { describe, expect, it } from "vitest";
import { crossoverYear, projectGrowth } from "@/lib/compound";

describe("projectGrowth", () => {
  it("returns one point per year, starting at year 0", () => {
    const pts = projectGrowth({ initial: 1000, monthly: 100, years: 5, rate: 6 });
    expect(pts.map((p) => p.year)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(pts[0]).toEqual({ year: 0, contributed: 1000, interest: 0, balance: 1000 });
  });

  it("matches the closed-form future value with monthly compounding", () => {
    const r = 0.06 / 12;
    const n = 120;
    const expected = 1000 * (1 + r) ** n + (100 * ((1 + r) ** n - 1)) / r;
    const last = projectGrowth({ initial: 1000, monthly: 100, years: 10, rate: 6 }).at(-1)!;
    expect(last.balance).toBeCloseTo(expected, 1);
    expect(last.contributed).toBe(1000 + 100 * 120);
    expect(last.interest).toBeCloseTo(last.balance - last.contributed, 1);
  });

  it("earns no interest at a 0% return", () => {
    const last = projectGrowth({ initial: 500, monthly: 50, years: 3, rate: 0 }).at(-1)!;
    expect(last).toEqual({ year: 3, contributed: 2300, interest: 0, balance: 2300 });
  });
});

describe("crossoverYear", () => {
  it("finds when interest overtakes contributions", () => {
    const year = crossoverYear(projectGrowth({ initial: 1000, monthly: 200, years: 40, rate: 7 }));
    expect(year).toBeGreaterThan(15);
    expect(year).toBeLessThan(30);
  });

  it("is null when it never happens", () => {
    expect(crossoverYear(projectGrowth({ initial: 1000, monthly: 200, years: 5, rate: 7 }))).toBeNull();
    expect(crossoverYear(projectGrowth({ initial: 1000, monthly: 200, years: 40, rate: 0 }))).toBeNull();
  });
});
