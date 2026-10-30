<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Scheduled callbacks

- HTTP callbacks invoked by the platform scheduler live under `src/routes/api/public/` and verify the request with `authenticateCronRequest` from `src/integrations/supabase/cron-auth.ts`: only the `/api/public/` prefix bypasses published-site auth, so a scheduler call to any other path is blocked before it reaches the handler.

## Feedback

- `public.feedback` is write-only from the app (an INSERT policy and no SELECT policy, by
  design): visitors must never be able to read other people's responses through the site, so
  read them back with a service-role query instead of adding a read policy.
