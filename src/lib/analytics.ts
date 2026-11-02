// Google Analytics 4 (browser-only). Safe to call anywhere; no-ops on the server or without an ID.
import { hasConsent } from "./consent";
import { loadTikTokPixel, regrantTikTok, revokeTikTok, tiktokPage, tiktokTrack } from "./tiktok";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as string | undefined;

/** Optional tracking only runs on the live site, so preview and test visits don't pollute the data. */
export const TRACKING_HOSTS = ["stockifylearn.lovable.app"];
let hostOverride: string | null = null;
export function __setTrackingHostForTests(h: string | null) { hostOverride = h; }

export function isTrackingHost(hostname?: string): boolean {
  const h = hostname ?? hostOverride ?? (typeof window === "undefined" ? "" : window.location.hostname);
  return TRACKING_HOSTS.includes(h);
}

/** Live site AND the visitor pressed Accept. Checked fresh on every send. */
export function trackingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return isTrackingHost() && hasConsent();
}

let gaStarted = false;
let lastPage: string | null = null;

/** Loads GA and the TikTok Pixel, only once consent is given on the live site. Safe to call repeatedly. */
export function initAnalytics() {
  if (!trackingAllowed()) return;
  try {
    if (MEASUREMENT_ID && !gaStarted) {
      gaStarted = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params -- gtag.js needs the Arguments object
        window.dataLayer.push(arguments);
      };
      window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      window.gtag("set", "developer_id.dZjgwMW", true);
      window.gtag("js", new Date());
      // Page views are sent manually on each route change.
      window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      s.onerror = () => { /* blocked: ignore */ };
      document.head.appendChild(s);
    } else if (gaStarted) {
      window.gtag?.("consent", "update", { analytics_storage: "granted" });
    }
  } catch { /* never break the site */ }
  loadTikTokPixel();
  regrantTikTok();
}

/** Consent withdrawn: stop GA and TikTok from now on and clear GA cookies. */
export function withdrawTracking() {
  if (typeof window === "undefined") return;
  try { window.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }); } catch { /* ignore */ }
  revokeTikTok();
  try {
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0]?.trim();
      if (name && (name === "_ga" || name.startsWith("_ga_") || name === "_ttp")) {
        const base = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = base;
        document.cookie = `${base}; domain=.${window.location.hostname}`;
      }
    }
  } catch { /* ignore */ }
  lastPage = null;
}

/** One page view per route, to GA and TikTok. Repeated calls for the same path are ignored. */
export function trackPageView(path: string) {
  if (!trackingAllowed() || path === lastPage) return;
  lastPage = path;
  try { window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href, page_title: document.title }); } catch { /* ignore */ }
  tiktokPage();
}

/** Test-only. */
export function __resetAnalytics() { gaStarted = false; lastPage = null; }

/** "phone" below the md breakpoint (the learning app), otherwise "computer". */
export function deviceType(): "phone" | "computer" {
  try {
    return window.matchMedia("(max-width: 767.98px)").matches ? "phone" : "computer";
  } catch {
    return "computer";
  }
}

/** Every event carries the device type. Never pass emails, names or other personal data. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!trackingAllowed()) return;
  try { window.gtag?.("event", name, { device: deviceType(), ...params }); } catch { /* ignore */ }
  tiktokTrack(name, params);
}

const LAST_VISIT_KEY = "stockify:last-visit-day";

/** True when the last recorded visit was on an earlier calendar day. Pure, for tests. */
export function isReturnVisit(lastDay: string | null, today: string): boolean {
  return lastDay !== null && lastDay < today;
}

/** Sends return_visit at most once per day, for visitors first seen on an earlier day. */
export function trackReturnVisit(today: string) {
  let last: string | null = null;
  try { last = localStorage.getItem(LAST_VISIT_KEY); } catch { return; }
  if (last === today) return;
  if (isReturnVisit(last, today)) trackEvent("return_visit", { days_since: daysBetween(last!, today) });
  try { localStorage.setItem(LAST_VISIT_KEY, today); } catch { /* storage blocked */ }
}

function daysBetween(a: string, b: string): number {
  const d = (Date.parse(b) - Date.parse(a)) / 86_400_000;
  return Number.isFinite(d) ? Math.round(d) : 0;
}

const chartSeen = new Set<string>();
/** Fires once per chart per page load so hovering doesn't flood reports. */
export function trackChartInteraction(chart: string) {
  if (chartSeen.has(chart)) return;
  chartSeen.add(chart);
  trackEvent("chart_interaction", { chart });
}
