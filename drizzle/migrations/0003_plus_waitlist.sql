CREATE TABLE public.plus_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  source_page text NOT NULL DEFAULT '' CHECK (char_length(source_page) <= 200),
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX plus_waitlist_email_lower_key ON public.plus_waitlist (lower(email));

CREATE TABLE public.plus_waitlist_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plus_waitlist_attempts_lookup ON public.plus_waitlist_attempts (client_hash, created_at);

GRANT ALL ON public.plus_waitlist TO service_role;
GRANT ALL ON public.plus_waitlist_attempts TO service_role;
REVOKE ALL ON public.plus_waitlist FROM anon, authenticated;
REVOKE ALL ON public.plus_waitlist_attempts FROM anon, authenticated;

ALTER TABLE public.plus_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus_waitlist_attempts ENABLE ROW LEVEL SECURITY;
-- No policies: only server code with the service role (and the owner via the backend) can read or write.