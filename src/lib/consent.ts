// Cookie consent for optional tracking (Google Analytics + TikTok Pixel).
// No choice, a refusal, or blocked storage all mean "no optional tracking".

export type ConsentChoice = "granted" | "denied";
export interface ConsentRecord {
  choice: ConsentChoice;
  /** ISO time the visitor made this choice. */
  at: string;
  /** Version of the banner wording shown, so we know what they agreed to. */
  notice: string;
}

export const CONSENT_KEY = "stockify:cookie-consent";
export const CONSENT_NOTICE_VERSION = "2026-11-v1";
export const CONSENT_CHANGE_EVENT = "stockify:consent-change";
export const OPEN_COOKIE_SETTINGS_EVENT = "stockify:open-cookie-settings";

// Held for this visit only when storage is blocked, so a choice still applies until the page closes.
let memoryRecord: ConsentRecord | null = null;

function parse(raw: string | null): ConsentRecord | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Partial<ConsentRecord>;
    if (r && (r.choice === "granted" || r.choice === "denied")) {
      return { choice: r.choice, at: String(r.at ?? ""), notice: String(r.notice ?? "") };
    }
  } catch { /* corrupt value counts as no choice */ }
  return null;
}

export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    return parse(window.localStorage.getItem(CONSENT_KEY)) ?? memoryRecord;
  } catch {
    return memoryRecord;
  }
}

/** True only after an explicit "Accept". */
export function hasConsent(): boolean {
  return readConsent()?.choice === "granted";
}

export function saveConsent(choice: ConsentChoice): ConsentRecord {
  const record: ConsentRecord = { choice, at: new Date().toISOString(), notice: CONSENT_NOTICE_VERSION };
  memoryRecord = record;
  try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record)); } catch { /* storage blocked: memory only */ }
  try { window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: record })); } catch { /* ignore */ }
  return record;
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

/** Test-only reset of the in-memory fallback. */
export function __resetConsentMemory() {
  memoryRecord = null;
}
