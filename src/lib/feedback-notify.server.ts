// Emails the site owner each new feedback answer. Server-only: needs the RESEND_API_KEY secret.
// Sends from Resend's test sender on purpose: it only delivers to the account owner's address,
// which is exactly where these go (Gmail forwards them on to the Stockify inbox).

import { sendEmail } from "./email.server";
import { feedbackNotificationEmail, signupNotificationEmail } from "./email-templates";

// Where feedback notifications go. Change this one address to redirect them.
export const FEEDBACK_NOTIFY_EMAIL = "macsenambtman@gmail.com";
const NOTIFY_FROM = "Stockify <onboarding@resend.dev>";

// Never email more than once a minute, so a burst of submissions can't flood the inbox.
const MIN_GAP_MS = 60_000;
let lastSentAt = 0;

export async function notifyOwnerOfFeedback(input: { liked: string; wanted: string; page: string; signedIn: boolean }) {
  const now = Date.now();
  if (now - lastSentAt < MIN_GAP_MS) return { sent: false, reason: "throttled" } as const;
  lastSentAt = now;
  await sendEmail(FEEDBACK_NOTIFY_EMAIL, feedbackNotificationEmail({ ...input, when: new Date(now).toUTCString() }), {
    idempotencyKey: `feedback-notify/${now}`,
    from: NOTIFY_FROM,
  });
  return { sent: true } as const;
}

/** Emails the owner when a new account is created (called once per account). */
export async function notifyOwnerOfSignup(input: { email: string; name: string | null }) {
  const when = new Date().toUTCString();
  await sendEmail(FEEDBACK_NOTIFY_EMAIL, signupNotificationEmail({ ...input, when }), {
    idempotencyKey: `signup-notify/${input.email}`,
    from: NOTIFY_FROM,
  });
  return { sent: true } as const;
}
