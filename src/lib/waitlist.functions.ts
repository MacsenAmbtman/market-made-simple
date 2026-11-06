// Public server function for the Stockify Plus waitlist. Guests can join, so validation and the
// rate limit are the gates; the table has no client policies and is written with the service role.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { cleanPage, joinWaitlistCore, normaliseEmail, type WaitlistInput } from "./waitlist";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input: WaitlistInput) => {
    const useAccount = input?.useAccount === true;
    const email = useAccount ? null : normaliseEmail(input?.email);
    if (!useAccount && !email) throw new Error("Please enter a valid email address.");
    return { email, useAccount, page: cleanPage(input?.page) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const req = getRequest();
    const authHeader = req?.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    let userId: string | null = null;
    let email = data.email;
    if (token.split(".").length === 3) {
      const { data: u } = await supabaseAdmin.auth.getUser(token);
      if (u?.user) {
        userId = u.user.id;
        if (data.useAccount) email = normaliseEmail(u.user.email);
      }
    }
    if (!email) throw new Error(data.useAccount ? "Please sign in again, or enter your email." : "Please enter a valid email address.");

    const ip = req?.headers.get("cf-connecting-ip") ?? req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    // Only a hash of the address is kept, purely for rate limiting.
    const clientHash = await sha256(`stockify-waitlist:${ip}`);

    return joinWaitlistCore(
      {
        async countRecentAttempts(hash, since) {
          const { count } = await supabaseAdmin.from("plus_waitlist_attempts").select("id", { count: "exact", head: true }).eq("client_hash", hash).gte("created_at", since);
          return count ?? 0;
        },
        async recordAttempt(hash) {
          await supabaseAdmin.from("plus_waitlist_attempts").insert({ client_hash: hash });
        },
        async insert(row) {
          const { error } = await supabaseAdmin.from("plus_waitlist").insert(row);
          if (!error) return "ok";
          if (error.code === "23505") return "duplicate";
          console.error("[waitlist]", error.message);
          throw new Error("We couldn't save that. Try again in a moment.");
        },
      },
      { email, page: data.page, userId, clientHash },
    );
  });
