import { useState } from "react";
import { Check, Loader2, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_MAX, validateFeedback } from "@/lib/feedback-validate";
import { submitFeedback } from "@/lib/feedback.functions";

/**
 * Floating feedback control in the bottom-right corner. On phones it sits right in the
 * corner (12px up, 12px in); the only exception is pages that carry the bottom navigation
 * bar, where styles.css lifts it to 68px so it never covers a menu item. From the tablet
 * width up it is 24px from the corner on every page.
 */
export function FeedbackFab() {
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState("");
  const [wanted, setWanted] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function close() {
    setOpen(false);
    // Start the next visit clean rather than re-showing a stale thank-you.
    setTimeout(() => {
      setSent(false);
      setLiked("");
      setWanted("");
      setError("");
    }, 200);
  }

  async function send() {
    const result = validateFeedback({
      liked,
      wanted,
      page: window.location.pathname.slice(0, 200),
    });
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSending(true);
    setError("");
    try {
      await submitFeedback({ data: result.data });
      setSent(true);
    } catch {
      setError("We couldn't save that. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback or report an issue"
        className="feedback-fab fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:bottom-6 md:right-6"
      >
        <MessageCircle className="h-4 w-4" />
        Feedback
      </button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card sm:rounded-2xl">
          {sent ? (
            <>
              <DialogHeader>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary">
                  <Check className="h-5 w-5" />
                </span>
                <DialogTitle className="mt-3">Thanks — that's logged</DialogTitle>
                <DialogDescription>
                  Every answer lands in the same list we read before deciding what to build next.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={close} className="w-full">
                Done
              </Button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Feedback</DialogTitle>
                <DialogDescription>
                  Two questions, about thirty seconds. It also covers anything that looked broken.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="feedback-liked" className="text-sm font-semibold">
                    What did you like or dislike?
                  </Label>
                  <Textarea
                    id="feedback-liked"
                    value={liked}
                    onChange={(event) => setLiked(event.target.value)}
                    rows={3}
                    maxLength={FEEDBACK_MAX}
                    placeholder="The lessons were clear, but the simulator felt slow."
                    className="mt-2 resize-none rounded-xl bg-background"
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {liked.length}/{FEEDBACK_MAX}
                  </p>
                </div>

                <div>
                  <Label htmlFor="feedback-wanted" className="text-sm font-semibold">
                    What features should we add next?
                  </Label>
                  <Textarea
                    id="feedback-wanted"
                    value={wanted}
                    onChange={(event) => setWanted(event.target.value)}
                    rows={3}
                    maxLength={FEEDBACK_MAX}
                    placeholder="More real companies, or a way to compare two stocks."
                    className="mt-2 resize-none rounded-xl bg-background"
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {wanted.length}/{FEEDBACK_MAX}
                  </p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button onClick={send} disabled={sending} className="w-full shadow-glow">
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send feedback
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
