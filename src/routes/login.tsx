import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SignInForm } from "@/components/auth/AuthForms";
import { AuthFooter, AuthLayout } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Stockify Learn" },
      { name: "description", content: "Sign in to Stockify Learn to pick up your lessons and practice portfolio." },
      { property: "og:title", content: "Sign in — Stockify Learn" },
      { property: "og:description", content: "Pick up your lessons and practice portfolio where you left off." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <SignInForm
        onSuccess={() => void navigate({ to: "/dashboard" })}
        footer={
          <AuthFooter>
            <Link to="/reset-password">Forgot your password?</Link>
            <span className="mx-2">·</span>
            <Link to="/signup">Create an account</Link>
          </AuthFooter>
        }
      />
    </AuthLayout>
  );
}
