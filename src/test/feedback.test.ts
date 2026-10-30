import { describe, expect, it } from "vitest";
import { FEEDBACK_MAX, validateFeedback } from "@/lib/feedback-validate";

describe("feedback form rules", () => {
  it("requires a real answer to the first question", () => {
    expect(validateFeedback({ liked: "", wanted: "More charts.", page: "/" })).toEqual({
      ok: false,
      message: "Tell us what you liked or disliked.",
    });
    // Spaces alone are not an answer.
    expect(validateFeedback({ liked: "   ", wanted: "", page: "/" })).toEqual({
      ok: false,
      message: "Tell us what you liked or disliked.",
    });
    expect(validateFeedback({ liked: "ab", wanted: "", page: "/" }).ok).toBe(false);
  });

  it("accepts an answer to only the first question and trims both", () => {
    expect(validateFeedback({ liked: "  Loved the lessons  ", wanted: "  ", page: "/simulator" })).toEqual({
      ok: true,
      data: { liked: "Loved the lessons", wanted: "", page: "/simulator" },
    });
  });

  it("rejects an answer longer than the storage limit", () => {
    expect(validateFeedback({ liked: "x".repeat(FEEDBACK_MAX + 1), wanted: "", page: "/" })).toEqual({
      ok: false,
      message: "Please keep each answer under 2000 characters.",
    });
    expect(validateFeedback({ liked: "Good", wanted: "y".repeat(FEEDBACK_MAX + 1), page: "/" })).toEqual({
      ok: false,
      message: "Please keep each answer under 2000 characters.",
    });
  });
});
