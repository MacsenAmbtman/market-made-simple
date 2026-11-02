import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import type { Side } from "@/lib/simulator";

export type TradePreset = { sym: string; side: Side; qty: number; nonce: number };

// Fictional example traders used for teaching — not real people or real advice.
export const FEATURED_TRADES = [
  { trader: "Michael", title: "Michael's Daily Trades", sym: "SPY", side: "buy" as Side, qty: 2, why: "Buys the whole market a little at a time instead of guessing." },
  { trader: "Priya", title: "Priya's Steady Picks", sym: "KO", side: "buy" as Side, qty: 10, why: "Likes calm, dividend-paying brands people use every day." },
  { trader: "Jordan", title: "Jordan's Momentum Play", sym: "TSLA", side: "buy" as Side, qty: 1, why: "Takes a small position in a fast mover and keeps it tiny." },
];

export function FeaturedTraders({ onCopy }: { onCopy: (p: Omit<TradePreset, "nonce">) => void }) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
      <h2 className="font-semibold">Featured Traders</h2>
      <p className="mt-1 text-xs text-muted-foreground">Example traders for practice. Copying fills in the order form — you still choose to place it.</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {FEATURED_TRADES.map((t) => (
          <li key={t.trader} className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-display font-bold text-primary">{t.trader[0]}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.side === "buy" ? "Buy" : "Sell"} {t.qty} {t.sym}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t.why}</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-auto min-h-11"
              onClick={() => { trackEvent("copy_trade", { trader: t.trader, symbol: t.sym }); onCopy({ sym: t.sym, side: t.side, qty: t.qty }); }}
            >
              <Copy /> Copy Trade
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
