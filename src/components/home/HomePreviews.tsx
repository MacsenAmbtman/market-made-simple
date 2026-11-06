// Desktop homepage previews, drawn with the app's own styling (no photos).
import { Link } from "@tanstack/react-router";
import { BookOpen, CandlestickChart, LineChart } from "lucide-react";

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="h-52 overflow-hidden rounded-xl border bg-surface p-4" aria-hidden>{children}</div>;
}

function LessonPreview() {
  return (
    <Frame>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-1.5 flex-1 rounded-full bg-muted"><span className="block h-full w-2/5 rounded-full bg-primary" /></span>2 / 5</div>
      <p className="mt-4 text-sm font-semibold">A share is a tiny slice of a company. If the company grows, your slice is worth…</p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="rounded-lg border px-3 py-2">Less</div>
        <div className="rounded-lg border border-primary bg-accent px-3 py-2 text-accent-foreground">More</div>
      </div>
    </Frame>
  );
}

function SimulatorPreview() {
  const bars = [40, 46, 43, 52, 49, 58, 55, 62, 57, 66, 61, 64];
  return (
    <Frame>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Practice portfolio</p>
          <p className="font-display text-2xl font-bold">$10,000.00</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Simulated money</span>
      </div>
      <div className="mt-4 flex h-16 items-end gap-1.5">
        {bars.map((h, i) => <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm font-medium">
        <div className="rounded-lg bg-primary py-1.5 text-primary-foreground">Buy</div>
        <div className="rounded-lg bg-secondary py-1.5 text-secondary-foreground">Sell</div>
      </div>
    </Frame>
  );
}

function DayTradingPreview() {
  // [open, close, high, low] on a 0–100 scale; green when close >= open.
  const candles = [[50, 58, 62, 46], [58, 54, 61, 50], [54, 63, 66, 52], [63, 60, 67, 56], [60, 52, 62, 48], [52, 57, 60, 49], [57, 66, 70, 55], [66, 62, 69, 59], [62, 70, 73, 60], [70, 64, 72, 61]];
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Session · 5m candles</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Simulated practice</span>
      </div>
      <svg viewBox="0 0 200 110" className="mt-2 h-32 w-full">
        <line x1="0" x2="200" y1="78" y2="78" className="stroke-destructive" strokeDasharray="4 3" strokeWidth="1" />
        <text x="2" y="74" className="fill-destructive" fontSize="8">Stop-loss</text>
        {candles.map(([o, c, h, l], i) => {
          const up = c! >= o!;
          const x = 14 + i * 19;
          const y = (v: number) => 105 - v;
          return (
            <g key={i} className={up ? "fill-primary stroke-primary" : "fill-destructive stroke-destructive"}>
              <line x1={x} x2={x} y1={y(h!)} y2={y(l!)} strokeWidth="1" />
              <rect x={x - 5} width="10" y={y(Math.max(o!, c!))} height={Math.max(2, Math.abs(c! - o!))} />
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-muted-foreground">Practise stop-losses and limit orders. No real money.</p>
    </Frame>
  );
}

const items = [
  { icon: BookOpen, title: "Bite-size lessons", text: "Five-minute lessons with quick quizzes. One idea at a time.", preview: <LessonPreview />, to: "/learn" as const },
  { icon: LineChart, title: "Paper Simulator", text: "Buy and sell real-world-style stocks with $10,000 of simulated money.", preview: <SimulatorPreview />, to: "/simulator" as const },
  { icon: CandlestickChart, title: "Day trading practice", text: "A simulated, sped-up trading session to see how fast prices move and why risk rules matter.", preview: <DayTradingPreview />, to: "/simulator" as const },
];

export function HomePreviews() {
  return (
    <section className="mx-auto hidden max-w-6xl px-5 pb-20 md:block">
      <h2 className="text-center text-2xl font-bold">Three ways to learn</h2>
      <div className="mt-8 grid grid-cols-3 gap-5">
        {items.map(({ icon: Icon, title, text, preview, to }) => (
          <Link key={title} to={to} className="group rounded-2xl border bg-card p-5 shadow-card transition hover:border-primary/50">
            {preview}
            <h3 className="mt-4 flex items-center gap-2 text-lg font-semibold"><Icon className="h-5 w-5 text-primary" />{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
