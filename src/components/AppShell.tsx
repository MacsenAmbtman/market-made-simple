import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, LineChart, BookA, Trophy, Calculator, ChevronDown, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import logoAsset from "@/assets/stockify-logo-round.png.asset.json";
import type { ReactNode } from "react";
import { StreakBadge } from "@/components/daily/DailyChallenge";
import { AccountMenu } from "@/components/auth/AccountMenu";

const nav = [
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/simulator", label: "Paper Simulator", icon: LineChart },
  { to: "/calculator", label: "Growth Calculator", icon: Calculator },
] as const;

// Secondary pages live behind a "More" menu so the three main features stand out.
const more = [
  { to: "/progress", label: "My Progress", icon: Trophy },
  { to: "/glossary", label: "Glossary", icon: BookA },
] as const;

function MoreMenu({ path, mobile }: { path: string; mobile?: boolean }) {
  const active = more.some((m) => path.startsWith(m.to));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={mobile
          ? `flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`
          : `flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:px-3 ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
      >
        {mobile ? <><MoreHorizontal className="h-5 w-5" />More</> : <>More<ChevronDown className="h-4 w-4" /></>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={mobile ? "top" : "bottom"} className="w-48">
        {more.map(({ to, label, icon: Icon }) => (
          <DropdownMenuItem key={to} asChild className="min-h-11 cursor-pointer">
            <Link to={to}><Icon className="h-4 w-4" />{label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LogoImage({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt=""
      width={64}
      height={64}
      className={`${className} rounded-full object-cover`}
    />
  );
}

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Link to="/" aria-label="Stockify home" className="inline-block shrink-0">
      <LogoImage className={className} />
    </Link>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
      <LogoImage className="h-8 w-8" />
      <span className="font-display font-bold uppercase leading-none tracking-tight">STOCKIFY</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 md:px-8 lg:gap-4">
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
            <MoreMenu path={path} />
          </nav>
          <div className="flex items-center gap-2"><StreakBadge /><AccountMenu /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      <nav className="app-bottom-bar fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-surface md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`flex flex-col items-center gap-1 py-2 text-[11px] ${path.startsWith(to) ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />{label.replace(/^(Paper|Growth) /, "")}
          </Link>
        ))}
        <MoreMenu path={path} mobile />
      </nav>
    </div>
  );
}
