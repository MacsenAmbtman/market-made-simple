import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ForgotPasswordForm, ResetPasswordForm } from "@/components/auth/AuthForms";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Stockify" }] }),
  component: ResetPassword,
});

// Reset emails link here. The link signs the user in, so a signed-in visitor picks a new
// password; anyone else can request a link. Bare page: styling is left for Lovable.
function ResetPassword() {
  const { status } = useAuth();
  const navigate = useNavigate();
  if (status === "loading") return <main aria-busy="true" />;
  return (
    <main>
      <h1>{status === "signed-in" ? "Choose a new password" : "Reset your password"}</h1>
      {status === "signed-in" ? (
        <ResetPasswordForm onSuccess={() => void navigate({ to: "/learn" })} />
      ) : (
        <ForgotPasswordForm footer={<p><Link to="/login">Back to sign in</Link></p>} />
      )}
    </main>
  );
}
