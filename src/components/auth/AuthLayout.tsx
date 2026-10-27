import type { ReactNode } from "react";
import { Logo } from "@/components/AppShell";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-hero px-4 py-12">
      <div className="mb-8"><Logo /></div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

export function AuthFooter({ children }: { children: ReactNode }) {
  return <div className="pt-2 text-center text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a:hover]:underline">{children}</div>;
}
