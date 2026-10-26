import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Glossary — Stockify" },
      { name: "description", content: "Investing terms explained in plain English." },
      { property: "og:title", content: "Glossary — Stockify" },
      { property: "og:description", content: "Investing jargon, decoded." },
    ],
  }),
  component: Glossary,
});

const terms = [
  ["Stock", "A small piece of ownership in a company."],
  ["Share", "One unit of a stock."],
  ["Dividend", "A slice of company profit paid to shareholders."],
  ["Index fund", "A basket holding many stocks at once, like the S&P 500."],
  ["Compound interest", "Earning returns on your past returns."],
  ["Portfolio", "Everything you own as an investor."],
  ["Volatility", "How much a price jumps around."],
  ["Bull / Bear market", "Prices rising (bull) or falling (bear) over time."],
];

function Glossary() {
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Glossary</h1>
      <p className="mt-1 text-muted-foreground">Jargon, translated.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {terms.map(([t, d]) => (
          <div key={t} className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="font-semibold text-primary">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
