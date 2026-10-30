import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
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
import { useEngagement } from "@/hooks/use-engagement";
import {
  EMPTY_RECORD,
  isTyping,
  readInviteRecord,
  shouldInvite,
  writeInviteRecord,
  type InviteRecord,
} from "@/lib/feedback-invite";

/**
 * No feedback button anywhere — this asks on its own, once, when a visitor has clearly
 * spent time here (a minute of active reading, or five different screens opened).
 * Saying "Not now" closes it for good, and so does sending an answer.
 */
export function FeedbackInvite() {
  const { seconds, screens, path } = useEngagement();
  const [record, setRecord] = useState<InviteRecord>(EMPTY_RECORD);
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState("");
  const [wanted, setWanted] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const asked = useRef(false);

  // Read the "already asked" flag after hydration, never during render.
  useEffect(() => {
    setRecord(readInviteRecord());
  }, []);

  useEffect(() => {
    if (asked.current || open) return;
    if (!shouldInvite({ seconds, screens, path }, record)) return;
    if (isTyping()) return; // wait for them to leave the box they're in
    asked.current = true;
    setRecord(writeInviteRecord({ asked: true }));
    setOpen(true);
  }, [seconds, screens, path, record, open]);

  function dismiss() {
    setOpen(false);
  }

  function resetForm() {
    setSent(false);
    setLiked("");
    setWanted("");
    setError("");
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
      writeInviteRecord({ submitted: true });
      setRecord(readInviteRecord());
      setSent(true);
    } catch {
      setError("We couldn't save that. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-md gap-5 rounded-2xl border-border bg-card p-5 sm:rounded-2xl sm:p-6">
        {sent ? (
          <>
            <DialogHeader className="space-y-3 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
                <Check className="h-6 w-6" />
              </span>
              <DialogTitle className="text-2xl font-bold sm:text-3xl">Thanks — that's logged</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Every answer lands in the same list we read before deciding what to build next.
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={() => {
                dismiss();
                resetForm();
              }}
              className="h-12 w-full rounded-xl text-base sm:h-11"
            >
              Done
            </Button>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Feedback</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                You've been here a while — mind answering two quick questions?
              </DialogDescription>
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

              <Button
                onClick={dismiss}
                variant="ghost"
                className="h-12 w-full rounded-xl text-base sm:h-11"
              >
                Not now
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
