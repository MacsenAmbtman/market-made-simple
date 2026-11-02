import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CONSENT_CHANGE_EVENT, CONSENT_KEY, OPEN_COOKIE_SETTINGS_EVENT, readConsent, saveConsent } from "@/lib/consent";
import { initAnalytics, trackPageView, withdrawTracking } from "@/lib/analytics";

/** Lesson and practice screens have a fixed Continue button, so the banner waits until they're left. */
export function bannerHiddenOn(path: string) {
  return /^\/learn\/[^/]+/.test(path) || path.startsWith("/practice");
}

export function CookieBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    setOpen(readConsent() === null);
    const reopen = () => { setForced(true); setOpen(true); };
    // Another tab changed the choice: apply it here too.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CONSENT_KEY) return;
      const r = readConsent();
      if (r?.choice === "granted") { initAnalytics(); trackPageView(window.location.pathname); } else withdrawTracking();
      setOpen(r === null);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen); window.removeEventListener("storage", onStorage); };
  }, []);

  if (!open || (!forced && bannerHiddenOn(pathname))) return null;

  const choose = (choice: "granted" | "denied") => {
    saveConsent(choice);
    if (choice === "granted") { initAnalytics(); trackPageView(window.location.pathname); } else withdrawTracking();
    setOpen(false);
    setForced(false);
  };
  const current = readConsent()?.choice;

  return (
    <div role="region" aria-label="Cookie choice" className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border bg-card p-3 shadow-card md:flex-row md:items-center md:gap-4 md:p-4">
        <p className="text-xs leading-snug text-muted-foreground md:text-sm">
          Optional cookies measure how people use Stockify and how our ads perform.{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link>
          {forced && current && <span> Current choice: {current === "granted" ? "accepted" : "declined"}.</span>}
        </p>
        <div className="grid shrink-0 grid-cols-2 gap-2">
          <Button variant="secondary" className="min-h-11" onClick={() => choose("denied")}>Decline</Button>
          <Button variant="secondary" className="min-h-11" onClick={() => choose("granted")}>Accept</Button>
        </div>
      </div>
    </div>
  );
}
