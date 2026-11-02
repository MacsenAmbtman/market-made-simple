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

## Progressive web app

- Home-screen support stays manifest-only (`public/manifest.webmanifest` plus the head tags in
  `src/routes/__root.tsx`); add no service worker, `vite-plugin-pwa`, or offline caching unless
  the user explicitly asks for offline use, because workers keep serving stale bundles inside
  the Lovable preview.

- Phones (<768px) are learning-only: /learn shows the LessonPath, lessons play in MobileLessonPlayer with in-order locking, and trading routes (simulator, calculator, day-trading lessons) render ContinueOnComputer; desktop keeps the original pages untouched. Switch layouts with md: CSS, and use useIsPhone (null until mounted) only for logic such as redirects, so server and first client render match.
- New per-lesson progress (e.g. XP) is stored as optional fields on LessonProgress and handled in parseLessons/mergeLesson, so it syncs with the existing lessons column without a schema change and old saves keep working.
