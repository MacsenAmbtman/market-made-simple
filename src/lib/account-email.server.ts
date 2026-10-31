// Server-side email triggers. Uses the service-role client (bypasses RLS), so every query here
// is scoped by an id or token that the caller has already proven.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { accountDb } from "./account-db";
import { canEmailUsers, emailConfigured, sendEmail, siteUrl } from "./email.server";
import { passwordResetEmail, reminderEmail, welcomeEmail } from "./email-templates";
import { pickReminder } from "./reminders";
import { notifyOwnerOfSignup } from "./feedback-notify.server";

const db = () => accountDb(supabaseAdmin);

const RESET_COOLDOWN_MS = 60_000;
const REMINDER_BATCH = 500;
const MAX_REMINDERS_PER_RUN = 200;
const SEND_GAP_MS = 550; // stay under Resend's default 2 requests/second

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Send the welcome email once per account. Safe to call on every sign-in. */
export async function sendWelcome(userId: string, request: Request | undefined) {
  if (!emailConfigured()) return { sent: false, reason: "email-not-configured" } as const;
  // Claim the send first so two tabs signing in at once can't both send it.
  const { data: profile, error } = await db()
    .from("profiles")
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq("id", userId)
    .is("welcome_email_sent_at", null)
    .select("email, display_name")
    .maybeSingle();
  if (error) throw error;
  if (!profile) return { sent: false, reason: "already-sent" } as const;
  // First sign-in of a new account: tell the owner. Never let this block the user's own email.
  await notifyOwnerOfSignup({ email: profile.email, name: profile.display_name }).catch((e) => console.error("[signup-alert]", e));
  if (!canEmailUsers()) return { sent: false, reason: "no-verified-sender" } as const;
  try {
    await sendEmail(profile.email, welcomeEmail({ name: profile.display_name, siteUrl: siteUrl(request) }), { idempotencyKey: `welcome/${userId}` });
    return { sent: true } as const;
  } catch (e) {
    // Release the claim so the next sign-in retries.
    await db().from("profiles").update({ welcome_email_sent_at: null }).eq("id", userId);
    throw e;
  }
}

/**
 * Email a password-reset link. Always resolves the same way whether or not the account exists,
 * so it can't be used to discover who has signed up. At most one email per address per minute.
 */
export async function sendPasswordReset(email: string, request: Request | undefined) {
  const cutoff = new Date(Date.now() - RESET_COOLDOWN_MS).toISOString();
  const { data: claimed, error } = await db()
    .from("profiles")
    .update({ last_password_reset_at: new Date().toISOString() })
    .eq("email", email)
    .or(`last_password_reset_at.is.null,last_password_reset_at.lt."${cutoff}"`)
    .select("id");
  if (error) throw error;
  if (!claimed?.length) return;

  const redirectTo = `${siteUrl(request)}/reset-password`;
  if (!canEmailUsers()) {
    // No verified sender yet: fall back to Lovable Cloud's built-in auth email.
    const { error: sendError } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
    if (sendError) throw sendError;
    return;
  }
  const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
  if (linkError) throw linkError;
  await sendEmail(email, passwordResetEmail({ link: data.properties.action_link }));
}

/** Hourly cron: send each opted-in user at most one reminder per local day, in their evening. */
export async function runDailyReminders(request: Request): Promise<Response> {
  const denied = await authenticateCronRequest(request);
  if (denied) return denied;
  if (!canEmailUsers()) return Response.json({ skipped: "no verified sender address yet" });

  const base = siteUrl(request);
  const now = new Date();
  let checked = 0;
  let sent = 0;
  let failed = 0;

  for (let from = 0; sent < MAX_REMINDERS_PER_RUN; from += REMINDER_BATCH) {
    const { data: profiles, error } = await db()
      .from("profiles")
      .select("id, email, display_name, timezone, created_at, last_reminder_on, unsubscribe_token")
      .eq("email_reminders", true)
      .order("id")
      .range(from, from + REMINDER_BATCH - 1);
    if (error) throw error;
    if (!profiles.length) break;

    const { data: progress, error: progressError } = await db()
      .from("user_progress")
      .select("user_id, streak, last_check_in, completed_lessons")
      .in("user_id", profiles.map((p) => p.id));
    if (progressError) throw progressError;
    const byUser = new Map(progress.map((p) => [p.user_id, p]));

    for (const p of profiles) {
      if (sent >= MAX_REMINDERS_PER_RUN) break;
      checked++;
      const prog = byUser.get(p.id);
      const pick = pickReminder(
        {
          timezone: p.timezone,
          createdAt: p.created_at,
          lastReminderOn: p.last_reminder_on,
          lastCheckIn: prog?.last_check_in ?? null,
          streak: prog?.streak ?? 0,
          completedLessons: prog?.completed_lessons ?? [],
        },
        now,
      );
      if (!pick) continue;

      // Claim today's reminder so overlapping runs can't double-send.
      const { data: claimed, error: claimError } = await db()
        .from("profiles")
        .update({ last_reminder_on: pick.today })
        .eq("id", p.id)
        .or(`last_reminder_on.is.null,last_reminder_on.lt.${pick.today}`)
        .select("id");
      if (claimError) throw claimError;
      if (!claimed?.length) continue;

      const unsubscribeUrl = `${base}/api/email/unsubscribe?token=${p.unsubscribe_token}`;
      try {
        await sendEmail(p.email, reminderEmail({ name: p.display_name, siteUrl: base, unsubscribeUrl, reminder: pick.reminder }), {
          idempotencyKey: `reminder/${p.id}/${pick.today}`,
          headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        });
        sent++;
      } catch (e) {
        failed++;
        console.error(`[reminders] send to ${p.id} failed`, e);
        await db().from("profiles").update({ last_reminder_on: p.last_reminder_on }).eq("id", p.id);
      }
      await sleep(SEND_GAP_MS);
    }
    if (profiles.length < REMINDER_BATCH) break;
  }

  return Response.json({ checked, sent, failed });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Turn off reminder emails for the profile owning this token. Returns false for an unknown token. */
export async function unsubscribe(token: string | null) {
  if (!token || !UUID.test(token)) return false;
  const { data, error } = await db().from("profiles").update({ email_reminders: false }).eq("unsubscribe_token", token).select("id");
  if (error) throw error;
  return !!data?.length;
}
