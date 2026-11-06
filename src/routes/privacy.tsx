import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Stockify Learn" },
      { name: "description", content: "How Stockify collects, uses and protects your information." },
      { property: "og:title", content: "Privacy Policy — Stockify Learn" },
      { property: "og:description", content: "How Stockify handles your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="November 2026">
      <p>This policy explains what information Stockify collects, how we use it, and the choices you have.</p>
      <h2>Information we collect</h2>
      <p>When you create an account we store your email address and display name. We also store your lesson progress, streaks, quiz results and paper trading activity so you can pick up where you left off. As a guest, this data stays in your browser.</p>
      <h2>How we use it</h2>
      <p>We use your information to run the app, save your progress, and send optional emails such as reminders. You can turn reminders off at any time.</p>
      <h2>Stockify Plus waitlist</h2>
      <p>If you join the Stockify Plus waitlist, we store your email address, when you joined and which page you joined from. We only use it to tell you when Stockify Plus launches, and every email will include a way to unsubscribe. You can also ask us to remove you at any time by emailing stockifylearn@gmail.com. To prevent abuse, we keep a scrambled (hashed) version of your network address when you join; it can't be used to identify you directly.</p>
      <h2>Cookies and analytics</h2>
      <p>If you press "Accept" on our cookie banner, we use Google Analytics to understand how people use Stockify (for example which pages and lessons are visited), and the TikTok Pixel to measure how our TikTok ads perform (for example whether a visit from an ad leads to starting a lesson or creating an account). These tools set cookies and receive information about your visit, such as pages viewed, device and browser details. We do not send your email, name or account details to TikTok. If you press "Decline", or make no choice, these tools are not loaded and the site works the same. You can change your choice at any time using "Cookie settings" in the site footer or on the Progress page.</p>
      <h2>Sharing</h2>
      <p>We do not sell your personal information. We only share it with service providers that help us host the app and send email, and only as needed to provide the service.</p>
      <h2>Data retention and deletion</h2>
      <p>We keep your data while your account is active. You can ask us to delete your account and associated data at any time.</p>
      <h2>Security</h2>
      <p>We use industry-standard measures to protect your information, but no online service can be completely secure.</p>
      <h2>Changes</h2>
      <p>We may update this policy. If changes are significant, we will let you know in the app.</p>
    </LegalPage>
  );
}
