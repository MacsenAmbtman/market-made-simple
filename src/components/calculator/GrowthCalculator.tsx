import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { crossoverYear, projectGrowth, type GrowthInputs, type GrowthPoint } from "@/lib/compound";

const CONTRIB_COLOR = "#3987e5";
const INTEREST_COLOR = "var(--primary)";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = (n: number) => `$${Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;

type FieldDef = { key: keyof GrowthInputs; label: string; min: number; max: number; step: number; format: (n: number) => string; hint: string };

const FIELDS: FieldDef[] = [
  { key: "initial", label: "Initial deposit", min: 0, max: 100000, step: 500, format: usd, hint: "What you invest on day one." },
  { key: "monthly", label: "Monthly contribution", min: 0, max: 5000, step: 25, format: usd, hint: "Added at the end of every month." },
  { key: "years", label: "Time horizon", min: 1, max: 50, step: 1, format: (n) => `${n} ${n === 1 ? "year" : "years"}`, hint: "How long you leave it to grow." },
  { key: "rate", label: "Expected annual return", min: 0, max: 15, step: 0.5, format: (n) => `${n}%`, hint: "Stocks have averaged roughly 7% after inflation historically — not guaranteed." },
];

const DEFAULTS: GrowthInputs = { initial: 1000, monthly: 200, years: 30, rate: 7 };

function Field({ def, value, onChange }: { def: FieldDef; value: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(n)) onChange(Math.min(def.max, Math.max(def.min, n)));
    setDraft(null);
  };
  const id = `calc-${def.key}`;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">{def.label}</label>
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={def.min}
          max={def.max}
          step={def.step}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="h-8 w-28 text-right tabular-nums"
        />
      </div>
      <Slider
        className="mt-3"
        min={def.min}
        max={def.max}
        step={def.step}
        value={[value]}
        onValueChange={([v]) => v !== undefined && onChange(v)}
        aria-label={def.label}
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{def.format(def.min)}</span>
        <span>{def.format(def.max)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{def.hint}</p>
    </div>
  );
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  const p = payload?.[0]?.payload as GrowthPoint | undefined;
  if (!active || !p) return null;
  return (
    <div className="rounded-xl border bg-card px-3 py-2 text-xs shadow-card">
      <p className="font-semibold">Year {p.year}</p>
      <p className="mt-1 flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: INTEREST_COLOR }} />Interest <span className="ml-auto pl-4 tabular-nums">{usd(p.interest)}</span></p>
      <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: CONTRIB_COLOR }} />Contributions <span className="ml-auto pl-4 tabular-nums">{usd(p.contributed)}</span></p>
      <p className="mt-1 border-t pt-1 font-semibold">Total <span className="float-right tabular-nums">{usd(p.balance)}</span></p>
    </div>
  );
}

export function GrowthCalculator() {
  const [inputs, setInputs] = useState<GrowthInputs>(DEFAULTS);
  const set = (key: keyof GrowthInputs) => (v: number) => setInputs((s) => ({ ...s, [key]: v }));

  const points = useMemo(() => projectGrowth(inputs), [inputs]);
  const final = points.at(-1)!;
  const interestShare = final.balance > 0 ? (final.interest / final.balance) * 100 : 0;
  const crossover = crossoverYear(points);
  // Cost of waiting: the same plan started 10 years later.
  const delayed = inputs.years > 10 ? projectGrowth({ ...inputs, years: inputs.years - 10 }).at(-1)! : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="rounded-2xl border bg-card p-5 shadow-card" aria-labelledby="calc-inputs">
        <div className="flex items-center justify-between">
          <h2 id="calc-inputs" className="font-semibold">Your plan</h2>
          <button type="button" onClick={() => setInputs(DEFAULTS)} className="text-xs text-muted-foreground hover:text-foreground hover:underline">Reset</button>
        </div>
        <div className="mt-5 space-y-6">
          {FIELDS.map((f) => <Field key={f.key} def={f} value={inputs[f.key]} onChange={set(f.key)} />)}
        </div>
      </section>

      <div className="grid min-w-0 gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Balance after {inputs.years} {inputs.years === 1 ? "year" : "years"}</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-primary">{usd(final.balance)}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CONTRIB_COLOR }} />You put in</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{usd(final.contributed)}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: INTEREST_COLOR }} />Interest earned</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{usd(final.interest)}</p>
          </div>
        </div>

        <section className="rounded-2xl border bg-card p-5 shadow-card" aria-labelledby="calc-chart">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="calc-chart" className="font-semibold">Growth over time</h2>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: INTEREST_COLOR }} />Interest earned</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CONTRIB_COLOR }} />Contributions</span>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(y) => `Yr ${y}`} minTickGap={24} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={56} tickFormatter={compact} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="contributed" stackId="1" stroke={CONTRIB_COLOR} strokeWidth={2} fill={CONTRIB_COLOR} fillOpacity={0.35} isAnimationActive={false} />
                <Area type="monotone" dataKey="interest" stackId="1" stroke={INTEREST_COLOR} strokeWidth={2} fill={INTEREST_COLOR} fillOpacity={0.35} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5">
            <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-muted" role="img" aria-label={`Contributions ${(100 - interestShare).toFixed(0)}%, interest ${interestShare.toFixed(0)}%`}>
              {final.contributed > 0 && <div style={{ width: `${100 - interestShare}%`, background: CONTRIB_COLOR }} />}
              {final.interest > 0 && <div style={{ width: `${interestShare}%`, background: INTEREST_COLOR }} />}
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>Contributions {(100 - interestShare).toFixed(0)}%</span>
              <span>Interest {interestShare.toFixed(0)}%</span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2" aria-label="Insights">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="text-sm font-semibold">✨ The snowball moment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {crossover
                ? <>In <span className="font-semibold text-foreground">year {crossover}</span>, your interest earned overtakes everything you've put in. From then on, your money does most of the work.</>
                : inputs.rate === 0
                  ? "With a 0% return there's no compounding — your balance is just what you put in."
                  : "Within this time frame, interest doesn't overtake your contributions yet. Try a longer horizon to see the snowball take off."}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="text-sm font-semibold">⏳ The cost of waiting</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {delayed
                ? <>Start the same plan 10 years later and you'd have <span className="font-semibold text-foreground">{usd(delayed.balance)}</span> — <span className="font-semibold text-destructive">{usd(final.balance - delayed.balance)} less</span>, even though you'd only contribute {usd(final.contributed - delayed.contributed)} less.</>
                : "Set a time horizon above 10 years to see how much starting a decade later would cost."}
            </p>
          </div>
        </section>

        <details className="group rounded-2xl border bg-card p-5 shadow-card">
          <summary className="cursor-pointer select-none font-semibold marker:text-muted-foreground">Year-by-year breakdown</summary>
          <div className="mt-4 max-h-80 overflow-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 text-left font-medium">Year</th>
                  <th className="py-2 text-right font-medium">Contributions</th>
                  <th className="py-2 text-right font-medium">Interest</th>
                  <th className="py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {points.slice(1).map((p) => (
                  <tr key={p.year}>
                    <td className="py-2">{p.year}</td>
                    <td className="py-2 text-right">{usd(p.contributed)}</td>
                    <td className="py-2 text-right">{usd(p.interest)}</td>
                    <td className="py-2 text-right font-medium">{usd(p.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <div className="flex flex-col gap-4 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Projection assumes a steady return compounded monthly, with no taxes, fees or inflation. Real returns vary year to year and can be negative.
          </p>
          <Button asChild variant="secondary" size="sm" className="shrink-0">
            <Link to="/simulator">Practice investing <ArrowRight /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
