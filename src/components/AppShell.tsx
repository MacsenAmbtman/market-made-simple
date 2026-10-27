import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, LineChart, BookA, Trophy, TrendingUp, Calculator } from "lucide-react";
import type { ReactNode } from "react";
import { StreakBadge } from "@/components/daily/DailyChallenge";
import { AccountMenu } from "@/components/auth/AccountMenu";

const nav = [
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/simulator", label: "Paper Simulator", icon: LineChart },
  { to: "/calculator", label: "Growth Calculator", icon: Calculator },
  { to: "/glossary", label: "Glossary", icon: BookA },
  { to: "/progress", label: "My Progress", icon: Trophy },
] as const;

export function LogoMark() {
  return (
    <Link to="/" aria-label="Stockify home" className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
      <TrendingUp className="h-4 w-4" />
    </Link>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><TrendingUp className="h-4 w-4" /></span>
      <span className="font-display font-bold uppercase leading-none tracking-tight">STOCKIFY</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = path.startsWith(to);
              return (
                <Link key={to} to={to} className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:px-3 ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <Icon className="hidden h-4 w-4 lg:block" />{label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2"><StreakBadge /><AccountMenu /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-surface md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`flex flex-col items-center gap-1 py-2 text-[11px] ${path.startsWith(to) ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />{label.replace(/^(Paper|Growth) /, "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}
