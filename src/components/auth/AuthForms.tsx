// Functional, deliberately unstyled auth forms: plain elements with no classes, ready to be
// restyled (or swapped for design-system inputs) in Lovable. All logic lives in @/lib/auth.

import { useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { MIN_PASSWORD_LENGTH, requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/auth";

function useSubmit<T>(action: (fields: Record<string, string>) => Promise<{ error: string | null } & T>, onDone?: (result: T) => void) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const fields = Object.fromEntries([...new FormData(e.currentTarget)].map(([k, v]) => [k, String(v)]));
    setPending(true);
    setError(null);
    try {
      const result = await action(fields);
      if (result.error) setError(result.error);
      else onDone?.(result);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };
  return { pending, error, onSubmit };
}

function Field({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <input id={id} {...input} className="h-11 w-full rounded-xl border border-input bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  );
}

const ErrorText = ({ error }: { error: string | null }) => (error ? <p role="alert" className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</p> : null);

export function SignInForm({ onSuccess, footer }: { onSuccess?: () => void; footer?: ReactNode }) {
  const { pending, error, onSubmit } = useSubmit((f) => signIn({ email: f["email"] ?? "", password: f["password"] ?? "" }), onSuccess);
  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <ErrorText error={error} />
      <button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
      {footer}
    </form>
  );
}

export function SignUpForm({ onSuccess, footer }: { onSuccess?: (r: { needsConfirmation: boolean }) => void; footer?: ReactNode }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { pending, error, onSubmit } = useSubmit(
    async (f) => {
      const r = await signUp({ email: f["email"] ?? "", password: f["password"] ?? "", displayName: f["name"] ?? "" });
      if (!r.error && r.needsConfirmation) setSentTo(f["email"] ?? "");
      return r;
    },
    onSuccess,
  );
  if (sentTo) return <p role="status" className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">Check {sentTo} for a link to confirm your account.</p>;
  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-4">
      <Field label="Name (optional)" name="name" type="text" autoComplete="given-name" maxLength={80} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label={`Password (at least ${MIN_PASSWORD_LENGTH} characters)`} name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
      <ErrorText error={error} />
      <button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:opacity-60">{pending ? "Creating account…" : "Create account"}</button>
      {footer}
    </form>
  );
}

export function ForgotPasswordForm({ footer }: { footer?: ReactNode }) {
  const [sent, setSent] = useState(false);
  const { pending, error, onSubmit } = useSubmit((f) => requestPasswordReset(f["email"] ?? ""), () => setSent(true));
  if (sent) return <p role="status" className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">If an account exists for that email, a reset link is on its way.</p>;
  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <ErrorText error={error} />
      <button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:opacity-60">{pending ? "Sending…" : "Email me a reset link"}</button>
      {footer}
    </form>
  );
}

/** For a signed-in user, including one who just opened a reset link. */
export function ResetPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const { pending, error, onSubmit } = useSubmit(async (f) => {
    if (f["password"] !== f["confirm"]) return { error: "Those passwords don't match." };
    return updatePassword(f["password"] ?? "");
  }, onSuccess);
  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-4">
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
      <ErrorText error={error} />
      <button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:opacity-60">{pending ? "Saving…" : "Set new password"}</button>
    </form>
  );
}
