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

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}

const chartSeen = new Set<string>();
/** Fires once per chart per page load so hovering doesn't flood reports. */
export function trackChartInteraction(chart: string) {
  if (chartSeen.has(chart)) return;
  chartSeen.add(chart);
  trackEvent("chart_interaction", { chart });
}
