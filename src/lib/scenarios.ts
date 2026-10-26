// Interactive news scenarios embedded in lesson slides: a headline hits, the learner picks
// Buy / Hold / Sell, and the price reacts. Paths are seeded so they're identical on server and client.

export type ScenarioChoice = "buy" | "hold" | "sell";

export type Scenario = {
  id: string; // also seeds the price path
  sym: string;
  company: string;
  headline: string;
  source: string;
  startPrice: number;
  owned: number; // shares held before the news
  gap: number; // instant move when the news hits, e.g. -0.05 = -5%
  drift: number; // where the price ends up relative to startPrice
  slippage?: number; // fast-market penalty for market orders, as a fraction of price
  best?: ScenarioChoice; // the most instructive choice, if there is one
  feedback: Record<ScenarioChoice, string>;
};

export const PRE_POINTS = 20; // quiet trading before the headline
export const POST_POINTS = 16; // reaction after it
export const BUY_SHARES = 10;

function rng(seed: string) {
  let h = 1779033703;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Full price path: PRE_POINTS of noise, the news gap at index PRE_POINTS, then a drift to the final level. */
export function buildPath(s: Scenario): number[] {
  const rand = rng(s.id);
  const noise = (scale: number) => (rand() - 0.5) * 2 * scale;
  const path: number[] = [];
  for (let i = 0; i < PRE_POINTS; i++) path.push(r2(s.startPrice * (1 + noise(0.004))));
  const gapPrice = s.startPrice * (1 + s.gap);
  const end = s.startPrice * (1 + s.drift);
  for (let i = 0; i < POST_POINTS; i++) {
    const k = i / (POST_POINTS - 1);
    const eased = 1 - (1 - k) ** 2; // fast reaction, then settling
    const p = gapPrice + (end - gapPrice) * eased;
    path.push(r2(i === POST_POINTS - 1 ? end : p * (1 + noise(0.006))));
  }
  return path;
}

export type ScenarioOutcome = {
  newsPrice: number; // price right after the headline (where decisions fill)
  fillPrice: number | null; // actual fill for buy/sell including slippage
  endPrice: number;
  pnl: number; // change in position value vs. the start, including the decision
  holdPnl: number; // what doing nothing would have produced
};

export function scenarioOutcome(s: Scenario, choice: ScenarioChoice, path = buildPath(s)): ScenarioOutcome {
  const newsPrice = path[PRE_POINTS]!;
  const endPrice = path.at(-1)!;
  const slip = s.slippage ?? 0;
  const holdPnl = r2(s.owned * (endPrice - s.startPrice));
  if (choice === "buy") {
    const fillPrice = r2(newsPrice * (1 + slip));
    return { newsPrice, fillPrice, endPrice, holdPnl, pnl: r2(holdPnl + BUY_SHARES * (endPrice - fillPrice)) };
  }
  if (choice === "sell") {
    const fillPrice = r2(newsPrice * (1 - slip));
    return { newsPrice, fillPrice, endPrice, holdPnl, pnl: r2(s.owned * (fillPrice - s.startPrice)) };
  }
  return { newsPrice, fillPrice: null, endPrice, holdPnl, pnl: holdPnl };
}
