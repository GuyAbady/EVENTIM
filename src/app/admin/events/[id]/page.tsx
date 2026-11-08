import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonLinkClass } from "@/components/ui/Button";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatEventTime } from "@/lib/dates";
import { getPublicEventUrl } from "@/lib/site";
import { getTemplate } from "@/templates/registry";
import { RegistrationsPanel, type RegistrationItem } from "@/components/RegistrationsPanel";
import { RemindersPanel, type EmailLogItem } from "@/components/RemindersPanel";
import { reminderDueAt } from "@/lib/reminders";
import { formatPhoneForDisplay, phoneDigits } from "@/lib/phone";
import { EVENT_TIME_ZONE } from "@/lib/dates";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: event } = await supabase.from("inv_events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  const { data: regRows } = await supabase
    .from("inv_registrations")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false });
  const regs = regRows ?? [];
  const { data: logRows } = await supabase
    .from("inv_email_log")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false })
    .limit(200);
  const emailLog = logRows ?? [];
  const confirmed = regs.filter((r) => r.status === "confirmed");
  const guests = confirmed.reduce((s, r) => s + r.guest_count, 0);
  const withEmail = confirmed.filter((r) => r.email).length;
  const publicUrl = getPublicEventUrl(event.slug);
  const template = getTemplate(event.template_id);

  const tReg = await getTranslations("registrations");
  const dateStr = formatEventDate(event.date_time, locale);
  const timeStr = formatEventTime(event.date_time);
  const venueStr = event.venue_name ? tReg("atVenue", { venue: event.venue_name }) : "";
  const createdFmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    timeZone: EVENT_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  });
  const lastEmailByReg = new Map<string, string>();
  for (const l of emailLog) {
    if (l.registration_id && l.status === "sent" && !lastEmailByReg.has(l.registration_id)) {
      lastEmailByReg.set(l.registration_id, createdFmt.format(new Date(l.created_at)));
    }
  }
  const nameByReg = new Map(regs.map((r) => [r.id, r.full_name]));
  const items: RegistrationItem[] = regs.map((r) => {
    const params = { name: r.full_name, event: event.title, date: dateStr, time: timeStr, venue: venueStr, link: publicUrl };
    return {
      ...r,
      guest_names: Array.isArray(r.guest_names) ? r.guest_names : [],
      phoneDisplay: formatPhoneForDisplay(r.phone),
      createdAtDisplay: createdFmt.format(new Date(r.created_at)),
      whatsappUrl: `https://wa.me/${phoneDigits(r.phone)}?text=${encodeURIComponent(tReg("whatsappMessage", params))}`,
      lastEmailAtDisplay: lastEmailByReg.get(r.id) ?? null,
    };
  });
  const dueAt = reminderDueAt(event);
  const logItems: EmailLogItem[] = emailLog.map((l) => ({
    id: l.id,
    kind: l.kind,
    to_email: l.to_email,
    status: l.status,
    error: l.error,
    createdAtDisplay: createdFmt.format(new Date(l.created_at)),
    recipientName: l.registration_id ? (nameByReg.get(l.registration_id) ?? null) : null,
  }));

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {event.title}
            {!event.is_active && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-normal text-muted">
                {t("admin.inactive")}
              </span>
            )}
          </h1>
          <p className="text-muted">
            {formatEventDate(event.date_time, locale)}, <span dir="ltr">{formatEventTime(event.date_time)}</span>
            {event.venue_name ? ` · ${event.venue_name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/events/${id}/tables`} className={buttonLinkClass("secondary")}>
            {t("tables.link")}
          </Link>
          <Link href={`/admin/events/${id}/edit`} className={buttonLinkClass("secondary")}>
            {t("admin.editEvent")}
          </Link>
          <DeleteEventButton id={id} title={event.title} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={tReg("stats.registrations")} value={confirmed.length} />
        <Stat label={tReg("stats.guests")} value={guests} />
        <Stat label={tReg("stats.withEmail")} value={withEmail} />
        <Stat label={t("eventForm.template")} value={t(`templates.names.${template.nameKey}` as never)} />
      </section>

      <RegistrationsPanel eventId={id} rows={items} />

      <RemindersPanel
        eventId={id}
        offsetHours={event.reminder_offset_hours}
        dueAtDisplay={dueAt ? createdFmt.format(dueAt) : null}
        sentAtDisplay={event.reminder_sent_at ? createdFmt.format(new Date(event.reminder_sent_at)) : null}
        recipientsWithEmail={withEmail}
        log={logItems}
      />

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
        <h2 className="font-semibold">{t("admin.publicLink")}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code dir="ltr" className="flex-1 overflow-x-auto rounded-lg bg-stone-50 px-3 py-2 text-sm">
            {publicUrl}
          </code>
          <div className="flex gap-2">
            <CopyLinkButton url={publicUrl} />
            <a href={publicUrl} target="_blank" rel="noreferrer" className={buttonLinkClass("secondary")}>
              {t("admin.openPublicPage")}
            </a>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
        <h2 className="font-semibold">{t("admin.details")}</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <Row label={t("eventForm.eventType")} value={t(event.event_type === "private" ? "eventForm.typePrivate" : "eventForm.typeBusiness")} />
          {event.address && <Row label={t("eventForm.address")} value={event.address} />}
          {event.description && <Row label={t("eventForm.description")} value={event.description} />}
          {event.gift_link_url && <Row label={t("eventForm.giftLink")} value={<a dir="ltr" className="text-accent underline" href={event.gift_link_url}>{event.gift_link_url}</a>} />}
          <Row label={t("eventForm.reminderOffset")} value={t("eventForm.reminderHours", { count: event.reminder_offset_hours })} />
          {event.rsvp_deadline && <Row label={t("eventForm.rsvpDeadline")} value={<>{formatEventDate(event.rsvp_deadline, locale)}, <span dir="ltr">{formatEventTime(event.rsvp_deadline)}</span></>} />}
          {event.max_guests && <Row label={t("eventForm.maxGuests")} value={event.max_guests} />}
        </dl>
        {event.media_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.media_url} alt="" className="mt-2 max-h-56 w-auto rounded-lg border border-border" />
        )}
      </section>

    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="whitespace-pre-line">{value}</dd>
    </>
  );
}
