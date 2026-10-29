import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/AppShell";

const nav = [
  { to: "/learn", label: "Learn" },
  { to: "/simulator", label: "Simulator" },
  { to: "/calculator", label: "Growth Calculator" },
  { to: "/glossary", label: "Glossary" },
] as const;

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.77.12V9.68a5.7 5.7 0 0 0-.77-.05A5.68 5.68 0 1 0 15.54 15.3V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const socials = [
  { href: "https://www.tiktok.com/@stockifylearn", label: "TikTok @stockifylearn", Icon: TikTokIcon },
  { href: "https://www.instagram.com/stockifylearn", label: "Instagram @stockifylearn", Icon: InstagramIcon },
];

export function SiteFooter() {
  const linkCls = "text-sm text-muted-foreground transition-colors hover:text-foreground";
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">The stock market, finally in plain English.</p>
          <div className="mt-5 flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Icon />
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Follow Stockify — @stockifylearn</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Explore</h3>
          <ul className="mt-3 space-y-2">
            {nav.map(({ to, label }) => <li key={to}><Link to={to} className={linkCls}>{label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-3 space-y-2">
            <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
            <li><Link to="/terms" className={linkCls}>Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex gap-3 rounded-2xl border border-border bg-card p-5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Stockify is strictly an educational platform and paper trading simulator. Content is for informational and learning purposes only and does not constitute financial, investment, or trading advice.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted-foreground">© 2026 Stockify. All rights reserved.</div>
    </footer>
  );
}
