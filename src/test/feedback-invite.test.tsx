import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The write is stubbed so the test only judges when the ask happens and what it sends.
const submit = vi.hoisted(() => vi.fn(async (_arg: unknown) => ({ ok: true })));
vi.mock("@/lib/feedback.functions", () => ({ submitFeedback: (arg: unknown) => submit(arg) }));

// Engagement (active seconds + screens opened) is driven by the test, not a live timer.
const engagement = vi.hoisted(() => ({ seconds: 0, screens: 1, path: "/" }));
vi.mock("@/hooks/use-engagement", () => ({
  useEngagement: () => ({ ...engagement }),
}));

const { FeedbackInvite } = await import("@/components/FeedbackInvite");
const { INVITE_AFTER_SECONDS, INVITE_AFTER_SCREENS, shouldInvite } = await import(
  "@/lib/feedback-invite"
);

const neverAsked = { asked: false, submitted: false };

describe("when the feedback questions are asked", () => {
  it("waits for a full minute of active time", () => {
    expect(shouldInvite({ seconds: INVITE_AFTER_SECONDS - 1, screens: 1, path: "/" }, neverAsked)).toBe(false);
    expect(shouldInvite({ seconds: INVITE_AFTER_SECONDS, screens: 1, path: "/" }, neverAsked)).toBe(true);
  });

  it("or asks once five different screens have been opened", () => {
    expect(shouldInvite({ seconds: 5, screens: INVITE_AFTER_SCREENS - 1, path: "/" }, neverAsked)).toBe(false);
    expect(shouldInvite({ seconds: 5, screens: INVITE_AFTER_SCREENS, path: "/" }, neverAsked)).toBe(true);
  });

  it("never asks the same visitor twice", () => {
    const signals = { seconds: 600, screens: 12, path: "/" };
    expect(shouldInvite(signals, { asked: true, submitted: false })).toBe(false);
    expect(shouldInvite(signals, { asked: false, submitted: true })).toBe(false);
  });

  it("stays quiet while someone is signing in or reading the legal pages", () => {
    const signals = { seconds: 600, screens: 12, path: "/signup" };
    expect(shouldInvite(signals, neverAsked)).toBe(false);
    expect(shouldInvite({ ...signals, path: "/login" }, neverAsked)).toBe(false);
    expect(shouldInvite({ ...signals, path: "/privacy" }, neverAsked)).toBe(false);
    expect(shouldInvite({ ...signals, path: "/terms" }, neverAsked)).toBe(false);
  });
});

describe("the automatic feedback card", () => {
  beforeEach(() => {
    window.localStorage.clear();
    submit.mockClear();
    engagement.seconds = 0;
    engagement.screens = 1;
    engagement.path = "/";
  });

  it("stays closed until a visitor has clearly spent time here", () => {
    engagement.seconds = 12;
    engagement.screens = 2;
    render(<FeedbackInvite />);
    expect(screen.queryByLabelText("What did you like or dislike?")).not.toBeInTheDocument();
  });

  it("opens on its own once the time threshold is met and sends both answers", async () => {
    engagement.seconds = INVITE_AFTER_SECONDS + 5;
    render(<FeedbackInvite />);

    const liked = await screen.findByLabelText("What did you like or dislike?");
    const wanted = screen.getByLabelText("What features should we add next?");
    fireEvent.change(liked, { target: { value: "The lessons are short." } });
    fireEvent.change(wanted, { target: { value: "More charts." } });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        data: { liked: "The lessons are short.", wanted: "More charts.", page: "/" },
      }),
    );
    expect(await screen.findByText("Thanks — that's logged")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("stockify.feedbackInvite.v1") ?? "{}")).toMatchObject({
      asked: true,
      submitted: true,
    });
  });

  it("refuses to send until the first question is answered", async () => {
    engagement.seconds = INVITE_AFTER_SECONDS + 1;
    render(<FeedbackInvite />);
    await screen.findByLabelText("What did you like or dislike?");
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    expect(await screen.findByText("Tell us what you liked or disliked.")).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("closes for good when someone says Not now", async () => {
    engagement.seconds = INVITE_AFTER_SECONDS + 1;
    render(<FeedbackInvite />);
    await screen.findByLabelText("What did you like or dislike?");
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(screen.queryByLabelText("What did you like or dislike?")).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("stockify.feedbackInvite.v1") ?? "{}")).toMatchObject({
      asked: true,
    });
    expect(submit).not.toHaveBeenCalled();
  });
});
