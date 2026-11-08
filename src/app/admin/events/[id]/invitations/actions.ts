"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatEventTime } from "@/lib/dates";
import { buildReminderEmail, detectEmailLocale } from "@/lib/email/templates";
import { defaultInvitationMessage } from "@/lib/invitation-message";
import { sendEmail } from "@/lib/email/send";
import { sendSms } from "@/lib/sms/send";
import { fillMessage, parseInviteeList } from "@/lib/invitations";
import { getPublicEventUrl } from "@/lib/site";
import type { EventRow, InviteeRow } from "@/lib/types/database";

// One click sends at most this many messages, so a server action stays well
// inside the hosting time limit and Gmail's daily quota is not burned at once.
const BULK_LIMIT = 40;

type SendChannel = "email" | "sms";

export type InviteActionResult =
  | { ok: true; sent: number; failed: number; remaining: number; lastError?: string }
  | { ok: false; error: string };

export type AddInviteesResult =
  | { ok: true; added: number; duplicates: number; invalid: string[] }
  | { ok: false; error: string };

async function loadEvent(eventId: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("inv_events").select("*").eq("id", eventId).maybeSingle();
  return (data as EventRow | null) ?? null;
}

async function messageContext(event: EventRow) {
  const locale = detectEmailLocale(event.title);
  const t = await getTranslations({ locale, namespace: "registrations" });
  const template = event.invitation_message?.trim() || (await defaultInvitationMessage(locale));
  const link = getPublicEventUrl(event.slug);
  const base = {
    event: event.title,
    date: formatEventDate(event.date_time, locale),
    time: formatEventTime(event.date_time),
    venue: event.venue_name ? t("atVenue", { venue: event.venue_name }) : "",
    link,
  };
  return { locale, link, render: (name: string) => fillMessage(template, { ...base, name }) };
}

async function deliver(
  event: EventRow,
  ctx: Awaited<ReturnType<typeof messageContext>>,
  invitee: InviteeRow,
  channel: SendChannel,
  sentBy: string,
) {
  const supabase = await createClient();
  const text = ctx.render(invitee.full_name);
  let to: string;
  let result: { ok: true; id?: string | null } | { ok: false; error: string };

  if (channel === "email") {
    if (!invitee.email) return { ok: false as const, error: "no_email" };
    to = invitee.email;
    const mail = buildReminderEmail({
      event,
      recipientName: invitee.full_name,
      guestCount: 1,
      invitationUrl: ctx.link,
      locale: ctx.locale,
      kind: "invitation",
      // The custom text already contains the link; strip it from the email body,
      // which has its own button.
      message: text.replace(ctx.link, "").replace(/[:\s]+$/, ""),
    });
    result = await sendEmail(to, mail.subject, mail.html, mail.text);
  } else {
    if (!invitee.phone) return { ok: false as const, error: "no_phone" };
    to = invitee.phone;
    result = await sendSms(to, text);
  }

  await supabase.from("inv_invitation_log").insert({
    event_id: event.id,
    invitee_id: invitee.id,
    channel,
    to_address: to,
    status: result.ok ? "sent" : "failed",
    error: result.ok ? null : result.error,
    provider_id: result.ok ? (result.id ?? null) : null,
    sent_by: sentBy,
  });
  return result;
}

export async function addInvitees(eventId: string, raw: string): Promise<AddInviteesResult> {
  await requireStaff();
  if (raw.length > 200_000) return { ok: false, error: "too_long" };
  const { rows, invalid } = parseInviteeList(raw);
  const supabase = await createClient();
  const { data: existing } = await supabase.from("inv_invitees").select("phone, email").eq("event_id", eventId);
  const phones = new Set((existing ?? []).map((r) => r.phone).filter(Boolean));
  const emails = new Set((existing ?? []).map((r) => r.email?.toLowerCase()).filter(Boolean));

  const fresh = [];
  let duplicates = 0;
  for (const r of rows) {
    if ((r.phone && phones.has(r.phone)) || (r.email && emails.has(r.email))) {
      duplicates += 1;
      continue;
    }
    if (r.phone) phones.add(r.phone);
    if (r.email) emails.add(r.email);
    fresh.push({ ...r, event_id: eventId });
  }

  if (fresh.length > 0) {
    const { error } = await supabase.from("inv_invitees").insert(fresh);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/events/${eventId}/invitations`);
  return { ok: true, added: fresh.length, duplicates, invalid };
}

export async function deleteInvitee(eventId: string, inviteeId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("inv_invitees").delete().eq("id", inviteeId).eq("event_id", eventId);
  revalidatePath(`/admin/events/${eventId}/invitations`);
}

export async function saveInvitationMessage(eventId: string, message: string) {
  await requireStaff();
  const trimmed = message.trim().slice(0, 1000);
  const supabase = await createClient();
  const { error } = await supabase
    .from("inv_events")
    .update({ invitation_message: trimmed || null })
    .eq("id", eventId);
  revalidatePath(`/admin/events/${eventId}/invitations`);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function sendInvitation(eventId: string, inviteeId: string, channel: SendChannel): Promise<InviteActionResult> {
  const staff = await requireStaff();
  const event = await loadEvent(eventId);
  if (!event) return { ok: false, error: "not_found" };
  const supabase = await createClient();
  const { data: invitee } = await supabase
    .from("inv_invitees")
    .select("*")
    .eq("id", inviteeId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!invitee) return { ok: false, error: "not_found" };
  const result = await deliver(event, await messageContext(event), invitee, channel, staff.id);
  revalidatePath(`/admin/events/${eventId}/invitations`);
  return result.ok ? { ok: true, sent: 1, failed: 0, remaining: 0 } : { ok: false, error: result.error };
}

// Sends to invitees who have an address for the channel, have not registered,
// and have no successful send on this channel yet. Call again for the next batch.
export async function sendInvitationsBulk(eventId: string, channel: SendChannel): Promise<InviteActionResult> {
  const staff = await requireStaff();
  const event = await loadEvent(eventId);
  if (!event) return { ok: false, error: "not_found" };
  const supabase = await createClient();

  const [{ data: invitees }, { data: regs }, { data: sentLog }] = await Promise.all([
    supabase.from("inv_invitees").select("*").eq("event_id", eventId).order("created_at"),
    supabase.from("inv_registrations").select("phone, email").eq("event_id", eventId),
    supabase
      .from("inv_invitation_log")
      .select("invitee_id")
      .eq("event_id", eventId)
      .eq("channel", channel)
      .eq("status", "sent"),
  ]);
  const regPhones = new Set((regs ?? []).map((r) => r.phone));
  const regEmails = new Set((regs ?? []).map((r) => r.email?.toLowerCase()).filter(Boolean));
  const alreadySent = new Set((sentLog ?? []).map((l) => l.invitee_id));

  const pending = (invitees ?? []).filter(
    (i) =>
      (channel === "email" ? i.email : i.phone) &&
      !alreadySent.has(i.id) &&
      !(i.phone && regPhones.has(i.phone)) &&
      !(i.email && regEmails.has(i.email.toLowerCase())),
  );
  const batch = pending.slice(0, BULK_LIMIT);
  const ctx = await messageContext(event);

  let sent = 0;
  let failed = 0;
  let lastError: string | undefined;
  for (const invitee of batch) {
    const r = await deliver(event, ctx, invitee, channel, staff.id);
    if (r.ok) sent += 1;
    else {
      failed += 1;
      lastError = r.error;
    }
  }
  revalidatePath(`/admin/events/${eventId}/invitations`);
  return { ok: true, sent, failed, remaining: pending.length - batch.length, lastError };
}

// WhatsApp is manual: the staff member's own WhatsApp opens with the text,
// and they press send. We only record that the link was opened.
export async function logWhatsappOpened(eventId: string, inviteeId: string) {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: invitee } = await supabase
    .from("inv_invitees")
    .select("id, phone")
    .eq("id", inviteeId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!invitee?.phone) return;
  await supabase.from("inv_invitation_log").insert({
    event_id: eventId,
    invitee_id: invitee.id,
    channel: "whatsapp",
    to_address: invitee.phone,
    status: "sent",
    error: null,
    provider_id: null,
    sent_by: staff.id,
  });
  revalidatePath(`/admin/events/${eventId}/invitations`);
}
