import { Area, AreaChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "@/lib/simulator";

// Fixed per-symbol identity colors (validated categorical slots, dark-surface steps).
export const SYMBOL_COLORS: Record<string, string> = {
  AAPL: "#3987e5",
  TSLA: "#d95926",
  SPY: "#199e70",
  KO: "#c98500",
};
export const CASH_COLOR = "oklch(0.55 0.02 260)";

const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 };
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

export function PriceChart({ data, tick }: { data: number[]; tick: number }) {
  const first = data[0] ?? 0;
  const up = (data.at(-1) ?? 0) >= first;
  const color = up ? "var(--primary)" : "var(--destructive)";
  // Label points with the market tick they happened on, not their array index.
  const rows = data.map((price, i) => ({ t: tick - (data.length - 1 - i), price }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="t" {...axis} minTickGap={40} />
        <YAxis {...axis} domain={["auto", "auto"]} width={64} tickFormatter={(v) => `$${v.toFixed(0)}`} />
        <ReferenceLine y={first} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), "Price"]} labelFormatter={(l) => `Tick ${l}`} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#price-fill)" isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ValueChart({ data, start }: { data: { t: number; value: number }[]; start: number }) {
  const up = (data.at(-1)?.value ?? start) >= start;
  const color = up ? "var(--primary)" : "var(--destructive)";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="value-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="t" {...axis} minTickGap={40} />
        <YAxis {...axis} domain={["auto", "auto"]} width={72} tickFormatter={(v) => `$${Math.round(v).toLocaleString()}`} />
        <ReferenceLine y={start} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Start", fill: "var(--muted-foreground)", fontSize: 11, position: "insideTopLeft" }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), "Portfolio"]} labelFormatter={(l) => `Tick ${l}`} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#value-fill)" isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Sparkline({ data }: { data: number[] }) {
  const up = (data.at(-1) ?? 0) >= (data[0] ?? 0);
  const rows = data.slice(-40).map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line type="monotone" dataKey="v" dot={false} strokeWidth={1.5} stroke={up ? "var(--primary)" : "var(--destructive)"} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** One stacked bar of where the money sits, with a labeled legend underneath. */
export function AllocationBar({ slices }: { slices: { key: string; label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const shown = slices.filter((s) => s.value > 0);
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Portfolio allocation">
        {shown.map((s) => (
          <div key={s.key} title={`${s.label}: ${fmt(s.value)} (${((s.value / total) * 100).toFixed(1)}%)`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} className="transition-[width] duration-500" />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
        {shown.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums">{((s.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
