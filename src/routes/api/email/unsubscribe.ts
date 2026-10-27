import { createFileRoute } from "@tanstack/react-router";

// GET shows a confirm button (link scanners prefetch GETs, so they must not unsubscribe anyone);
// POST does it, which also serves mail apps' one-click List-Unsubscribe.
const page = (body: string) =>
  new Response(`<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Email preferences</title></head><body>${body}</body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });

export const Route = createFileRoute("/api/email/unsubscribe")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const token = new URL(request.url).searchParams.get("token") ?? "";
        const safe = encodeURIComponent(token);
        return page(`<h1>Stop reminder emails?</h1><form method="post" action="?token=${safe}"><button type="submit">Unsubscribe</button></form>`);
      },
      POST: async ({ request }) => {
        const { unsubscribe } = await import("@/lib/account-email.server");
        const ok = await unsubscribe(new URL(request.url).searchParams.get("token"));
        return ok
          ? page(`<h1>You're unsubscribed</h1><p>You won't get reminder emails any more. Account emails like password resets still arrive.</p>`)
          : page(`<h1>Link not recognised</h1><p>This unsubscribe link is invalid or expired.</p>`);
      },
    },
  },
});
