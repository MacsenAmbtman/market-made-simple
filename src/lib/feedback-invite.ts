// Rules for asking an engaged visitor for feedback. There is no feedback button any more:
// the questions appear on their own once someone has clearly spent time here. Pure and
// storage-free so the thresholds can be tested without a browser.

export const INVITE_AFTER_SECONDS = 60; // a minute of genuinely active time
export const INVITE_AFTER_SCREENS = 5; // ...or five different screens opened

const STORAGE_KEY = "stockify.feedbackInvite.v1";

// Pages where an interruption is wrong: someone mid-sign-in, or reading legal text.
const SKIP_PATHS = ["/login", "/signup", "/privacy", "/terms"];

export type InviteSignals = { seconds: number; screens: number; path: string };
export type InviteRecord = { asked: boolean; submitted: boolean };

export const EMPTY_RECORD: InviteRecord = { asked: false, submitted: false };

/** One ask per visitor, ever — after that only a fresh answer counts. */
export function shouldInvite(signals: InviteSignals, record: InviteRecord): boolean {
  if (record.asked || record.submitted) return false;
  if (SKIP_PATHS.some((skip) => signals.path.startsWith(skip))) return false;
  return signals.seconds >= INVITE_AFTER_SECONDS || signals.screens >= INVITE_AFTER_SCREENS;
}

export function readInviteRecord(): InviteRecord {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_RECORD };
    const parsed = JSON.parse(raw) as Partial<InviteRecord>;
    return { asked: Boolean(parsed.asked), submitted: Boolean(parsed.submitted) };
  } catch {
    return { ...EMPTY_RECORD };
  }
}

export function writeInviteRecord(patch: Partial<InviteRecord>): InviteRecord {
  const next = { ...readInviteRecord(), ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be full or blocked (private mode); the invite simply isn't remembered.
  }
  return next;
}

/** True while a finger is typing — we wait for the box to be left before interrupting. */
export function isTyping(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT";
}
