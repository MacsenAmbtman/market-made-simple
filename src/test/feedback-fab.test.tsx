import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The write is stubbed so the test only judges what the form asks for and what it sends.
const submit = vi.hoisted(() => vi.fn(async (_arg: unknown) => ({ ok: true })));
vi.mock("@/lib/feedback.functions", () => ({ submitFeedback: (arg: unknown) => submit(arg) }));

const { FeedbackButton } = await import("@/components/FeedbackButton");

describe("floating feedback button", () => {
  it("opens a two-question form and sends both answers with the page it came from", async () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByRole("button", { name: "Send feedback or report an issue" }));

    const liked = screen.getByLabelText("What did you like or dislike?");
    const wanted = screen.getByLabelText("What features should we add next?");
    expect(liked).toBeInTheDocument();
    expect(wanted).toBeInTheDocument();

    fireEvent.change(liked, { target: { value: "The lessons are short." } });
    fireEvent.change(wanted, { target: { value: "More charts." } });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        data: { liked: "The lessons are short.", wanted: "More charts.", page: "/" },
      }),
    );
    expect(await screen.findByText("Thanks — that's logged")).toBeInTheDocument();
  });

  it("refuses to send until the first question is answered", async () => {
    submit.mockClear();
    render(<FeedbackButton />);
    fireEvent.click(screen.getByRole("button", { name: "Send feedback or report an issue" }));
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    expect(await screen.findByText("Tell us what you liked or disliked.")).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
});
