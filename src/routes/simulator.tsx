import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trackChartInteraction, trackEvent } from "@/lib/analytics";
import { PriceChart, Sparkline, ValueChart } from "@/components/simulator/charts";
import { OrderTicket } from "@/components/simulator/OrderTicket";
import { PortfolioTracker } from "@/components/simulator/PortfolioTracker";
import { AllocationBreakdown } from "@/components/simulator/AllocationBreakdown";
import { TradeHistoryLog } from "@/components/simulator/TradeHistoryLog";
import { GuestModeBanner } from "@/components/simulator/GuestModeBanner";
import { DailyChallenge } from "@/components/daily/DailyChallenge";
import { useSimulator } from "@/hooks/use-simulator";
import { contributed, fmt, holdingsValue, priceOf, reservedCash, START_CASH, STOCKS, totalValue } from "@/lib/simulator";
import type { Reward } from "@/lib/rewards";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Paper Simulator — Stockify Learn" },
      { name: "description", content: "Practice trading with $10,000 of virtual cash." },
      { property: "og:title", content: "Paper Simulator — Stockify Learn" },
      { property: "og:description", content: "Risk-free mock trading for beginners." },
    ],
  }),
  component: Simulator,
});

const announceRewards = (applied: Reward[]) =>
  applied.forEach((r) => toast.success(`+${fmt(r.amount)} bonus capital`, { description: r.label }));

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

function Simulator() {
  const { state, live, setLive, step, submit, cancel, reset } = useSimulator({ onRewards: announceRewards });
  const [sym, setSym] = useState(STOCKS[0]!.sym);

  const total = totalValue(state);
  const base = contributed(state);
  const change = ((total - base) / base) * 100;
  const invested = holdingsValue(state);
  const reserved = reservedCash(state);
  const selected = STOCKS.find((s) => s.sym === sym)!;
  const series = state.prices[sym] ?? [];
  const windowStart = series[0] ?? selected.price;
  const symChange = ((priceOf(state, sym) - windowStart) / windowStart) * 100;

  const tiles = [
    { label: "Portfolio value", value: fmt(total), sub: <span className={change >= 0 ? "text-primary" : "text-destructive"}>{pct(change)} all time</span> },
    { label: "Cash", value: fmt(state.cash), sub: reserved > 0 ? `${fmt(reserved)} reserved for orders` : state.bonus > 0 ? `${fmt(state.bonus)} bonus earned from lessons` : "Ready to invest" },
    { label: "Invested", value: fmt(invested), sub: `${Object.keys(state.holdings).length} positions` },
    { label: "Realized gain / loss", value: <span className={state.realized >= 0 ? "text-primary" : "text-destructive"}>{state.realized >= 0 ? "+" : "−"}{fmt(Math.abs(state.realized))}</span>, sub: "From shares you've sold" },
  ];

  return (
    <AppShell>
      <Toaster position="top-right" theme="dark" richColors />
      <GuestModeBanner />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Paper Simulator</h1>
          <p className="mt-1 text-muted-foreground">
            Fake money, real lessons. Prices move live — your portfolio saves automatically.{" "}
            <Link to="/learn" className="text-primary hover:underline">Pass lesson quizzes to earn bonus cash →</Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground" aria-live="polite">
            <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-primary" : "bg-muted-foreground"}`} />
            {live ? "Market open" : "Paused"} · tick {state.tick}
          </span>
          <Button size="sm" variant="secondary" onClick={() => { trackEvent("sim_live_toggle", { live: !live }); setLive(!live); }}>
            {live ? <><Pause /> Pause</> : <><Play /> Resume</>}
          </Button>
          <Button size="sm" variant="secondary" onClick={step} disabled={live}>
            <StepForward /> Step
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost"><RotateCcw /> Reset</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start over with {fmt(START_CASH + state.bonus)}?</AlertDialogTitle>
                <AlertDialogDescription>This clears your holdings, open orders, trade history and price history. Bonus capital you've earned from lessons is kept. It can't be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my portfolio</AlertDialogCancel>
                <AlertDialogAction onClick={() => { trackEvent("sim_reset"); reset(); }}>Reset simulator</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
            <p className="text-sm text-muted-foreground">{t.label}</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl">{t.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-card">
          <Tabs defaultValue="stock">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="stock">{sym} price</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio value</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="stock">
              <div className="mt-2 flex items-baseline gap-3">
                <p className="font-display text-2xl font-bold tabular-nums">{fmt(priceOf(state, sym))}</p>
                <p className={`text-sm ${symChange >= 0 ? "text-primary" : "text-destructive"}`}>{pct(symChange)}</p>
                <p className="text-sm text-muted-foreground">{selected.name} · last {series.length} ticks</p>
              </div>
              <div className="mt-4 h-72" onPointerDown={() => trackChartInteraction("price")} onMouseEnter={() => trackChartInteraction("price")}><PriceChart data={series} tick={state.tick} /></div>
            </TabsContent>
            <TabsContent value="portfolio">
              <div className="mt-2 flex items-baseline gap-3">
                <p className="font-display text-2xl font-bold tabular-nums">{fmt(total)}</p>
                <p className={`text-sm ${change >= 0 ? "text-primary" : "text-destructive"}`}>{pct(change)}</p>
                <p className="text-sm text-muted-foreground">vs. {fmt(base)} {state.bonus > 0 ? "start + bonuses" : "start"}</p>
              </div>
              <div className="mt-4 h-72" onPointerDown={() => trackChartInteraction("portfolio_value")} onMouseEnter={() => trackChartInteraction("portfolio_value")}><ValueChart data={state.valueHistory} start={base} /></div>
            </TabsContent>
          </Tabs>
        </div>
        <OrderTicket state={state} sym={sym} onSymChange={setSym} submit={submit} />
      </div>

      <h2 className="mt-8 font-semibold">Market</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STOCKS.map((s) => {
          const hist = state.prices[s.sym] ?? [s.price];
          const p = priceOf(state, s.sym);
          const diff = ((p - s.price) / s.price) * 100;
          const owned = state.holdings[s.sym]?.shares ?? 0;
          return (
            <button
              key={s.sym}
              type="button"
              onClick={() => setSym(s.sym)}
              aria-pressed={sym === s.sym}
              className={`rounded-2xl border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/60 ${sym === s.sym ? "border-primary" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-bold">{s.sym}</p>
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-semibold">{fmt(p)}</p>
                  <p className={`text-xs ${diff >= 0 ? "text-primary" : "text-destructive"}`}>{pct(diff)}</p>
                </div>
              </div>
              <div className="mt-2 h-10"><Sparkline data={hist} /></div>
              <p className="mt-1 text-xs text-muted-foreground">{owned ? `You own ${owned} shares` : "Not owned"}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid min-w-0 gap-6">
          <PortfolioTracker state={state} onCancel={cancel} onSelect={setSym} />
          <TradeHistoryLog trades={state.trades} />
        </div>
        <div className="grid gap-6">
          <DailyChallenge sim={state} />
          <AllocationBreakdown state={state} />
        </div>
      </div>
    </AppShell>
  );
}
