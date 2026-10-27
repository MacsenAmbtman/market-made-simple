import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, LineChart, LogOut, Trophy, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDaily } from "@/hooks/use-daily";
import { currentStreak } from "@/lib/daily";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Header account control: sign-in/up buttons for guests, a dropdown for signed-in users. */
export function AccountMenu() {
  const { status, user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (status === "loading") return <div className="h-9 w-9" aria-hidden />;

  if (status === "signed-out") {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex"><Link to="/login">Sign in</Link></Button>
        <Button asChild size="sm"><Link to="/signup">Sign up</Link></Button>
      </div>
    );
  }

  const name = profile?.display_name || user?.email || "Account";
  const initial = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Account menu" className="grid h-9 w-9 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground ring-offset-background transition hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="truncate font-normal">
          <div className="truncate font-semibold">{profile?.display_name || "Signed in"}</div>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <StreakRow />
        <DropdownMenuItem asChild><Link to="/simulator"><LineChart className="mr-2 h-4 w-4" />My portfolio</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/progress"><Trophy className="mr-2 h-4 w-4" />My progress</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/progress"><UserRound className="mr-2 h-4 w-4" />Account settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StreakRow() {
  const { daily } = useDaily();
  const days = daily ? currentStreak(daily) : 0;
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
      <Flame className="h-4 w-4 text-primary" />
      <span>{days} day streak</span>
      <span className="ml-auto text-xs text-muted-foreground">best {daily?.best ?? days}</span>
    </div>
  );
}
