import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetConsentMemory, CONSENT_KEY, hasConsent, readConsent, saveConsent } from "@/lib/consent";
import { __resetAnalytics, __setTrackingHostForTests, initAnalytics, isTrackingHost, trackEvent, trackPageView, withdrawTracking } from "@/lib/analytics";
import { __resetTikTok, mapToTikTok, TIKTOK_PIXEL_ID } from "@/lib/tiktok";
import { bannerHiddenOn } from "@/components/CookieBanner";

const scripts = () => Array.from(document.querySelectorAll("script")).map((s) => s.src);
const tiktokCalls = () => ((window.ttq as unknown as unknown[][]) ?? []).filter(Array.isArray);

beforeEach(() => {
  localStorage.clear();
  __resetConsentMemory();
  __resetAnalytics();
  __resetTikTok();
  document.head.querySelectorAll("script").forEach((s) => s.remove());
  delete window.ttq;
  delete window.gtag;
  window.dataLayer = [];
  __setTrackingHostForTests("stockifylearn.lovable.app");
});
afterEach(() => { __setTrackingHostForTests(null); vi.restoreAllMocks(); });

describe("consent gate", () => {
  it("loads nothing and sends nothing before a choice", () => {
    initAnalytics();
    trackPageView("/");
    trackEvent("lesson_start", { lesson_slug: "what-is-a-stock" });
    expect(scripts()).toEqual([]);
    expect(window.ttq).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it("loads nothing after Decline", () => {
    saveConsent("denied");
    initAnalytics();
    trackEvent("sign_up_complete");
    expect(scripts()).toEqual([]);
    expect(window.ttq).toBeUndefined();
  });

  it("after Accept loads TikTok with the pixel ID and sends one page view per route", () => {
    saveConsent("granted");
    initAnalytics();
    expect(scripts().some((s) => s.includes("analytics.tiktok.com/i18n/pixel/events.js") && s.includes(TIKTOK_PIXEL_ID))).toBe(true);
    trackPageView("/");
    trackPageView("/");
    trackPageView("/learn");
    expect(tiktokCalls().filter((c) => c[0] === "page")).toHaveLength(2);
  });

  it("maps funnel events to TikTok events", () => {
    expect(mapToTikTok("lesson_start", { lesson_slug: "what-is-a-stock", resumed: false })).toEqual(["ViewContent", { content_id: "what-is-a-stock", content_type: "product" }]);
    expect(mapToTikTok("sign_up_complete", { source: "direct" })).toEqual(["CompleteRegistration", {}]);
    expect(mapToTikTok("lesson_complete", { lesson_slug: "what-is-a-stock", score: 5 })).toEqual(["LessonComplete", { content_id: "what-is-a-stock" }]);
    expect(mapToTikTok("buy_click", {})).toBeNull();
  });

  it("never forwards personal data to TikTok and never identifies", () => {
    saveConsent("granted");
    initAnalytics();
    trackEvent("sign_up_complete", { email: "a@b.com", name: "Sam", user_id: "u1", phone: "123" });
    trackEvent("lesson_start", { lesson_slug: "x", email: "a@b.com" });
    const calls = tiktokCalls();
    const text = JSON.stringify(calls);
    expect(text).not.toMatch(/a@b\.com|Sam|u1|123/);
    expect(calls.some((c) => c[0] === "identify")).toBe(false);
    expect(calls.filter((c) => c[0] === "track").map((c) => c[1])).toEqual(["CompleteRegistration", "ViewContent"]);
  });

  it("withdrawal revokes TikTok consent and stops further events", () => {
    saveConsent("granted");
    initAnalytics();
    saveConsent("denied");
    withdrawTracking();
    const before = tiktokCalls().length;
    expect(tiktokCalls().some((c) => c[0] === "revokeConsent")).toBe(true);
    trackEvent("lesson_complete", { lesson_slug: "x" });
    trackPageView("/progress");
    expect(tiktokCalls().length).toBe(before);
  });

  it("does not load on preview or other hosts", () => {
    __setTrackingHostForTests("id-preview--abc.lovable.app");
    saveConsent("granted");
    initAnalytics();
    trackEvent("lesson_start", { lesson_slug: "x" });
    expect(scripts()).toEqual([]);
    expect(isTrackingHost("localhost")).toBe(false);
    expect(isTrackingHost("stockifylearn.lovable.app")).toBe(true);
  });

  it("blocked storage counts as no consent and never throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readConsent()).toBeNull();
    expect(hasConsent()).toBe(false);
    expect(() => initAnalytics()).not.toThrow();
    expect(scripts()).toEqual([]);
    expect(() => saveConsent("denied")).not.toThrow();
    expect(hasConsent()).toBe(false);
  });

  it("a failing pixel script does not break tracking calls", () => {
    saveConsent("granted");
    initAnalytics();
    const s = document.querySelector<HTMLScriptElement>("script[src*='tiktok']")!;
    expect(() => s.dispatchEvent(new Event("error"))).not.toThrow();
    window.ttq = { track: () => { throw new Error("broken"); }, page: () => { throw new Error("broken"); } } as never;
    expect(() => trackEvent("lesson_start", { lesson_slug: "x" })).not.toThrow();
    expect(() => trackPageView("/other")).not.toThrow();
  });

  it("saves the choice with time and notice version", () => {
    saveConsent("granted");
    const r = JSON.parse(localStorage.getItem(CONSENT_KEY)!);
    expect(r.choice).toBe("granted");
    expect(typeof r.at).toBe("string");
    expect(r.notice).toBeTruthy();
  });

  it("banner waits during lessons and practice", () => {
    expect(bannerHiddenOn("/learn/what-is-a-stock")).toBe(true);
    expect(bannerHiddenOn("/practice")).toBe(true);
    expect(bannerHiddenOn("/learn")).toBe(false);
    expect(bannerHiddenOn("/")).toBe(false);
  });
});
