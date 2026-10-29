import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GrowthCalculator } from "@/components/calculator/GrowthCalculator";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Growth Calculator — Stockify Learn" },
      { name: "description", content: "See how compound interest grows your money over time." },
      { property: "og:title", content: "Growth Calculator — Stockify Learn" },
      { property: "og:description", content: "An interactive compound interest and wealth growth calculator." },
    ],
  }),
  component: Calculator,
});

function Calculator() {
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Growth Calculator</h1>
      <p className="mt-1 text-muted-foreground">Compound interest is money earning money on the money it already earned. Drag the sliders and watch it snowball.</p>
      <div className="mt-6">
        <GrowthCalculator />
      </div>
    </AppShell>
  );
}
