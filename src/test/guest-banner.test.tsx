import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

// The banner's whole job is "show this sentence to guests, nobody else", so the auth
// state is stubbed and the router's Link is stubbed to a plain anchor we can read href from.
const auth = vi.hoisted(() => ({ status: "signed-out" as "loading" | "signed-in" | "signed-out" }));

vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ status: auth.status }) }));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const real = await importOriginal<Record<string, unknown>>();
  return {
    ...real,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  };
});

const { GuestModeBanner } = await import("@/components/simulator/GuestModeBanner");

describe("Paper Simulator guest-mode banner", () => {
  it("tells guests their portfolio and streak are not saved, and links to sign-up", () => {
    auth.status = "signed-out";
    const { container } = render(<GuestModeBanner />);

    expect(container.textContent).toBe(
      "Trading in guest mode. Create a free account to save your portfolio and streak!",
    );
    expect(screen.getByRole("link", { name: "Create a free account" })).toHaveAttribute("href", "/signup");
  });

  it("stays hidden for signed-in users and while the session is still loading", () => {
    for (const status of ["signed-in", "loading"] as const) {
      auth.status = status;
      const { container } = render(<GuestModeBanner />);
      expect(container).toBeEmptyDOMElement();
    }
  });
});
