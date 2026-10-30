import { useState } from "react";
import { Check, Loader2, MessageSquare, Send } from "lucide-react";
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
 * Small round comment-box button for the top of the page, sized to sit beside the streak
 * flame in the header (and beside the sign-in buttons on the home page). It opens the
 * same feedback card as before — one title, two open boxes, one button, no helper copy
 * and no character counters (the 2000-character cap is still enforced, just silently).
 * Every control inside is sized for a thumb (48px tall on phones).
 */
export function FeedbackButton({ className = "" }: { className?: string }) {
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
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      >
        <MessageSquare className="h-4 w-4" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-md gap-5 rounded-2xl border-border bg-card p-5 sm:rounded-2xl sm:p-6">
          {sent ? (
            <>
              <DialogHeader className="space-y-3 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
                  <Check className="h-6 w-6" />
                </span>
                <DialogTitle className="text-2xl font-bold sm:text-3xl">
                  Thanks — that's logged
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Every answer lands in the same list we read before deciding what to build next.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={close} className="h-12 w-full rounded-xl text-base sm:h-11">
                Done
              </Button>
            </>
          ) : (
            <>
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Feedback
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="feedback-liked" className="text-base font-semibold">
                    What did you like or dislike?
                  </Label>
                  <Textarea
                    id="feedback-liked"
                    value={liked}
                    onChange={(event) => setLiked(event.target.value)}
                    rows={4}
                    maxLength={FEEDBACK_MAX}
                    placeholder="The lessons were clear, but the simulator felt slow."
                    className="mt-2 min-h-28 resize-none rounded-xl bg-background p-3 text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="feedback-wanted" className="text-base font-semibold">
                    What features should we add next?
                  </Label>
                  <Textarea
                    id="feedback-wanted"
                    value={wanted}
                    onChange={(event) => setWanted(event.target.value)}
                    rows={4}
                    maxLength={FEEDBACK_MAX}
                    placeholder="More real companies, or a way to compare two stocks."
                    className="mt-2 min-h-28 resize-none rounded-xl bg-background p-3 text-base"
                  />
                </div>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                <Button
                  onClick={send}
                  disabled={sending}
                  className="h-12 w-full rounded-xl text-base shadow-glow sm:h-11"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
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
