import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Check, Monitor, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendWorkstationLink, WORKSTATION_URL } from "@/lib/share-link";

/** Phone stand-in for trading pages: explains what's on the computer and shares the link. */
export function ContinueOnComputer() {
  const [note, setNote] = useState<string | null>(null);
  const send = async () => {
    const r = await sendWorkstationLink();
    if (r === "copied") setNote("Link copied — paste it on your computer.");
    else if (r === "failed") setNote(WORKSTATION_URL);
  };
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-1 py-6 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-accent text-primary">
        <Monitor className="h-9 w-9" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold leading-tight">Continue on your computer</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Practice investing and day trading with fake money — full charts, order types and your paper portfolio. It works best on a bigger screen.
      </p>
      <Button size="lg" className="mt-8 h-14 w-full text-base shadow-glow" onClick={send}>
        {note && !note.startsWith("http") ? <Check /> : <Share2 />} Send the link to my computer
      </Button>
      {note && <p className="mt-3 break-all text-sm text-primary" aria-live="polite">{note}</p>}
      <Button asChild size="lg" variant="secondary" className="mt-3 h-14 w-full text-base">
        <Link to="/learn"><BookOpen /> Back to Learn</Link>
      </Button>
    </section>
  );
}
