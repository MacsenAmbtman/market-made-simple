// Email/password auth actions for the browser. Each returns `{ error }` with a message
// that's safe to show the user, so forms don't need to know Supabase error shapes.

import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { accountDb } from "./account-db";
import { requestPasswordResetEmail } from "./account.functions";

export type AuthResult = { error: string | null };

export const MIN_PASSWORD_LENGTH = 8;

function message(e: AuthError | Error | null): string | null {
  if (!e) return null;
  const code = "code" in e ? e.code : undefined;
  switch (code) {
    case "invalid_credentials":
      return "That email and password don't match.";
    case "email_not_confirmed":
      return "Confirm your email first. Check your inbox for the link.";
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Try signing in.";
    case "weak_password":
      return `Choose a stronger password (at least ${MIN_PASSWORD_LENGTH} characters).`;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    case "same_password":
      return "Your new password must be different from the old one.";
    default:
      return e.message || "Something went wrong. Please try again.";
  }
}

const timezone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
};

/** Create an account. `needsConfirmation` is true when the project requires email confirmation before signing in. */
export async function signUp({ email, password, displayName }: { email: string; password: string; displayName?: string }): Promise<AuthResult & { needsConfirmation: boolean }> {
  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`, needsConfirmation: false };
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/learn`,
      data: { display_name: displayName?.trim() || null, timezone: timezone() },
    },
  });
  return { error: message(error), needsConfirmation: !error && !data.session };
}

export async function signIn({ email, password }: { email: string; password: string }): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return { error: message(error) };
}

/** Email a reset link. Succeeds even for unknown emails, so it can't reveal who has an account. */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    await requestPasswordResetEmail({ data: { email } });
    return { error: null };
  } catch {
    return { error: "Enter a valid email address." };
  }
}

/** Set a new password for the signed-in user (including someone who arrived from a reset link). */
export async function updatePassword(password: string): Promise<AuthResult> {
  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` };
  const { error } = await supabase.auth.updateUser({ password });
  return { error: message(error) };
}

/** Turn daily streak/lesson reminder emails on or off for the signed-in user. */
export async function setEmailReminders(userId: string, enabled: boolean): Promise<AuthResult> {
  const { error } = await accountDb(supabase).from("profiles").update({ email_reminders: enabled }).eq("id", userId);
  return { error: error ? "Couldn't save your email preference. Please try again." : null };
}
