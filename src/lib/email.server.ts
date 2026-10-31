// Email delivery through Resend's HTTP API (plain fetch, so it runs on the Workers runtime
// without an SDK). Server-only: needs the RESEND_API_KEY secret set in Lovable Cloud.

import { APP_NAME, type EmailContent } from "./email-templates";

export const emailConfigured = () => !!process.env["RESEND_API_KEY"];

/** Sender address. Resend's shared test sender only delivers to the Resend account owner, so set RESEND_FROM_EMAIL to a verified domain for real users. */
const fromAddress = () => process.env["RESEND_FROM_EMAIL"] || `${APP_NAME} <onboarding@resend.dev>`;

export async function sendEmail(
  to: string,
  content: EmailContent,
  { idempotencyKey, headers, from }: { idempotencyKey?: string; headers?: Record<string, string>; from?: string } = {},
) {
  const key = process.env["RESEND_API_KEY"];
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from: from ?? fromAddress(), to: [to], subject: content.subject, html: content.html, text: content.text, ...(headers ? { headers } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as { id: string };
}

/** Public base URL for links in emails: SITE_URL if set, else the origin this request came in on. */
export function siteUrl(request: Request | undefined) {
  const configured = process.env["SITE_URL"]?.replace(/\/+$/, "");
  if (configured) return configured;
  if (request) return new URL(request.url).origin;
  throw new Error("SITE_URL is not set and there is no request to infer it from");
}
