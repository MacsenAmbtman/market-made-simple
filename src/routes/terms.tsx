import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Stockify Learn" },
      { name: "description", content: "The terms for using Stockify's lessons and paper trading simulator." },
      { property: "og:title", content: "Terms of Service — Stockify Learn" },
      { property: "og:description", content: "The rules for using Stockify." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <p>By using Stockify you agree to these terms. If you do not agree, please do not use the app.</p>
      <h2>Educational use only</h2>
      <p>Stockify is strictly an educational platform and paper trading simulator. Content is for informational and learning purposes only and does not constitute financial, investment, or trading advice. Always do your own research or speak to a licensed professional before investing real money.</p>
      <h2>Paper trading</h2>
      <p>All simulator balances and trades are fictional. Prices may be simulated or delayed and do not reflect real market execution. Past performance never guarantees future results.</p>
      <h2>Your account</h2>
      <p>You are responsible for keeping your login details secure and for activity on your account. Please provide accurate information when signing up.</p>
      <h2>Acceptable use</h2>
      <p>Do not misuse the service, attempt to break it, or use it for anything unlawful.</p>
      <h2>Limitation of liability</h2>
      <p>Stockify is provided "as is" without warranties. We are not liable for any losses or decisions made based on content in the app.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use after changes means you accept the updated terms.</p>
    </LegalPage>
  );
}
