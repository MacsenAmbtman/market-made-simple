import { createFileRoute } from "@tanstack/react-router";

// Called hourly by Lovable Cloud's scheduler with `Authorization: Bearer $LOVABLE_CRON_SECRET`.
export const Route = createFileRoute("/api/cron/daily-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { runDailyReminders } = await import("@/lib/account-email.server");
        return runDailyReminders(request);
      },
    },
  },
});
