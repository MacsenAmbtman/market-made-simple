import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmt, priceOf, reservedCash, reservedShares, STOCKS, type OrderResult, type Side, type SimState } from "@/lib/simulator";

type Submit = (o: { sym: string; side: Side; shares: number; type: "market" | "limit"; limit?: number }) => OrderResult;

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; active?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${value === o.value ? (o.active ?? "bg-card text-foreground shadow-sm") : "text-muted-foreground hover:text-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function OrderTicket({ state, sym, onSymChange, submit }: { state: SimState; sym: string; onSymChange: (s: string) => void; submit: Submit }) {
  const [side, setSide] = useState<Side>("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [qty, setQty] = useState("1");
  const [limit, setLimit] = useState("");

  const price = priceOf(state, sym);
  // Prefill a sensible limit whenever the symbol changes.
  useEffect(() => setLimit(priceOf(state, sym).toFixed(2)), [sym]); // eslint-disable-line react-hooks/exhaustive-deps

  const shares = Number(qty);
  const execPrice = type === "limit" ? Number(limit) || 0 : price;
  const estimate = Number.isFinite(shares) ? shares * execPrice : 0;
  const availCash = state.cash - reservedCash(state);
  const freeShares = (state.holdings[sym]?.shares ?? 0) - reservedShares(state, sym);
  const maxShares = side === "buy" ? Math.floor(availCash / (execPrice || price)) : freeShares;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const r = submit({ sym, side, shares, type, limit: Number(limit) });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    if (r.trade) {
      const verb = r.trade.side === "buy" ? "Bought" : "Sold";
      const pl = r.trade.realized != null ? ` · ${r.trade.realized >= 0 ? "+" : ""}${fmt(r.trade.realized)} realized` : "";
      toast.success(`${verb} ${r.trade.shares} ${r.trade.sym} @ ${fmt(r.trade.price)}`, { description: `Total ${fmt(r.trade.shares * r.trade.price)}${pl}` });
    } else if (r.order) {
      toast(`Limit ${r.order.side} placed`, { description: `${r.order.shares} ${r.order.sym} @ ${fmt(r.order.limit)} — fills when the price ${r.order.side === "buy" ? "drops to" : "rises to"} your limit.` });
    }
    setQty("1");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card">
      <h2 className="font-semibold">Place an order</h2>

      <div className="grid grid-cols-4 gap-1">
        {STOCKS.map((s) => (
          <button key={s.sym} type="button" onClick={() => onSymChange(s.sym)} aria-pressed={sym === s.sym} className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${sym === s.sym ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {s.sym}
          </button>
        ))}
      </div>

      <Segmented value={side} onChange={setSide} options={[
        { value: "buy", label: "Buy", active: "bg-primary text-primary-foreground" },
        { value: "sell", label: "Sell", active: "bg-destructive text-destructive-foreground" },
      ]} />
      <Segmented value={type} onChange={setType} options={[{ value: "market", label: "Market" }, { value: "limit", label: "Limit" }]} />

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="qty">Shares</Label>
          <button type="button" className="text-xs text-primary hover:underline disabled:opacity-50" disabled={maxShares < 1} onClick={() => setQty(String(Math.max(0, maxShares)))}>
            Max {Math.max(0, maxShares)}
          </button>
        </div>
        <Input id="qty" type="number" inputMode="numeric" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
      </div>

      {type === "limit" && (
        <div className="grid gap-1.5">
          <Label htmlFor="limit">Limit price</Label>
          <Input id="limit" type="number" inputMode="decimal" min={0.01} step={0.01} value={limit} onChange={(e) => setLimit(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            {side === "buy" ? "Buys automatically if the price falls to or below this." : "Sells automatically if the price rises to or above this."}
          </p>
        </div>
      )}

      <dl className="grid gap-1 rounded-lg bg-muted/50 p-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Market price</dt><dd className="tabular-nums">{fmt(price)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Estimated {side === "buy" ? "cost" : "proceeds"}</dt><dd className="font-semibold tabular-nums">{fmt(estimate)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">{side === "buy" ? "Available cash" : `Free ${sym} shares`}</dt><dd className="tabular-nums">{side === "buy" ? fmt(availCash) : freeShares}</dd></div>
      </dl>

      <Button type="submit" variant={side === "buy" ? "default" : "destructive"} disabled={!(shares >= 1) || (side === "sell" && freeShares < 1)}>
        {type === "market" ? (side === "buy" ? "Buy now" : "Sell now") : `Place limit ${side}`}
      </Button>
    </form>
  );
}
