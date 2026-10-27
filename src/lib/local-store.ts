// Same-tab signal that one of the stockify:* stores changed, so account sync can push it.

export const LOCAL_WRITE_EVENT = "stockify:local-write";
/** Fired after account data is pulled into this browser, so in-memory state can reload from storage. */
export const ACCOUNT_SYNCED_EVENT = "stockify:account-synced";

export function notifyLocalWrite(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(LOCAL_WRITE_EVENT, { detail: key }));
}
