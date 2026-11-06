// Stockify Plus waitlist: pure rules shared by the page, the server function and tests.

/** Planned monthly price shown on /plus. Change it here only. Nothing is charged. */
export const PLUS_PRICE_GBP_MONTHLY = 5;
export const PLUS_PRICE_LABEL = `£${PLUS_PRICE_GBP_MONTHLY}`;

/** Basic abuse protection: at most this many join attempts per visitor per window. */
export const WAITLIST_RATE_LIMIT = 5;
export const WAITLIST_RATE_WINDOW_MS = 10 * 60 * 1000;

export type WaitlistInput = { email?: string; page?: string; useAccount?: boolean };
export type WaitlistResult = { status: "joined" | "duplicate" | "rate_limited" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  if (e.length < 6 || e.length > 254 || !EMAIL_RE.test(e)) return null;
  return e;
}

export function cleanPage(raw: unknown): string {
  return typeof raw === "string" ? raw.slice(0, 200) : "";
}

export function isRateLimited(recentAttempts: number): boolean {
  return recentAttempts >= WAITLIST_RATE_LIMIT;
}

export type WaitlistStore = {
  countRecentAttempts: (clientHash: string, sinceIso: string) => Promise<number>;
  recordAttempt: (clientHash: string) => Promise<void>;
  /** Returns "duplicate" when the (case-insensitive) email is already on the list. */
  insert: (row: { email: string; source_page: string; user_id: string | null }) => Promise<"ok" | "duplicate">;
};

/** Rate limit, then insert. Email is already validated and lower-cased. */
export async function joinWaitlistCore(
  store: WaitlistStore,
  args: { email: string; page: string; userId: string | null; clientHash: string; now?: number },
): Promise<WaitlistResult> {
  const since = new Date((args.now ?? Date.now()) - WAITLIST_RATE_WINDOW_MS).toISOString();
  if (isRateLimited(await store.countRecentAttempts(args.clientHash, since))) return { status: "rate_limited" };
  await store.recordAttempt(args.clientHash);
  const r = await store.insert({ email: args.email, source_page: args.page, user_id: args.userId });
  return { status: r === "duplicate" ? "duplicate" : "joined" };
}
