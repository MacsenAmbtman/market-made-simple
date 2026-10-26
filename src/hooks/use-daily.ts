import { useCallback, useEffect, useState } from "react";
import { checkIn as doCheckIn, currentStreak, DAILY_EVENT, dayKey, getDaily, type DailyState } from "@/lib/daily";
import { REWARDS_EVENT, REWARDS_KEY } from "@/lib/rewards";

/** Streak state shared by every component that shows it; null until read after mount. */
export function useDaily() {
  const [daily, setDaily] = useState<DailyState | null>(null);
  const [today, setToday] = useState(dayKey);
  // Bumped when the rewards ledger changes, so "claimed" checks re-run.
  const [rewardsVersion, setRewardsVersion] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setDaily(getDaily());
      setToday(dayKey());
    };
    const onRewards = () => setRewardsVersion((v) => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === REWARDS_KEY) onRewards();
      else refresh();
    };
    refresh();
    // Roll over to a new day if the page stays open past midnight.
    const id = setInterval(refresh, 60_000);
    window.addEventListener(DAILY_EVENT, refresh);
    window.addEventListener(REWARDS_EVENT, onRewards);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(id);
      window.removeEventListener(DAILY_EVENT, refresh);
      window.removeEventListener(REWARDS_EVENT, onRewards);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const checkIn = useCallback(() => doCheckIn(dayKey()), []);
  const streak = daily ? currentStreak(daily, today) : 0;

  return { daily, today, streak, checkedInToday: daily?.last === today, checkIn, rewardsVersion };
}
