import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SignUpForm } from "@/components/auth/AuthForms";
import { AuthFooter, AuthLayout } from "@/components/auth/AuthLayout";
import { trackEvent } from "@/lib/analytics";
import { parseNext, type AfterSignup } from "@/lib/save-prompt";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Stockify Learn" },
      { name: "description", content: "Create a free Stockify account to save your lessons, streaks and practice portfolio." },
      { property: "og:title", content: "Create your account — Stockify Learn" },
      { property: "og:description", content: "Save your lessons, streaks and practice portfolio across devices." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { next?: AfterSignup } => {
    const next = parseNext(search["next"]);
    return next ? { next } : {};
  },
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  return (
    <AuthLayout title="Create your account" subtitle="Save your lessons, streaks and practice portfolio.">
      <SignUpForm
        onSuccess={({ needsConfirmation }) => {
          trackEvent("sign_up_complete", { source: next ? "save_prompt" : "direct" });
          if (!needsConfirmation) void navigate({ to: next ?? "/dashboard" });
        }}
        footer={<AuthFooter>Already have an account? <Link to="/login">Sign in</Link></AuthFooter>}
      />
    </AuthLayout>
  );
}
