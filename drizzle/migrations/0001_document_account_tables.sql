-- Documents the account tables. Applying this migration also runs the pending
-- 0000_user_accounts change, which creates them.
COMMENT ON TABLE public.profiles IS 'One row per signed-up user, created automatically at sign-up.';
--> statement-breakpoint
COMMENT ON TABLE public.user_progress IS 'Saved lessons, streak, rewards and simulator state for one account.';
