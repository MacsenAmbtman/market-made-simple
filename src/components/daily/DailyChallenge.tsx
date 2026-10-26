import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Coins, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useDaily } from "@/hooks/use-daily";
import { addDays, buildCtx, challengeFor, challengeReward, claimChallenge, isClaimed } from "@/lib/daily";
import { fmt, initialState, loadState, type SimState } from "@/lib/simulator";

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

function untilMidnight() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const mins = Math.max(0, Math.round((end.getTime() - now.getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Daily check-in streak + today's challenge. Pass `sim` for live progress; otherwise reads the saved simulator. */
export function DailyChallenge({ sim }: { sim?: SimState }) {
  const { daily, today, streak, checkedInToday, checkIn, rewardsVersion } = useDaily();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [saved, setSaved] = useState<SimState | null>(null);
  const [justEarned, setJustEarned] = useState(0);

  useEffect(() => {
    if (!sim) setSaved(loadState() ?? initialState());
  }, [sim, rewardsVersion]);

  const state = sim ?? saved;
  if (!daily || !state) return <div className="h-56 animate-pulse rounded-2xl border bg-card" aria-hidden />;

  const ctx = buildCtx(state, today);
  const ch = challengeFor(today);
  const progress = Math.min(ch.progress(ctx), ch.target);
  const complete = progress >= ch.target;
  const claimed = isClaimed(today);
  // If today's check-in hasn't happened yet, claiming will extend the streak by one.
  const reward = challengeReward(checkedInToday ? streak : streak + 1);

  const run = new Set(daily.last ? Array.from({ length: Math.min(daily.streak, 7) }, (_, i) => addDays(daily.last!, -i)) : []);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  const claim = () => setJustEarned(claimChallenge(ctx));

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card" aria-label="Daily challenge">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl font-bold">
            <Flame className={`h-6 w-6 ${streak ? "text-orange-400" : "text-muted-foreground"}`} aria-hidden />
            {streak}-Day Streak
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {streak ? (checkedInToday ? "You're on fire — come back tomorrow to keep it going." : "Check in today to keep your streak alive!") : "Check in or finish today's challenge to start a streak."}
            {daily.best > 0 && ` Best: ${daily.best} days.`}
          </p>
        </div>
        <div className="flex items-end gap-1.5" aria-label="Last 7 days">
          {week.map((d) => {
            const on = run.has(d);
            const [y, m, dd] = d.split("-").map(Number);
            const label = WEEKDAY[new Date(y!, m! - 1, dd!).getDay()];
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs ${on ? "bg-orange-400/20 text-orange-300" : "bg-muted text-muted-foreground"} ${d === today ? "ring-2 ring-primary/60" : ""}`} title={d}>
                  {on ? <Flame className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!checkedInToday && (
        <Button size="sm" variant="secondary" className="mt-4" onClick={checkIn}>
          <Flame /> Check in for today
        </Button>
      )}

      <div className="mt-5 rounded-xl border bg-background/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today's challenge</p>
            <p className="mt-1 font-semibold">{ch.title}</p>
            <p className="text-sm text-muted-foreground">{ch.description}</p>
          </div>
          <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${claimed ? "text-muted-foreground" : "bg-accent text-accent-foreground"}`}>
            <Coins className="h-3 w-3" />
            {claimed ? "Claimed" : `+${fmt(reward)}`}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={(progress / ch.target) * 100} className="h-2 flex-1" aria-label="Challenge progress" />
          <span className="text-xs tabular-nums text-muted-foreground">{progress}{ch.unit ?? ""} / {ch.target}{ch.unit ?? ""}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {claimed ? (
            <p className="flex items-center gap-1.5 text-sm text-primary">
              <Check className="h-4 w-4" />
              {justEarned ? `+${fmt(justEarned)} added to your Paper Simulator!` : "Done for today."}
            </p>
          ) : complete ? (
            <Button size="sm" onClick={claim} className="shadow-glow"><Coins /> Claim {fmt(reward)}</Button>
          ) : (
            !path.startsWith(ch.where) && (
              <Button size="sm" variant="secondary" asChild>
                <Link to={ch.where}>{ch.where === "/simulator" ? "Go to simulator" : "Go to lessons"} <ArrowRight /></Link>
              </Button>
            )
          )}
          <span className="ml-auto text-xs text-muted-foreground">New challenge in {untilMidnight()}</span>
        </div>
      </div>
    </section>
  );
}

/** Round streak button for navigation; opens a panel with the streak count. */
export function StreakBadge({ className = "" }: { className?: string }) {
  const { daily, streak, checkedInToday, checkIn } = useDaily();
  if (!daily) return <div className={`h-9 w-9 shrink-0 rounded-full ${className}`} aria-hidden />;
  return (
    <Popover>
      <PopoverTrigger
        aria-label={checkedInToday ? `${streak}-day streak` : "Check in today to keep your streak"}
        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors ${streak ? "border-orange-400/40 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20" : "border-border bg-card text-muted-foreground hover:bg-muted"} ${className}`}
      >
        <Flame className="h-4.5 w-4.5" aria-hidden />
        {!checkedInToday && <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-surface bg-primary" aria-label="Not checked in today" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-4">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <Flame className={`h-5 w-5 ${streak ? "text-orange-400" : "text-muted-foreground"}`} aria-hidden />
          {streak}-day streak
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {checkedInToday ? "You're checked in today — come back tomorrow to keep it going." : "Check in today to keep your streak alive!"}
          {daily.best > 0 && ` Best: ${daily.best} days.`}
        </p>
        {!checkedInToday && (
          <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={checkIn}>
            <Flame /> Check in for today
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
