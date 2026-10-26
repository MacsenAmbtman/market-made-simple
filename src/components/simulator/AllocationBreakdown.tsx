import { fmt, holdingsValue, priceOf, STOCKS, totalValue, type SimState } from "@/lib/simulator";
import { CASH_COLOR, SYMBOL_COLORS } from "./charts";

const pctOf = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

/** Cash vs. stocks at a glance, then each position's share of the whole portfolio. */
export function AllocationBreakdown({ state }: { state: SimState }) {
  const total = totalValue(state);
  const stocks = holdingsValue(state);
  const unrealized = Object.entries(state.holdings).reduce((s, [sym, h]) => s + h.shares * priceOf(state, sym) - h.cost, 0);
  const positions = STOCKS.map((s) => ({ ...s, value: (state.holdings[s.sym]?.shares ?? 0) * priceOf(state, s.sym) }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);
  const cashPct = pctOf(state.cash, total);
  const stockPct = pctOf(stocks, total);

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card" aria-labelledby="alloc-title">
      <h2 id="alloc-title" className="font-semibold">Asset allocation</h2>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CASH_COLOR }} />Cash</p>
          <p className="mt-1 font-display text-xl font-bold tabular-nums">{fmt(state.cash)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{cashPct.toFixed(1)}% of portfolio</p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Stocks</p>
          <p className="mt-1 font-display text-xl font-bold tabular-nums">{fmt(stocks)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {stockPct.toFixed(1)}% ·{" "}
            <span className={unrealized >= 0 ? "text-primary" : "text-destructive"}>{unrealized >= 0 ? "+" : "−"}{fmt(Math.abs(unrealized))} unrealized</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-muted" role="img" aria-label={`Cash ${cashPct.toFixed(1)}%, stocks ${stockPct.toFixed(1)}%`}>
        {cashPct > 0 && <div style={{ width: `${cashPct}%`, background: CASH_COLOR }} className="transition-[width] duration-500" />}
        {stockPct > 0 && <div style={{ width: `${stockPct}%` }} className="bg-primary transition-[width] duration-500" />}
      </div>

      <h3 className="mt-6 text-sm font-medium text-muted-foreground">Stock positions</h3>
      {positions.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">All cash for now — buy a stock to see your mix.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {positions.map((p) => {
            const share = pctOf(p.value, total);
            return (
              <li key={p.sym}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SYMBOL_COLORS[p.sym] }} />
                    <span className="font-semibold">{p.sym}</span>
                    <span className="text-muted-foreground">{p.name}</span>
                  </span>
                  <span className="tabular-nums">{fmt(p.value)} <span className="text-xs text-muted-foreground">{share.toFixed(1)}%</span></span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${share}%`, background: SYMBOL_COLORS[p.sym] }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
