import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SignUpForm } from "@/components/auth/AuthForms";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your account — Stockify" }] }),
  component: Signup,
});

// Bare page: layout and styling are left for Lovable.
function Signup() {
  const navigate = useNavigate();
  return (
    <main>
      <h1>Create your account</h1>
      <SignUpForm
        onSuccess={({ needsConfirmation }) => { if (!needsConfirmation) void navigate({ to: "/learn" }); }}
        footer={<p>Already have an account? <Link to="/login">Sign in</Link></p>}
      />
    </main>
  );
}
