import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmt, priceOf, STOCKS, totalValue, type SimState } from "@/lib/simulator";
import { SYMBOL_COLORS } from "./charts";

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;
const tone = (n: number) => (n >= 0 ? "text-primary" : "text-destructive");

export function PortfolioTracker({ state, onCancel, onSelect }: { state: SimState; onCancel: (id: string) => void; onSelect: (sym: string) => void }) {
  const total = totalValue(state);
  const rows = STOCKS.flatMap((s) => {
    const h = state.holdings[s.sym];
    if (!h) return [];
    const price = priceOf(state, s.sym);
    const value = h.shares * price;
    const pl = value - h.cost;
    return [{ ...s, shares: h.shares, avg: h.cost / h.shares, price, value, pl, plPct: (pl / h.cost) * 100 }];
  });

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <h2 className="font-semibold">Portfolio tracker</h2>
      <Tabs defaultValue="holdings" className="mt-4">
        <TabsList>
          <TabsTrigger value="holdings">Holdings ({rows.length})</TabsTrigger>
          <TabsTrigger value="orders">Open orders ({state.orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          {rows.length === 0 ? (
            <Empty>You don't own any shares yet. Place a buy order to get started.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Gain / loss</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="tabular-nums">
                  {rows.map((r) => (
                    <TableRow key={r.sym} className="cursor-pointer" onClick={() => onSelect(r.sym)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SYMBOL_COLORS[r.sym] }} />
                          <span className="font-semibold">{r.sym}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{r.shares}</TableCell>
                      <TableCell className="text-right">{fmt(r.avg)}</TableCell>
                      <TableCell className="text-right">{fmt(r.price)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.value)}</TableCell>
                      <TableCell className={`text-right ${tone(r.pl)}`}>
                        {signed(r.pl)} <span className="text-xs">({r.plPct >= 0 ? "+" : ""}{r.plPct.toFixed(2)}%)</span>
                      </TableCell>
                      <TableCell className="text-right">{((r.value / total) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          {state.orders.length === 0 ? (
            <Empty>No open limit orders. Limit orders wait until the price hits your target.</Empty>
          ) : (
            <ul className="divide-y">
              {state.orders.map((o) => {
                const price = priceOf(state, o.sym);
                const away = ((o.limit - price) / price) * 100;
                return (
                  <li key={o.id} className="flex items-center gap-3 py-3 text-sm">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${o.side === "buy" ? "bg-accent text-accent-foreground" : "bg-destructive/15 text-destructive"}`}>{o.side}</span>
                    <span className="font-medium">{o.shares} {o.sym} @ {fmt(o.limit)}</span>
                    <span className="text-xs text-muted-foreground">{away >= 0 ? "+" : ""}{away.toFixed(2)}% from market</span>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onCancel(o.id)} aria-label={`Cancel ${o.side} order for ${o.sym}`}>
                      <X /> Cancel
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
