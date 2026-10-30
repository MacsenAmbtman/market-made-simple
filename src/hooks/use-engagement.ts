import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

const TICK_MS = 1000;
// A tab left open with nobody touching it is not interest, so the clock pauses.
const IDLE_LIMIT_MS = 45_000;
// Kept per browser tab, so a refresh in the middle of exploring doesn't restart the count.
const STATE_KEY = "stockify.engagement.v1";

export type Engagement = { seconds: number; screens: number; path: string };

type Stored = { seconds: number; screens: string[] };

function readStored(): Stored {
  try {
    const raw = window.sessionStorage.getItem(STATE_KEY);
    if (!raw) return { seconds: 0, screens: [] };
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      seconds: Number(parsed.seconds) || 0,
      screens: Array.isArray(parsed.screens) ? parsed.screens.slice(0, 60) : [],
    };
  } catch {
    return { seconds: 0, screens: [] };
  }
}

function persistEngagement(seconds: number, screens: Set<string>) {
  try {
    window.sessionStorage.setItem(
      STATE_KEY,
      JSON.stringify({ seconds, screens: [...screens].slice(0, 60) }),
    );
  } catch {
    // Private mode or a full store: the count just isn't carried across a refresh.
  }
}

/**
 * How long the visitor has genuinely been engaged, and how many different screens they
 * have opened. The timer only runs while the tab is in front and something has happened
 * recently; the screen count is distinct addresses, so revisits don't inflate it.
 */
export function useEngagement(): Engagement {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const screens = useRef<Set<string>>(new Set());
  const secondsRef = useRef(0);
  const lastTouch = useRef(Date.now());
  const restored = useRef(false);
  const [screenCount, setScreenCount] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const stored = readStored();
    screens.current = new Set(stored.screens);
    secondsRef.current = stored.seconds;
    restored.current = true;
    setSeconds(stored.seconds);
    setScreenCount(screens.current.size);
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    screens.current.add(path);
    setScreenCount(screens.current.size);
    persistEngagement(secondsRef.current, screens.current);
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
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
      if (secondsRef.current % 5 === 0) persistEngagement(secondsRef.current, screens.current);
    }, TICK_MS);

    return () => {
      events.forEach((event) => window.removeEventListener(event, touch));
      window.clearInterval(timer);
    };
  }, []);

  return { seconds, screens: screenCount, path };
}
