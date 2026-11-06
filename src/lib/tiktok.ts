// TikTok Pixel (browser only). Loaded only after cookie consent, only on the live site.
// Never send emails, names, phone numbers, user IDs or hashes of them; no identify/advanced matching.

export const TIKTOK_PIXEL_ID = "DBKC6GBC77UCRTSK0ECG";
export const TIKTOK_SCRIPT_URL = "https://analytics.tiktok.com/i18n/pixel/events.js";

type Ttq = {
  page: (...a: unknown[]) => void;
  track: (...a: unknown[]) => void;
  load: (...a: unknown[]) => void;
  grantConsent?: () => void;
  revokeConsent?: () => void;
  [k: string]: unknown;
};

declare global {
  interface Window {
    ttq?: Ttq;
    TiktokAnalyticsObject?: string;
  }
}

let loaded = false;

/** TikTok's standard base snippet, with the auto page view removed (we send page views per route). */
export function loadTikTokPixel() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    /* eslint-disable */
    (function (w: any, d: Document, t: string) {
      w.TiktokAnalyticsObject = t;
      const ttq = (w[t] = w[t] || []);
      ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
      ttq.setAndDefer = function (o: any, m: string) { o[m] = function () { o.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (id: string) { const e = ttq._i[id] || []; for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
      ttq.load = function (id: string, n?: any) {
        const r = TIKTOK_SCRIPT_URL;
        ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = r;
        ttq._t = ttq._t || {}; ttq._t[id] = +new Date();
        ttq._o = ttq._o || {}; ttq._o[id] = n || {};
        const s = d.createElement("script");
        s.type = "text/javascript"; s.async = true; s.src = r + "?sdkid=" + id + "&lib=" + t;
        s.onerror = () => { /* blocked by an ad blocker or network: ignore */ };
        d.head.appendChild(s);
      };
      ttq.load(TIKTOK_PIXEL_ID);
      ttq.grantConsent();
    })(window, document, "ttq");
    /* eslint-enable */
  } catch { /* a failed pixel must never break the site */ }
}

/** Stops TikTok tracking from now on (consent withdrawn). */
export function revokeTikTok() {
  try { window.ttq?.revokeConsent?.(); } catch { /* ignore */ }
}
export function regrantTikTok() {
  try { window.ttq?.grantConsent?.(); } catch { /* ignore */ }
}

export function tiktokPage() {
  try { window.ttq?.page(); } catch { /* ignore */ }
}

/**
 * Maps our funnel events to TikTok events. Only whitelisted, non-personal fields leave the app.
 * Returns the [event, payload] pair sent, or null when the event isn't forwarded.
 */
export function mapToTikTok(name: string, params: Record<string, unknown>): [string, Record<string, unknown>] | null {
  const slug = typeof params["lesson_slug"] === "string" ? params["lesson_slug"] : undefined;
  switch (name) {
    case "lesson_start":
      return slug ? ["ViewContent", { content_id: slug, content_type: "product" }] : null;
    case "sign_up_complete":
      return ["CompleteRegistration", {}];
    case "lesson_complete":
      return slug ? ["LessonComplete", { content_id: slug }] : null;
    case "waitlist_join":
      return ["WaitlistJoin", {}];
    default:
      return null;
  }
}

export function tiktokTrack(name: string, params: Record<string, unknown>) {
  const mapped = mapToTikTok(name, params);
  if (!mapped) return;
  try { window.ttq?.track(mapped[0], mapped[1]); } catch { /* ignore */ }
}

/** Test-only. */
export function __resetTikTok() {
  loaded = false;
}
