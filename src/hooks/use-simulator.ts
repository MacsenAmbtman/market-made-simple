import { useCallback, useEffect, useRef, useState } from "react";
import {
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

export function useSimulator() {
  const [state, setState] = useState<SimState>(initialState);
  const [live, setLive] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  // Single source of truth so trades and market ticks never overwrite each other.
  const ref = useRef(state);

  const commit = useCallback((next: SimState) => {
    ref.current = next;
    setState(next);
  }, []);

  // Restore after mount so server and client render the same initial markup.
  useEffect(() => {
    const saved = loadState();
    if (saved) commit(saved);
    setHydrated(true);
  }, [commit]);

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

  const reset = useCallback(() => {
    clearState();
    commit(initialState());
  }, [commit]);

  return { state, live, setLive, hydrated, step, submit, cancel, reset };
}
