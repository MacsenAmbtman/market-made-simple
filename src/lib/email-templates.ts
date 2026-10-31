// Transactional email content. Plain functions returning subject + HTML + text, so they're testable
// and Lovable/designers can restyle the HTML without touching delivery code.

export const APP_NAME = "Stockify";
export const TAGLINE = "The stock market, finally in plain English.";

export type EmailContent = { subject: string; html: string; text: string };

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(bodyHtml: string, footerHtml = "") {
  return `<!doctype html><html><body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111">
<div style="max-width:520px;margin:0 auto">
<p style="font-weight:700;letter-spacing:.04em">${APP_NAME.toUpperCase()}</p>
${bodyHtml}
<p style="margin-top:32px;font-size:12px;color:#666">${APP_NAME} is for learning only. Simulator money isn't real and nothing here is financial advice.${footerHtml}</p>
</div></body></html>`;
}

const button = (href: string, label: string) =>
  `<p><a href="${escape(href)}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#111;color:#fff;text-decoration:none">${escape(label)}</a></p>`;

const greeting = (name: string | null) => (name ? `Hi ${name},` : "Hi there,");

export function welcomeEmail({ name, siteUrl }: { name: string | null; siteUrl: string }): EmailContent {
  const start = `${siteUrl}/learn`;
  return {
    subject: `Welcome to ${APP_NAME}: ${TAGLINE}`,
    html: layout(`<h1 style="font-size:22px">${escape(TAGLINE)}</h1>
<p>${escape(greeting(name))}</p>
<p>Thanks for joining ${APP_NAME}. Here's how to get going:</p>
<ol>
<li><strong>Take Lesson 1</strong>: "What is a Stock?" takes about 5 minutes.</li>
<li><strong>Pass the quiz</strong> to earn bonus cash for your Paper Simulator.</li>
<li><strong>Practice with $10,000</strong> of pretend money. Zero risk.</li>
</ol>
${button(start, "Start Lesson 1")}
<p>Check in each day to build your streak.</p>`),
    text: `${TAGLINE}\n\n${greeting(name)}\n\nThanks for joining ${APP_NAME}. Take Lesson 1 ("What is a Stock?", about 5 minutes), pass the quiz to earn bonus simulator cash, then practice with $10,000 of pretend money.\n\nStart here: ${start}\n`,
  };
}

export function passwordResetEmail({ link }: { link: string }): EmailContent {
  return {
    subject: `Reset your ${APP_NAME} password`,
    html: layout(`<h1 style="font-size:22px">Reset your password</h1>
<p>Someone (hopefully you) asked to reset the password for your ${APP_NAME} account. This link works once and expires soon.</p>
${button(link, "Choose a new password")}
<p style="font-size:13px;color:#666">If you didn't ask for this, you can ignore this email. Your password won't change.</p>`),
    text: `Reset your ${APP_NAME} password using this link (works once, expires soon):\n${link}\n\nIf you didn't ask for this, ignore this email. Your password won't change.\n`,
  };
}

export type ReminderKind = { kind: "streak"; streak: number } | { kind: "lesson"; lessonTitle: string | null };

export function reminderEmail({ name, siteUrl, unsubscribeUrl, reminder }: { name: string | null; siteUrl: string; unsubscribeUrl: string; reminder: ReminderKind }): EmailContent {
  const footer = ` <a href="${escape(unsubscribeUrl)}" style="color:#666">Turn off reminder emails</a>.`;
  const footerText = `\n\nTurn off reminder emails: ${unsubscribeUrl}\n`;
  if (reminder.kind === "streak") {
    const days = `${reminder.streak}-day streak`;
    return {
      subject: `🔥 Don't lose your ${days}`,
      html: layout(`<h1 style="font-size:22px">Your ${escape(days)} ends at midnight</h1>
<p>${escape(greeting(name))}</p>
<p>Check in today to keep it going. It takes seconds, and today's challenge pays bonus simulator cash.</p>
${button(`${siteUrl}/learn`, "Keep my streak")}`, footer),
      text: `${greeting(name)}\n\nYour ${days} ends at midnight. Check in today to keep it going: ${siteUrl}/learn${footerText}`,
    };
  }
  const what = reminder.lessonTitle ? `"${reminder.lessonTitle}"` : "today's challenge";
  return {
    subject: reminder.lessonTitle ? `Your next lesson is ready: ${reminder.lessonTitle}` : "Today's challenge is waiting",
    html: layout(`<h1 style="font-size:22px">Five minutes to get a little sharper</h1>
<p>${escape(greeting(name))}</p>
<p>${escape(what)} is waiting for you. Finish it to earn bonus cash for your Paper Simulator.</p>
${button(`${siteUrl}/learn`, "Pick up where I left off")}`, footer),
    text: `${greeting(name)}\n\n${what} is waiting for you: ${siteUrl}/learn${footerText}`,
  };
}

export function feedbackNotificationEmail({
  liked,
  wanted,
  page,
  signedIn,
  when,
}: {
  liked: string;
  wanted: string;
  page: string;
  signedIn: boolean;
  when: string;
}): EmailContent {
  const who = signedIn ? "a signed-in member" : "a guest";
  const where = page || "/";
  const wantedBlock = wanted
    ? `<p><strong>What features should we add next?</strong></p>
<p style="background:#f4f4f5;padding:12px 14px;border-radius:8px">${escape(wanted)}</p>`
    : "";
  return {
    subject: `New feedback on ${APP_NAME}`,
    html: layout(`<h1 style="font-size:22px">New feedback just came in</h1>
<p>Sent by ${who} from ${escape(where)} at ${escape(when)}.</p>
<p><strong>What did you like or dislike?</strong></p>
<p style="background:#f4f4f5;padding:12px 14px;border-radius:8px">${escape(liked)}</p>
${wantedBlock}`),
    text: `New feedback on ${APP_NAME}\n\nSent by ${who} from ${where} at ${when}.\n\nWhat did you like or dislike?\n${liked}\n${wanted ? `\nWhat features should we add next?\n${wanted}\n` : ""}`,
  };
}
