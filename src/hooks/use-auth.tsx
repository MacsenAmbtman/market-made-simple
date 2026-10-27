import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { accountDb, type ProfileRow } from "@/lib/account-db";
import { sendWelcomeEmail } from "@/lib/account.functions";
import { clearLocalAccountData, startAccountSync, type AccountSync } from "@/lib/account-sync";

export type AuthStatus = "loading" | "signed-in" | "signed-out";
export type Profile = Pick<ProfileRow, "id" | "email" | "display_name" | "timezone" | "email_reminders">;

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** True after arriving from a password-reset link, until a new password is set. */
  recovering: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Tracks the Supabase session and keeps the signed-in user's progress synced. Mount once, near the root. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recovering, setRecovering] = useState(false);
  const sync = useRef<AccountSync | null>(null);
  const userId = session?.user.id ?? null;

  // Session state lives in the browser, so it's read after mount (SSR always renders "loading").
  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setStatus(data.session ? "signed-in" : "signed-out");
    });
    // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock the client.
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setStatus(next ? "signed-in" : "signed-out");
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "USER_UPDATED" || event === "SIGNED_OUT") setRecovering(false);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return setProfile(null);
    const { data } = await accountDb(supabase).from("profiles").select("id, email, display_name, timezone, email_reminders").eq("id", userId).maybeSingle();
    setProfile(data);
  }, [userId]);

  // Per signed-in user: sync progress, load the profile, and send the welcome email once.
  useEffect(() => {
    if (!userId) return;
    sync.current = startAccountSync(userId);
    void refreshProfile();
    const welcomeKey = `stockify:welcome-checked:${userId}`;
    try {
      if (!sessionStorage.getItem(welcomeKey)) {
        sessionStorage.setItem(welcomeKey, "1");
        sendWelcomeEmail().catch((e: unknown) => console.error("[welcome-email]", e));
      }
    } catch { /* storage blocked: skip, the server only sends it once anyway */ }
    return () => {
      void sync.current?.stop();
      sync.current = null;
    };
  }, [userId, refreshProfile]);

  const signOut = useCallback(async () => {
    // Save anything pending before the session (and its write access) goes away.
    await sync.current?.stop();
    sync.current = null;
    await supabase.auth.signOut();
    clearLocalAccountData();
  }, []);

  const value: AuthContextValue = { status, user: session?.user ?? null, session, profile, recovering, signOut, refreshProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
