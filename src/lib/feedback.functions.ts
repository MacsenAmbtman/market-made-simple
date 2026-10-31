// Stores feedback submitted from the floating button. Guests can send it too, so this is a
// public function: the validator is the only gate, and the write is append-only.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { validateFeedback, type FeedbackDraft } from "./feedback-validate";

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: FeedbackDraft) => {
    const result = validateFeedback(input);
    if (!result.ok) throw new Error(result.message);
    return result.data;
  })
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Feedback storage isn't set up yet.");

    // Signed-in visitors send a bearer token; guests send none. Recording the account only
    // when the token checks out keeps it off the list of things the caller can make up.
    const authHeader = getRequest()?.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const hasSession = token.split(".").length === 3;

    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        ...(hasSession ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        // New Supabase keys are opaque, not JWTs: send apikey only.
        fetch: (input, init) => {
          const headers = new Headers(
            typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
          );
          if (init?.headers) new Headers(init.headers).forEach((value, header) => headers.set(header, value));
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    let userId: string | null = null;
    if (hasSession) {
      const { data: claims } = await supabase.auth.getClaims(token);
      userId = claims?.claims?.sub ?? null;
    }

    const { error } = await supabase.from("feedback").insert({ ...data, user_id: userId });
    if (error) {
      console.error("[feedback]", error.message);
      throw new Error("We couldn't save that. Try again in a moment.");
    }

    // Tell the owner. Best-effort: a failed email must never fail the visitor's submission.
    try {
      const { notifyOwnerOfFeedback } = await import("./feedback-notify.server");
      const notice = await notifyOwnerOfFeedback({ liked: data.liked, wanted: data.wanted, page: data.page, signedIn: userId !== null });
      console.log("[feedback-notify]", notice.sent ? "sent" : notice.reason);
    } catch (e) {
      console.error("[feedback-notify]", e instanceof Error ? e.message : e);
    }
    return { ok: true as const };
  });
