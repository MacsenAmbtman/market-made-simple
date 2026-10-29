import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { BookOpen, LineChart, Trophy, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  // The session lives in the browser, so the check runs client-side only.
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Dashboard — Stockify Learn" },
      { name: "description", content: "Your Stockify Learn home: lessons, practice portfolio and progress." },
      { property: "og:title", content: "Dashboard — Stockify Learn" },
      { property: "og:description", content: "Your lessons, practice portfolio and progress in one place." },
    ],
  }),
  component: Dashboard,
});

const cards = [
  { to: "/learn", icon: BookOpen, title: "Continue learning", text: "Pick up your next bite-sized lesson." },
  { to: "/simulator", icon: LineChart, title: "My portfolio", text: "Practice trades with paper money." },
  { to: "/progress", icon: Trophy, title: "My progress", text: "See modules completed and rewards earned." },
] as const;

function Dashboard() {
  const { profile, user } = useAuth();
  const name = profile?.display_name || user?.email?.split("@")[0] || "there";
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Welcome back, {name}</h1>
      <p className="mt-2 text-muted-foreground">Where would you like to go today?</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="group rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
            <h2 className="mt-4 flex items-center gap-2 text-lg font-semibold">{title}<ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" /></h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
