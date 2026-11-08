import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EventForm } from "@/components/EventForm";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateEvent } from "../../actions";

export async function generateMetadata() {
  const t = await getTranslations("eventForm");
  return { title: t("editTitle") };
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const t = await getTranslations("eventForm");
  const supabase = await createClient();
  const { data: event } = await supabase.from("inv_events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  const action = updateEvent.bind(null, id);
  return (
    <>
      <h1 className="text-2xl font-semibold">{t("editTitle")}</h1>
      <EventForm mode="edit" action={action} cancelHref={`/admin/events/${id}`} initial={event} />
    </>
  );
}
