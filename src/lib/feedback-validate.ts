// Shared feedback-form rules. Pure and server-free on purpose: the browser uses it to
// block a send, and the server function uses it as the real gate.
import { z } from "zod";

export const FEEDBACK_MAX = 2000;
const PAGE_MAX = 200;

const schema = z.object({
  liked: z
    .string()
    .trim()
    .min(3, "Tell us what you liked or disliked.")
    .max(FEEDBACK_MAX, "Please keep each answer under 2000 characters."),
  wanted: z
    .string()
    .trim()
    .max(FEEDBACK_MAX, "Please keep each answer under 2000 characters."),
  page: z.string().trim().max(PAGE_MAX, "That page address is too long."),
});

export type FeedbackDraft = { liked: string; wanted: string; page: string };
export type FeedbackResult = { ok: true; data: FeedbackDraft } | { ok: false; message: string };

export function validateFeedback(input: FeedbackDraft): FeedbackResult {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Something doesn't look right." };
  }
  return { ok: true, data: parsed.data };
}
