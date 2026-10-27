import { createFileRoute } from "@tanstack/react-router";

// Called hourly by Lovable Cloud's scheduler with `Authorization: Bearer $LOVABLE_CRON_SECRET`.
// Lives under /api/public/ so the scheduler reaches it even when the published site is locked.
export const Route = createFileRoute("/api/public/cron/daily-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { runDailyReminders } = await import("@/lib/account-email.server");
        return runDailyReminders(request);
      },
    },
  },
});
