import { useCallback, useEffect, useRef, useState } from "react";
import { ACCOUNT_SYNCED_EVENT } from "@/lib/local-store";
import { getRewards, REWARDS_EVENT, REWARDS_KEY, type Reward } from "@/lib/rewards";
import {
  applyRewards,
  cancelOrder,
  clearState,
  initialState,
  loadState,
  placeLimitOrder,
  placeMarketOrder,
  saveState,
  stepMarket,
  type OrderResult,
  type Side,
  type SimState,
} from "@/lib/simulator";

export const TICK_MS = 1500;

export function useSimulator({ onRewards }: { onRewards?: (applied: Reward[]) => void } = {}) {
  const [state, setState] = useState<SimState>(initialState);
  const [live, setLive] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  // Single source of truth so trades and market ticks never overwrite each other.
  const ref = useRef(state);
  const onRewardsRef = useRef(onRewards);
  onRewardsRef.current = onRewards;

  const commit = useCallback((next: SimState) => {
    ref.current = next;
    setState(next);
  }, []);

  const syncRewards = useCallback(() => {
    const { state: next, applied } = applyRewards(ref.current, getRewards());
    if (applied.length) {
      commit(next);
      onRewardsRef.current?.(applied);
    }
  }, [commit]);

  // Restore after mount so server and client render the same initial markup.
  useEffect(() => {
    const saved = loadState();
    if (saved) commit(saved);
    syncRewards();
    setHydrated(true);
  }, [commit, syncRewards]);

  // After signing in (or out), the saved portfolio may have been replaced by the account's copy.
  useEffect(() => {
    const reload = () => {
      commit(loadState() ?? initialState());
      syncRewards();
    };
    window.addEventListener(ACCOUNT_SYNCED_EVENT, reload);
    return () => window.removeEventListener(ACCOUNT_SYNCED_EVENT, reload);
  }, [commit, syncRewards]);

  // Pick up rewards earned in this tab or another one while the simulator is open.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === REWARDS_KEY && syncRewards();
    window.addEventListener("storage", onStorage);
    window.addEventListener(REWARDS_EVENT, syncRewards);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(REWARDS_EVENT, syncRewards);
    };
  }, [syncRewards]);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!live || !hydrated) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") commit(stepMarket(ref.current));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [live, hydrated, commit]);

  const step = useCallback(() => commit(stepMarket(ref.current)), [commit]);

  const submit = useCallback(
    (order: { sym: string; side: Side; shares: number; type: "market" | "limit"; limit?: number }): OrderResult => {
      const r =
        order.type === "market"
          ? placeMarketOrder(ref.current, order.sym, order.side, order.shares)
          : placeLimitOrder(ref.current, order.sym, order.side, order.shares, order.limit ?? NaN);
      if (r.result.ok) commit(r.state);
      return r.result;
    },
    [commit],
  );

  const cancel = useCallback((id: string) => commit(cancelOrder(ref.current, id)), [commit]);

  // Earned bonuses are kept: a reset starts from $10,000 plus every reward on the ledger.
  const reset = useCallback(() => {
    clearState();
    commit(applyRewards(initialState(), getRewards()).state);
  }, [commit]);

  return { state, live, setLive, hydrated, step, submit, cancel, reset };
}
