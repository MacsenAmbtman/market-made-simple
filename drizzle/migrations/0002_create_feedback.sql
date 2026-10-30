CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liked text NOT NULL,
  wanted text NOT NULL DEFAULT '',
  page text NOT NULL DEFAULT '',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
ON public.feedback FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(btrim(liked)) BETWEEN 3 AND 2000
  AND char_length(btrim(wanted)) <= 2000
  AND char_length(page) <= 200
);