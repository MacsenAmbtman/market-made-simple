import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

/** Thin notice above the simulator for signed-out visitors: nothing they do here is saved to an account. */
export function GuestModeBanner() {
  const { status } = useAuth();
  if (status !== "signed-out") return null;

  return (
    <div className="mb-5 rounded-xl border border-primary/25 bg-accent px-4 py-2.5 text-center text-sm text-muted-foreground">
      Trading in guest mode.{" "}
      <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
        Create a free account
      </Link>{" "}
      to save your portfolio and streak!
    </div>
  );
}
