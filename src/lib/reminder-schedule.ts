// Pure scheduling helpers, shared by the cron runner and the admin UI.
import type { EventRow } from "@/lib/types/database";

export function reminderDueAt(event: Pick<EventRow, "date_time" | "reminder_offset_hours">): Date | null {
  if (event.reminder_offset_hours <= 0) return null;
  return new Date(new Date(event.date_time).getTime() - event.reminder_offset_hours * 3600 * 1000);
}

// A reminder is due when its moment falls before the next scheduled run
// (now + horizon), the event has not happened yet, and nothing was sent.
export function isReminderDue(
  event: Pick<EventRow, "date_time" | "reminder_offset_hours" | "reminder_sent_at" | "is_active">,
  now: Date,
  horizonHours: number,
): boolean {
  if (!event.is_active || event.reminder_sent_at) return false;
  const dueAt = reminderDueAt(event);
  if (!dueAt) return false;
  if (new Date(event.date_time).getTime() <= now.getTime()) return false;
  return dueAt.getTime() <= now.getTime() + horizonHours * 3600 * 1000;
}
