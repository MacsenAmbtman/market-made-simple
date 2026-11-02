// Google Analytics 4 (browser-only). Safe to call anywhere; no-ops on the server or without an ID.
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as string | undefined;
let started = false;

export function initAnalytics() {
  if (started || typeof window === "undefined" || !MEASUREMENT_ID) return;
  started = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- gtag.js needs the Arguments object
    window.dataLayer.push(arguments);
  };
  window.gtag("set", "developer_id.dZjgwMW", true);
  window.gtag("js", new Date());
  // Page views are sent manually on each route change.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path: string) {
  window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
}

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
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, { device: deviceType(), ...params });
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
