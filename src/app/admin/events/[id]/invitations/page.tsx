import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonLinkClass } from "@/components/ui/Button";
import { InvitationsPanel, type InviteeItem } from "@/components/InvitationsPanel";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TIME_ZONE, formatEventDate, formatEventTime } from "@/lib/dates";
import { detectEmailLocale } from "@/lib/email/templates";
import { hasEmailEnv } from "@/lib/email/transport";
import { hasSmsEnv } from "@/lib/sms/send";
import { defaultInvitationMessage } from "@/lib/invitation-message";
import { fillMessage } from "@/lib/invitations";
import { formatPhoneForDisplay, phoneDigits } from "@/lib/phone";
import { getPublicEventUrl } from "@/lib/site";
import type { Channel } from "@/lib/types/database";

export async function generateMetadata() {
  const t = await getTranslations("invitations");
  return { title: t("title") };
}

export default async function InvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const t = await getTranslations("invitations");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: event } = await supabase.from("inv_events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  const [{ data: inviteeRows }, { data: regs }, { data: logRows }] = await Promise.all([
    supabase.from("inv_invitees").select("*").eq("event_id", id).order("created_at"),
    supabase.from("inv_registrations").select("phone, email, status").eq("event_id", id),
    supabase
      .from("inv_invitation_log")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const eventLocale = detectEmailLocale(event.title);
  const defaultMessage = await defaultInvitationMessage(eventLocale);
  const template = event.invitation_message?.trim() || defaultMessage;
  const tReg = await getTranslations({ locale: eventLocale, namespace: "registrations" });
  const link = getPublicEventUrl(event.slug);
  const vars = {
    event: event.title,
    date: formatEventDate(event.date_time, eventLocale),
    time: formatEventTime(event.date_time),
    venue: event.venue_name ? tReg("atVenue", { venue: event.venue_name }) : "",
    link,
  };

  const fmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    timeZone: EVENT_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  });

  // Latest log entry per invitee per channel (rows are newest first).
  const last = new Map<string, Partial<Record<Channel, { at: string; ok: boolean; error: string | null }>>>();
  for (const l of logRows ?? []) {
    if (!l.invitee_id) continue;
    const entry = last.get(l.invitee_id) ?? {};
    if (!entry[l.channel]) entry[l.channel] = { at: fmt.format(new Date(l.created_at)), ok: l.status === "sent", error: l.error };
    last.set(l.invitee_id, entry);
  }

  const regPhones = new Set((regs ?? []).filter((r) => r.status === "confirmed").map((r) => r.phone));
  const regEmails = new Set(
    (regs ?? []).filter((r) => r.status === "confirmed" && r.email).map((r) => r.email!.toLowerCase()),
  );

  const items: InviteeItem[] = (inviteeRows ?? []).map((i) => ({
    id: i.id,
    full_name: i.full_name,
    email: i.email,
    phone: i.phone,
    phoneDisplay: i.phone ? formatPhoneForDisplay(i.phone) : null,
    registered: Boolean((i.phone && regPhones.has(i.phone)) || (i.email && regEmails.has(i.email.toLowerCase()))),
    whatsappUrl: i.phone
      ? `https://wa.me/${phoneDigits(i.phone)}?text=${encodeURIComponent(fillMessage(template, { ...vars, name: i.full_name }))}`
      : null,
    last: last.get(i.id) ?? {},
  }));

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted">{event.title}</p>
        </div>
        <Link href={`/admin/events/${id}`} className={buttonLinkClass("secondary")}>
          {t("backToEvent")}
        </Link>
      </div>
      <InvitationsPanel
        eventId={id}
        invitees={items}
        message={event.invitation_message ?? ""}
        defaultMessage={defaultMessage}
        preview={fillMessage(template, { ...vars, name: t("previewName") })}
        emailConfigured={hasEmailEnv()}
        smsConfigured={hasSmsEnv()}
      />
    </>
  );
}
