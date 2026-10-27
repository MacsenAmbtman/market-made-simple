import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/AppShell";
import { SiteFooter } from "@/components/SiteFooter";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-3xl items-center justify-between p-5">
        <LogoMark />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <div className="rounded-2xl border bg-card p-6 shadow-card md:p-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated {updated}</p>
          <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
