// Same-tab signal that one of the stockify:* stores changed, so account sync can push it.

export const LOCAL_WRITE_EVENT = "stockify:local-write";
/** Fired after account data is pulled into this browser, so in-memory state can reload from storage. */
export const ACCOUNT_SYNCED_EVENT = "stockify:account-synced";

export function notifyLocalWrite(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(LOCAL_WRITE_EVENT, { detail: key }));
}

// Some browsers block storage entirely (private mode, some in-app browsers such as TikTok's).
// Progress then lives in memory for this visit, so lessons still unlock in order and the
// flow never breaks; it just isn't kept after the page is closed.
const memory = new Map<string, string>();

export const store = {
  get(key: string): string | null {
    try {
      const v = localStorage.getItem(key);
      return v ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  set(key: string, value: string) {
    memory.set(key, value);
    try { localStorage.setItem(key, value); } catch { /* blocked: memory copy is used */ }
  },
  remove(key: string) {
    memory.delete(key);
    try { localStorage.removeItem(key); } catch { /* blocked */ }
  },
};
