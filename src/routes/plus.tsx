import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContinueOnComputer } from "@/components/ContinueOnComputer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";
import { joinWaitlist } from "@/lib/waitlist.functions";
import { normaliseEmail, PLUS_PRICE_LABEL } from "@/lib/waitlist";

export const Route = createFileRoute("/plus")({
  head: () => ({
    meta: [
      { title: "Stockify Plus waitlist — Stockify Learn" },
      { name: "description", content: "Stockify Plus isn't available yet. Join the waitlist to hear when it launches." },
      { property: "og:title", content: "Stockify Plus waitlist — Stockify Learn" },
      { property: "og:description", content: "Join the waitlist for Stockify Plus: more simulated practice and new lessons." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlusPage,
});

export const PLUS_FEATURES = [
  { title: "Unlimited Paper Simulator practice and scenarios", soon: false },
  { title: "Full day trading practice mode (simulated money only)", soon: false },
  { title: "Advanced progress tracking", soon: true },
  { title: "New lessons", soon: true },
] as const;

function PlusPage() {
  const { status, user } = useAuth();
  const join = useServerFn(joinWaitlist);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "joined" | "duplicate">(null);

  useEffect(() => { trackEvent("plus_page_view"); }, []);

  const submit = async (useAccount: boolean) => {
    setError(null);
    if (!useAccount && !normaliseEmail(email)) { setError("Please enter a valid email address."); return; }
    setBusy(true);
    try {
      const r = await join({ data: useAccount ? { useAccount: true, page: "/plus" } : { email, page: "/plus" } });
      if (r.status === "rate_limited") { setError("Too many tries. Please wait a few minutes and try again."); return; }
      setDone(r.status);
      trackEvent(r.status === "joined" ? "waitlist_join" : "waitlist_duplicate", { signed_in: status === "signed-in" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const onSubmit = (e: FormEvent) => { e.preventDefault(); void submit(false); };

  return (
    <AppShell>
      <div className="md:hidden"><ContinueOnComputer /></div>
      <div className="mx-auto hidden max-w-2xl md:block">
        <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> Not available yet — this is a waitlist
        </p>
        <h1 className="mt-4 text-4xl font-bold">Stockify Plus</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          We're thinking about a paid plan for people who want more practice. Nothing is charged today, and the free lessons stay free.
        </p>
        <div className="mt-8 rounded-2xl border bg-card p-8 shadow-card">
          <p className="text-sm text-muted-foreground">Planned price</p>
          <p className="font-display text-4xl font-bold">{PLUS_PRICE_LABEL}<span className="text-lg font-medium text-muted-foreground"> a month</span></p>
          <ul className="mt-6 space-y-3">
            {PLUS_FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{f.title}{f.soon && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Coming soon</span>}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 border-t pt-6">
            {done ? (
              <p role="status" className="rounded-xl bg-accent p-4 text-accent-foreground">
                {done === "joined" ? "You're on the list. We'll email you when Stockify Plus launches." : "You're already on the list. We'll email you when Stockify Plus launches."}
              </p>
            ) : status === "signed-in" && user?.email ? (
              <div>
                <Button size="lg" disabled={busy} onClick={() => void submit(true)}>Join the waitlist</Button>
                <p className="mt-2 text-sm text-muted-foreground">We'll use {user.email}.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="flex gap-3">
                <Input type="email" aria-label="Email address" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} className="h-11" />
                <Button type="submit" size="lg" disabled={busy}>Join the waitlist</Button>
              </form>
            )}
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            {!done && <p className="mt-3 text-sm text-muted-foreground">We'll only use your email to tell you when Plus launches, and you can unsubscribe at any time.</p>}
          </div>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Educational only, not financial advice. All trading in Stockify uses simulated money. See our <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
      </div>
    </AppShell>
  );
}
