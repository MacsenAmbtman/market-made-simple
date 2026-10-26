import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Paper Simulator — Stockify" },
      { name: "description", content: "Practice trading with $10,000 of virtual cash." },
      { property: "og:title", content: "Paper Simulator — Stockify" },
      { property: "og:description", content: "Risk-free mock trading for beginners." },
    ],
  }),
  component: Simulator,
});

const START = 10000;
const initialStocks = [
  { sym: "AAPL", name: "Apple", price: 189.4 },
  { sym: "TSLA", name: "Tesla", price: 242.1 },
  { sym: "SPY", name: "S&P 500 Index", price: 512.3 },
  { sym: "KO", name: "Coca-Cola", price: 61.2 },
];
const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Simulator() {
  const [stocks, setStocks] = useState(initialStocks);
  const [cash, setCash] = useState(START);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [history, setHistory] = useState([{ t: 0, value: START }]);

  const value = (s = stocks, c = cash, h = holdings) => c + s.reduce((sum, st) => sum + (h[st.sym] ?? 0) * st.price, 0);

  const tick = (c: number, h: Record<string, number>) => {
    const next = stocks.map((s) => ({ ...s, price: +(s.price * (1 + (Math.random() - 0.47) * 0.04)).toFixed(2) }));
    setStocks(next);
    setHistory((hs) => [...hs, { t: hs.length, value: +value(next, c, h).toFixed(2) }]);
  };

  const trade = (sym: string, dir: 1 | -1) => {
    const st = stocks.find((s) => s.sym === sym)!;
    const owned = holdings[sym] ?? 0;
    if (dir === 1 && cash < st.price) return;
    if (dir === -1 && owned < 1) return;
    const c = cash - dir * st.price;
    const h = { ...holdings, [sym]: owned + dir };
    setCash(c); setHoldings(h); tick(c, h);
  };

  const total = value();
  const change = ((total - START) / START) * 100;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Paper Simulator</h1>
      <p className="mt-1 text-muted-foreground">Fake money, real lessons. Every trade moves the market a little.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Portfolio value", fmt(total)], ["Cash", fmt(cash)], ["Return", `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`]].map(([l, v], i) => (
          <div key={l} className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${i === 2 ? (change >= 0 ? "text-primary" : "text-destructive") : ""}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Balance over time</h2>
          <Button size="sm" variant="secondary" onClick={() => tick(cash, holdings)}>Next day →</Button>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
              <YAxis domain={["auto", "auto"]} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} width={70} tickFormatter={(v) => `$${Math.round(v)}`} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => fmt(v)} labelFormatter={(l) => `Day ${l}`} />
              <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {stocks.map((s, i) => {
          const base = initialStocks[i]?.price ?? s.price;
          const diff = ((s.price - base) / base) * 100;
          return (
            <div key={s.sym} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg font-bold">{s.sym}</p>
                  <p className="text-sm text-muted-foreground">{s.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmt(s.price)}</p>
                  <p className={`text-xs ${diff >= 0 ? "text-primary" : "text-destructive"}`}>{diff >= 0 ? "+" : ""}{diff.toFixed(2)}%</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">You own <span className="font-medium text-foreground">{holdings[s.sym] ?? 0}</span> shares</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={() => trade(s.sym, 1)} disabled={cash < s.price}>Buy</Button>
                <Button variant="outline" onClick={() => trade(s.sym, -1)} disabled={!holdings[s.sym]}>Sell</Button>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
