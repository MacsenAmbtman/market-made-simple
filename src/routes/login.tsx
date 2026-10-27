import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SignInForm } from "@/components/auth/AuthForms";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Stockify" }] }),
  component: Login,
});

// Bare page: layout and styling are left for Lovable.
function Login() {
  const navigate = useNavigate();
  return (
    <main>
      <h1>Sign in</h1>
      <SignInForm
        onSuccess={() => void navigate({ to: "/learn" })}
        footer={<p><Link to="/reset-password">Forgot your password?</Link> · <Link to="/signup">Create an account</Link></p>}
      />
    </main>
  );
}
