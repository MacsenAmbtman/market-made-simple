import { describe, expect, it, vi, beforeEach } from "vitest";
import { joinWaitlistCore, normaliseEmail, isRateLimited, WAITLIST_RATE_LIMIT, PLUS_PRICE_LABEL, type WaitlistStore } from "@/lib/waitlist";
import { HOME_CTAS, resumeTarget } from "@/lib/home";
import { mapToTikTok } from "@/lib/tiktok";
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "@/routeTree.gen";

function memoryStore(): WaitlistStore & { rows: { email: string }[]; attempts: number } {
  const s = {
    rows: [] as { email: string }[],
    attempts: 0,
    async countRecentAttempts() { return s.attempts; },
    async recordAttempt() { s.attempts++; },
    async insert(row: { email: string }) {
      if (s.rows.some((r) => r.email.toLowerCase() === row.email.toLowerCase())) return "duplicate" as const;
      s.rows.push(row); return "ok" as const;
    },
  };
  return s;
}
const args = (email: string) => ({ email, page: "/plus", userId: null, clientHash: "h" });

describe("Plus waitlist rules", () => {
  it("price is £5 a month", () => expect(PLUS_PRICE_LABEL).toBe("£5"));

  it("validates and lower-cases emails", () => {
    expect(normaliseEmail("  Jo@Example.COM ")).toBe("jo@example.com");
    expect(normaliseEmail("not-an-email")).toBeNull();
    expect(normaliseEmail("a@b")).toBeNull();
    expect(normaliseEmail("")).toBeNull();
    expect(normaliseEmail(`${"a".repeat(250)}@x.com`)).toBeNull();
  });

  it("treats the same email in different case as a duplicate", async () => {
    const s = memoryStore();
    expect(await joinWaitlistCore(s, args("jo@example.com"))).toEqual({ status: "joined" });
    expect(await joinWaitlistCore(s, args(normaliseEmail("JO@example.com")!))).toEqual({ status: "duplicate" });
    expect(s.rows).toHaveLength(1);
  });

  it("rate limits after 5 attempts in the window and stores nothing", async () => {
    expect(WAITLIST_RATE_LIMIT).toBe(5);
    expect(isRateLimited(4)).toBe(false);
    const s = memoryStore();
    for (let i = 0; i < 5; i++) await joinWaitlistCore(s, args(`p${i}@example.com`));
    expect(await joinWaitlistCore(s, args("sixth@example.com"))).toEqual({ status: "rate_limited" });
    expect(s.rows.map((r) => r.email)).not.toContain("sixth@example.com");
  });
});

describe("Waitlist tracking", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("forwards waitlist_join to TikTok with no email or other fields", () => {
    expect(mapToTikTok("waitlist_join", { email: "jo@example.com", signed_in: true })).toEqual(["WaitlistJoin", {}]);
    expect(mapToTikTok("waitlist_duplicate", { email: "jo@example.com" })).toBeNull();
  });
  it("the Plus page never passes the email to trackEvent", async () => {
    const src = (await import("node:fs")).readFileSync("src/routes/plus.tsx", "utf8");
    const calls = src.match(/trackEvent\([^)]*\)/g) ?? [];
    expect(calls.length).toBeGreaterThanOrEqual(2);
    for (const c of calls) expect(c).not.toMatch(/email/i);
  });
});

describe("Desktop homepage", () => {
  it("primary goes to Lesson 1 and secondary to the simulator", () => {
    expect(HOME_CTAS.primary).toMatchObject({ label: "Start practising", to: "/learn/$slug", slug: "what-is-a-stock" });
    expect(HOME_CTAS.secondary).toMatchObject({ label: "Try the simulator", to: "/simulator" });
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/learn/what-is-a-stock").at(-1)?.routeId).toBe("/learn/$slug");
    expect(router.matchRoutes("/simulator").at(-1)?.routeId).toBe("/simulator");
    expect(router.matchRoutes("/plus").at(-1)?.routeId).toBe("/plus");
  });
  it("offers a way back only to returning visitors", () => {
    expect(resumeTarget({})).toBeNull();
    expect(resumeTarget({ "what-is-a-stock": { completed: true, bestScore: 5, attempts: 1 } as never })?.slug).not.toBe("what-is-a-stock");
  });
});

describe("Waitlist storage permissions", () => {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
  it.skipIf(!url || !key)("visitors can't read or write waitlist emails directly", async () => {
    const h = { apikey: key!, "Content-Type": "application/json" };
    const read = await fetch(`${url}/rest/v1/plus_waitlist?select=email`, { headers: h });
    expect(read.ok).toBe(false);
    const write = await fetch(`${url}/rest/v1/plus_waitlist`, { method: "POST", headers: h, body: JSON.stringify({ email: "x@example.com" }) });
    expect(write.ok).toBe(false);
    const attempts = await fetch(`${url}/rest/v1/plus_waitlist_attempts?select=id`, { headers: h });
    expect(attempts.ok).toBe(false);
  });
});

describe("Phone pages unchanged", () => {
  it("new homepage, Plus and Progress additions are hidden below the computer breakpoint", async () => {
    const fs = await import("node:fs");
    const previews = fs.readFileSync("src/components/home/HomePreviews.tsx", "utf8");
    expect(previews).toMatch(/<section className="[^"]*\bhidden\b[^"]*md:block/);
    const plus = fs.readFileSync("src/routes/plus.tsx", "utf8");
    expect(plus).toContain('<div className="md:hidden"><ContinueOnComputer /></div>');
    const progress = fs.readFileSync("src/routes/progress.tsx", "utf8");
    expect(progress).toMatch(/to="\/plus" className="[^"]*\bhidden\b[^"]*md:flex/);
    const shell = fs.readFileSync("src/components/AppShell.tsx", "utf8");
    const phoneNav = shell.slice(shell.indexOf("const phoneNav"), shell.indexOf("] as const", shell.indexOf("const phoneNav")));
    expect(phoneNav).not.toContain("/plus");
  });
});
