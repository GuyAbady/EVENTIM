import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonLinkClass } from "@/components/ui/Button";
import { SeatingBoard, type SeatGuest, type SeatTable } from "@/components/SeatingBoard";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const t = await getTranslations("tables");
  return { title: t("title") };
}

export default async function TablesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const t = await getTranslations("tables");
  const supabase = await createClient();

  const { data: event } = await supabase.from("inv_events").select("id, title").eq("id", id).maybeSingle();
  if (!event) notFound();

  const [{ data: tableRows }, { data: regRows }] = await Promise.all([
    supabase.from("inv_tables").select("id, name, capacity").eq("event_id", id).order("sort_order"),
    supabase
      .from("inv_registrations")
      .select("id, full_name, guest_count, guest_names, table_id")
      .eq("event_id", id)
      .eq("status", "confirmed")
      .order("created_at"),
  ]);

  const tables: SeatTable[] = tableRows ?? [];
  const guests: SeatGuest[] = (regRows ?? []).map((r) => ({
    id: r.id,
    name: r.full_name,
    guestCount: r.guest_count,
    guestNames: Array.isArray(r.guest_names) ? r.guest_names : [],
    tableId: r.table_id,
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
      <SeatingBoard eventId={id} tables={tables} guests={guests} />
    </>
  );
}
