import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

const TICK_MS = 1000;
// A tab left open with nobody touching it is not interest, so the clock pauses.
const IDLE_LIMIT_MS = 45_000;

export type Engagement = { seconds: number; screens: number; path: string };

/**
 * How long the visitor has genuinely been engaged, and how many different screens they
 * have opened. The timer only runs while the tab is in front and something has happened
 * recently; the screen count is distinct addresses, so revisits don't inflate it.
 */
export function useEngagement(): Engagement {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const screens = useRef<Set<string>>(new Set());
  const [screenCount, setScreenCount] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const lastTouch = useRef(Date.now());

  useEffect(() => {
    screens.current.add(path);
    setScreenCount(screens.current.size);
  }, [path]);

  useEffect(() => {
    const touch = () => {
      lastTouch.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll", "wheel"] as const;
    events.forEach((event) => window.addEventListener(event, touch, { passive: true }));

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastTouch.current > IDLE_LIMIT_MS) return;
      setSeconds((current) => current + TICK_MS / 1000);
    }, TICK_MS);

    return () => {
      events.forEach((event) => window.removeEventListener(event, touch));
      window.clearInterval(timer);
    };
  }, []);

  return { seconds, screens: screenCount, path };
}
