import { getTranslations } from "next-intl/server";
import { EventForm } from "@/components/EventForm";
import { generateSlug } from "@/lib/events/slug";
import { requireStaff } from "@/lib/auth";
import { createEvent } from "../actions";

export async function generateMetadata() {
  const t = await getTranslations("eventForm");
  return { title: t("createTitle") };
}

export default async function NewEventPage() {
  await requireStaff();
  const t = await getTranslations("eventForm");
  return (
    <>
      <h1 className="text-2xl font-semibold">{t("createTitle")}</h1>
      <EventForm mode="create" action={createEvent} cancelHref="/admin" initial={{ slug: generateSlug() }} />
    </>
  );
}
