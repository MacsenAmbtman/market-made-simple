import { afterEach, describe, expect, it } from "vitest";
import { Route } from "@/routes/api/public/cron/daily-reminders";

const CRON_SECRET = "test-cron-secret";

const handlers = Route.options.server!.handlers as unknown as {
  POST: (ctx: { request: Request }) => Promise<Response>;
};

const call = (authorization?: string) => {
  process.env["LOVABLE_CRON_SECRET"] = CRON_SECRET;
  const request = new Request("http://localhost/api/public/cron/daily-reminders", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
  return handlers.POST({ request });
};

describe("the reminder cron endpoint", () => {
  afterEach(() => {
    delete process.env["LOVABLE_CRON_SECRET"];
  });

  it("rejects a call that carries no scheduler credential", async () => {
    const res = await call();
    expect(res.status).toBe(401);
  });

  it("rejects a call that carries the wrong scheduler credential", async () => {
    const res = await call("Bearer not-the-real-secret");
    expect(res.status).toBe(401);
  });
});
