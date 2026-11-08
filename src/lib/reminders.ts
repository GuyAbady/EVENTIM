import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EventRow, RegistrationRow } from "@/lib/types/database";
import { buildReminderEmail, detectEmailLocale } from "@/lib/email/templates";
import { logEmail, sendEmail } from "@/lib/email/send";
import { getPublicEventUrl } from "@/lib/site";
import { isReminderDue } from "@/lib/reminder-schedule";

export { reminderDueAt } from "@/lib/reminder-schedule";

export type ReminderSummary = {
  eventId: string;
  title: string;
  recipients: number;
  sent: number;
  failed: number;
};

// Sends the reminder for one event to every confirmed registration with an
// email, logs each attempt, and stamps reminder_sent_at.
export async function sendEventReminder(
  client: SupabaseClient<Database>,
  event: EventRow,
  opts: { kind?: "reminder" | "manual"; sentBy?: string | null } = {},
): Promise<ReminderSummary> {
  const { data } = await client
    .from("inv_registrations")
    .select("*")
    .eq("event_id", event.id)
    .eq("status", "confirmed")
    .not("email", "is", null);
  const recipients = (data ?? []) as RegistrationRow[];
  const locale = detectEmailLocale(event.title);
  const url = getPublicEventUrl(event.slug);

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    if (!r.email) continue;
    const mail = buildReminderEmail({
      event,
      recipientName: r.full_name,
      guestCount: r.guest_count,
      invitationUrl: url,
      locale,
    });
    const result = await sendEmail(r.email, mail.subject, mail.html, mail.text);
    if (result.ok) sent += 1;
    else failed += 1;
    await logEmail(client, {
      event_id: event.id,
      registration_id: r.id,
      kind: opts.kind ?? "reminder",
      to_email: r.email,
      subject: mail.subject,
      result,
      sent_by: opts.sentBy ?? null,
    });
  }

  // If every send failed (for example, email not configured) leave the
  // reminder open so the next run retries it.
  if (failed === 0 || sent > 0) {
    await client.from("inv_events").update({ reminder_sent_at: new Date().toISOString() }).eq("id", event.id);
  }
  return { eventId: event.id, title: event.title, recipients: recipients.length, sent, failed };
}

// Due = the reminder moment falls before the next scheduled run.
export async function runDueReminders(
  client: SupabaseClient<Database>,
  opts: { now?: Date; horizonHours?: number } = {},
): Promise<ReminderSummary[]> {
  const now = opts.now ?? new Date();
  const horizon = opts.horizonHours ?? 24;

  const { data } = await client
    .from("inv_events")
    .select("*")
    .eq("is_active", true)
    .is("reminder_sent_at", null)
    .gt("reminder_offset_hours", 0)
    .gt("date_time", now.toISOString());
  const candidates = (data ?? []) as EventRow[];

  const due = candidates.filter((e) => isReminderDue(e, now, horizon));

  const results: ReminderSummary[] = [];
  for (const event of due) {
    results.push(await sendEventReminder(client, event, { kind: "reminder" }));
  }
  return results;
}
