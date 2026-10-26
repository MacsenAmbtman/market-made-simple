import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt, STOCKS, TRADE_LOG_LEN, type Side, type Trade } from "@/lib/simulator";
import { SYMBOL_COLORS } from "./charts";

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;
const tone = (n: number) => (n > 0 ? "text-primary" : n < 0 ? "text-destructive" : "text-muted-foreground");
const when = (t: Trade) =>
  t.at != null ? new Date(t.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : `Tick ${t.t}`;

function Chips<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${value === o.value ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Filterable log of filled orders with entry/exit prices and realized P/L, plus summary stats. */
export function TradeHistoryLog({ trades }: { trades: Trade[] }) {
  const [side, setSide] = useState<"all" | Side>("all");
  const [sym, setSym] = useState<string>("all");

  const sells = trades.filter((t) => t.side === "sell");
  const wins = sells.filter((t) => (t.realized ?? 0) > 0).length;
  const realized = sells.reduce((s, t) => s + (t.realized ?? 0), 0);
  const best = sells.reduce<Trade | undefined>((b, t) => ((t.realized ?? 0) > (b?.realized ?? -Infinity) ? t : b), undefined);
  const worst = sells.reduce<Trade | undefined>((w, t) => ((t.realized ?? 0) < (w?.realized ?? Infinity) ? t : w), undefined);

  const rows = trades.filter((t) => (side === "all" || t.side === side) && (sym === "all" || t.sym === sym));

  const stats = [
    { label: "Trades", value: String(trades.length) },
    { label: "Win rate", value: sells.length ? `${Math.round((wins / sells.length) * 100)}%` : "—", sub: sells.length ? `${wins} of ${sells.length} sells` : "No sells yet" },
    { label: "Net realized P/L", value: sells.length ? signed(realized) : "—", tone: tone(realized) },
    { label: "Best / worst sale", value: best ? `${signed(best.realized ?? 0)}` : "—", sub: worst && worst !== best ? `Worst ${signed(worst.realized ?? 0)}` : undefined, tone: tone(best?.realized ?? 0) },
  ];

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card" aria-labelledby="history-title">
      <h2 id="history-title" className="font-semibold">Trade history</h2>

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-muted/50 p-3">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className={`mt-0.5 font-display text-lg font-bold tabular-nums ${s.tone ?? ""}`}>{s.value}</dd>
            {s.sub && <dd className="text-xs text-muted-foreground">{s.sub}</dd>}
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Chips label="Filter by side" value={side} onChange={setSide} options={[{ value: "all", label: "All" }, { value: "buy", label: "Buys" }, { value: "sell", label: "Sells" }]} />
        <Chips label="Filter by stock" value={sym} onChange={setSym} options={[{ value: "all", label: "All stocks" }, ...STOCKS.map((s) => ({ value: s.sym, label: s.sym }))]} />
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{trades.length ? "No trades match these filters." : "Your filled orders will show up here."}</p>
      ) : (
        <div className="mt-3 max-h-96 overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="text-right">Net P/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="tabular-nums">
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{when(t)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SYMBOL_COLORS[t.sym] }} />
                      {t.sym}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${t.side === "buy" ? "bg-accent text-accent-foreground" : "bg-destructive/15 text-destructive"}`}>{t.side}</span>
                    {t.kind === "limit" && <span className="ml-1.5 text-xs text-muted-foreground">limit</span>}
                  </TableCell>
                  <TableCell className="text-right">{t.shares}</TableCell>
                  <TableCell className="text-right">{t.side === "buy" ? fmt(t.price) : t.entry != null ? fmt(t.entry) : "—"}</TableCell>
                  <TableCell className="text-right">{t.side === "sell" ? fmt(t.price) : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className={`text-right font-medium ${t.realized != null ? tone(t.realized) : "text-muted-foreground"}`}>
                    {t.realized != null ? signed(t.realized) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Entry for a sale is your average cost per share. The latest {TRADE_LOG_LEN} trades are kept.</p>
    </section>
  );
}
