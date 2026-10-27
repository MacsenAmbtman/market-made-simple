// Who gets a reminder email today, and which one. Pure, so the rules are testable.

import { addDays } from "./daily";
import type { ReminderKind } from "./email-templates";
import { lessons } from "./lessons";

/** Local hours (inclusive start, exclusive end) when reminders go out; an hourly cron catches each user once. */
export const SEND_FROM_HOUR = 17;
export const SEND_UNTIL_HOUR = 22;
/** Nudges about the next lesson go out at most this often, and stop after this long without activity. */
const LESSON_REMINDER_EVERY_DAYS = 3;
const GIVE_UP_AFTER_DAYS = 30;

function parts(now: Date, timeZone: string) {
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  } catch {
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  }
  const get = (t: string) => fmt.formatToParts(now).find((p) => p.type === t)?.value ?? "00";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

/** The user's local calendar date (YYYY-MM-DD) and hour; unknown time zones fall back to UTC. */
export const localTime = parts;

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

export type ReminderInput = {
  timezone: string;
  createdAt: string; // ISO timestamp
  lastReminderOn: string | null;
  lastCheckIn: string | null;
  streak: number;
  completedLessons: string[];
};

export function pickReminder(u: ReminderInput, now: Date): { today: string; reminder: ReminderKind } | null {
  const { day: today, hour } = parts(now, u.timezone);
  if (hour < SEND_FROM_HOUR || hour >= SEND_UNTIL_HOUR) return null;
  if (u.lastReminderOn === today) return null;
  if (u.lastCheckIn === today) return null; // already showed up today

  if (u.streak > 0 && u.lastCheckIn === addDays(today, -1)) return { today, reminder: { kind: "streak", streak: u.streak } };

  const lastActive = u.lastCheckIn ?? parts(new Date(u.createdAt), u.timezone).day;
  if (daysBetween(lastActive, today) > GIVE_UP_AFTER_DAYS) return null;
  if (u.lastReminderOn && daysBetween(u.lastReminderOn, today) < LESSON_REMINDER_EVERY_DAYS) return null;
  const next = lessons.find((l) => !u.completedLessons.includes(l.slug));
  return { today, reminder: { kind: "lesson", lessonTitle: next?.title ?? null } };
}
