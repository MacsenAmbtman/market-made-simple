import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, LineChart, BookA, Trophy, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/simulator", label: "Paper Simulator", icon: LineChart },
  { to: "/glossary", label: "Glossary", icon: BookA },
  { to: "/progress", label: "My Progress", icon: Trophy },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><TrendingUp className="h-4 w-4" /></span>
      Stockify
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-60 shrink-0 flex-col gap-8 border-r bg-surface p-5 md:flex">
        <Logo />
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = path.startsWith(to);
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="flex h-14 items-center border-b px-4 md:hidden"><Logo /></header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-surface md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`flex flex-col items-center gap-1 py-2 text-[11px] ${path.startsWith(to) ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />{label.replace("Paper ", "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}
