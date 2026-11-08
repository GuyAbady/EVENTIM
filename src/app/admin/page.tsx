import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonLinkClass } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatEventTime } from "@/lib/dates";
import { requireStaff } from "@/lib/auth";

type EventListRow = {
  id: string;
  title: string;
  date_time: string;
  event_type: "private" | "business";
  is_active: boolean;
  venue_name: string | null;
  inv_registrations: { guest_count: number; status: string }[];
};

export default async function AdminEventsPage() {
  await requireStaff();
  const t = await getTranslations();
  const locale = await getLocale();
  const supabase = await createClient();

  const { data } = await supabase
    .from("inv_events")
    .select("id, title, date_time, event_type, is_active, venue_name, inv_registrations(guest_count, status)")
    .order("date_time", { ascending: true });
  const events = (data ?? []) as EventListRow[];
  const { upcoming, past } = splitByNow(events);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("admin.eventsTitle")}</h1>
        <Link href="/admin/events/new" className={buttonLinkClass("primary")}>
          {t("admin.newEvent")}
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted">
          {t("admin.noEvents")}
        </p>
      ) : (
        <>
          <EventGroup title={t("admin.upcoming")} events={upcoming} locale={locale} />
          {past.length > 0 && <EventGroup title={t("admin.past")} events={past} locale={locale} />}
        </>
      )}
    </>
  );
}

function splitByNow(events: EventListRow[]) {
  const now = Date.now();
  return {
    upcoming: events.filter((e) => new Date(e.date_time).getTime() >= now),
    past: events.filter((e) => new Date(e.date_time).getTime() < now).reverse(),
  };
}

async function EventGroup({ title, events, locale }: { title: string; events: EventListRow[]; locale: string }) {
  const t = await getTranslations();
  if (events.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">{title}</h2>
      <ul className="flex flex-col gap-3">
        {events.map((e) => {
          const confirmed = e.inv_registrations.filter((r) => r.status === "confirmed");
          const guests = confirmed.reduce((sum, r) => sum + r.guest_count, 0);
          return (
            <li key={e.id}>
              <Link
                href={`/admin/events/${e.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 transition-colors hover:border-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 font-medium">
                    {e.title}
                    {!e.is_active && (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-muted">
                        {t("admin.inactive")}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted">
                    {formatEventDate(e.date_time, locale)}, <span dir="ltr">{formatEventTime(e.date_time)}</span>
                    {e.venue_name ? ` · ${e.venue_name}` : ""}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-muted sm:text-end">
                  <span>{t("admin.registrations", { count: confirmed.length })}</span>
                  <span>{t("admin.guests", { count: guests })}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
