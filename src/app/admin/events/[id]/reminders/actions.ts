"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildReminderEmail, detectEmailLocale } from "@/lib/email/templates";
import { logEmail, sendEmail } from "@/lib/email/send";
import { sendEventReminder } from "@/lib/reminders";
import { getPublicEventUrl } from "@/lib/site";
import type { EventRow } from "@/lib/types/database";

export type EmailActionResult =
  | { ok: true; sent: number; failed: number; to?: string }
  | { ok: false; error: string };

async function loadEvent(eventId: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("inv_events").select("*").eq("id", eventId).maybeSingle();
  return (data as EventRow | null) ?? null;
}

export async function sendRemindersNow(eventId: string): Promise<EmailActionResult> {
  const staff = await requireStaff();
  const event = await loadEvent(eventId);
  if (!event) return { ok: false, error: "not_found" };
  const supabase = await createClient();
  const summary = await sendEventReminder(supabase, event, { kind: "manual", sentBy: staff.id });
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true, sent: summary.sent, failed: summary.failed };
}

export async function sendRegistrationEmail(eventId: string, registrationId: string): Promise<EmailActionResult> {
  const staff = await requireStaff();
  const event = await loadEvent(eventId);
  if (!event) return { ok: false, error: "not_found" };
  const supabase = await createClient();
  const { data: reg } = await supabase
    .from("inv_registrations")
    .select("*")
    .eq("id", registrationId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!reg?.email) return { ok: false, error: "no_email" };

  const mail = buildReminderEmail({
    event,
    recipientName: reg.full_name,
    guestCount: reg.guest_count,
    invitationUrl: getPublicEventUrl(event.slug),
    locale: detectEmailLocale(event.title),
  });
  const result = await sendEmail(reg.email, mail.subject, mail.html, mail.text);
  await logEmail(supabase, {
    event_id: event.id,
    registration_id: reg.id,
    kind: "manual",
    to_email: reg.email,
    subject: mail.subject,
    result,
    sent_by: staff.id,
  });
  revalidatePath(`/admin/events/${eventId}`);
  return result.ok ? { ok: true, sent: 1, failed: 0, to: reg.email } : { ok: false, error: result.error };
}

export async function sendTestEmail(eventId: string): Promise<EmailActionResult> {
  const staff = await requireStaff();
  const event = await loadEvent(eventId);
  if (!event) return { ok: false, error: "not_found" };
  if (!staff.email) return { ok: false, error: "no_email" };
  const supabase = await createClient();
  const mail = buildReminderEmail({
    event,
    recipientName: staff.displayName ?? staff.email,
    guestCount: 2,
    invitationUrl: getPublicEventUrl(event.slug),
    locale: detectEmailLocale(event.title),
  });
  const result = await sendEmail(staff.email, mail.subject, mail.html, mail.text);
  await logEmail(supabase, {
    event_id: event.id,
    registration_id: null,
    kind: "test",
    to_email: staff.email,
    subject: mail.subject,
    result,
    sent_by: staff.id,
  });
  revalidatePath(`/admin/events/${eventId}`);
  return result.ok ? { ok: true, sent: 1, failed: 0, to: staff.email } : { ok: false, error: result.error };
}
