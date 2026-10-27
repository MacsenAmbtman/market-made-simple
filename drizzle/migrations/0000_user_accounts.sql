-- User accounts: one profile and one progress row per auth user, created at sign-up.
-- Every row is private to its owner (RLS); server code uses the service role for emails and cron.

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  timezone text NOT NULL DEFAULT 'UTC',
  email_reminders boolean NOT NULL DEFAULT true,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  welcome_email_sent_at timestamptz,
  last_reminder_on date,
  last_password_reset_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX profiles_email_idx ON public.profiles (email);
--> statement-breakpoint
-- Mirrors the browser's stockify:* localStorage stores so progress follows the account.
CREATE TABLE public.user_progress (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  completed_lessons text[] NOT NULL DEFAULT '{}',
  lessons jsonb NOT NULL DEFAULT '{}'::jsonb,
  rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  best_streak integer NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  last_check_in date,
  simulator jsonb,
  simulator_updated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE TRIGGER user_progress_touch_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(trim(NEW.raw_user_meta_data ->> 'display_name'), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'timezone', ''), 'UTC')
  );
  INSERT INTO public.user_progress (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_email_changed AFTER UPDATE OF email ON auth.users
  FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_change();
--> statement-breakpoint
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Signed-in users read their own profile and may change only their preferences;
-- email bookkeeping columns are written by the server alone.
REVOKE ALL ON public.profiles, public.user_progress FROM anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON public.profiles TO authenticated;
--> statement-breakpoint
GRANT UPDATE (display_name, timezone, email_reminders) ON public.profiles TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.user_progress TO authenticated;
--> statement-breakpoint
GRANT ALL ON public.profiles, public.user_progress TO service_role;
--> statement-breakpoint
CREATE POLICY "Users read their own profile" ON public.profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
--> statement-breakpoint
CREATE POLICY "Users update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
--> statement-breakpoint
CREATE POLICY "Users read their own progress" ON public.user_progress
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "Users create their own progress" ON public.user_progress
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "Users update their own progress" ON public.user_progress
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
