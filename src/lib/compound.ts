// Compound growth projection: monthly compounding, contributions added at the end of each month.

export type GrowthInputs = {
  initial: number; // starting deposit
  monthly: number; // contribution each month
  years: number;
  rate: number; // expected annual return, percent (7 = 7%)
};

export type GrowthPoint = { year: number; contributed: number; interest: number; balance: number };

export function projectGrowth({ initial, monthly, years, rate }: GrowthInputs): GrowthPoint[] {
  const r = rate / 100 / 12;
  let balance = initial;
  let contributed = initial;
  const points: GrowthPoint[] = [{ year: 0, contributed, interest: 0, balance }];
  for (let m = 1; m <= Math.round(years * 12); m++) {
    balance = balance * (1 + r) + monthly;
    contributed += monthly;
    if (m % 12 === 0) {
      const b = Math.round(balance * 100) / 100;
      points.push({ year: m / 12, contributed, interest: Math.round((b - contributed) * 100) / 100, balance: b });
    }
  }
  return points;
}

/** First year in which earned interest exceeds the money you put in, if it happens. */
export const crossoverYear = (points: GrowthPoint[]) => points.find((p) => p.year > 0 && p.interest > p.contributed)?.year ?? null;
