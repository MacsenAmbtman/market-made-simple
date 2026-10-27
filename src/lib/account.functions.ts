// Server functions the browser calls for account emails. Handlers load the server-only
// modules lazily so the service-role client never ends up in the client bundle.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Send the signed-in user's welcome email if it hasn't gone out yet. */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { sendWelcome } = await import("./account-email.server");
    return sendWelcome(context.userId, getRequest());
  });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailInput(input: unknown): { email: string } {
  const email = typeof input === "object" && input && "email" in input && typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (email.length > 320 || !EMAIL.test(email)) throw new Error("Enter a valid email address.");
  return { email };
}

/** Email a reset link. Always reports success so it can't reveal which emails have accounts. */
export const requestPasswordResetEmail = createServerFn({ method: "POST" })
  .validator(emailInput)
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { sendPasswordReset } = await import("./account-email.server");
    try {
      await sendPasswordReset(data.email, getRequest());
    } catch (e) {
      console.error("[password-reset]", e);
    }
    return { ok: true as const };
  });
