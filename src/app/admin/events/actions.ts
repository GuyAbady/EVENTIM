"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prewarmShare } from "@/lib/og/prewarm";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { localInputToIso } from "@/lib/dates";
import { parseEventForm, type EventFormErrors, type EventFormValues } from "@/lib/events/schema";
import type { EventInsert } from "@/lib/types/database";

export type EventFormState = { errors: EventFormErrors | null; raw?: Record<string, string> };

const RAW_FIELDS = [
  "title", "slug", "event_type", "description", "date_time_local", "venue_name", "address",
  "lat", "lng", "template_id", "media_url", "primary_color", "gift_link_url",
  "reminder_offset_hours", "rsvp_deadline_local", "max_guests", "is_active",
] as const;

// Forms with a server action reset after submission, so on error we hand the
// submitted values back and the form uses them as defaults.
function rawValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of RAW_FIELDS) out[key] = String(formData.get(key) ?? "");
  return out;
}

function fail(formData: FormData, errors: EventFormErrors): EventFormState {
  return { errors, raw: rawValues(formData) };
}

function toRow(values: EventFormValues, createdBy: string): EventInsert | { errors: EventFormErrors } {
  const date_time = localInputToIso(values.date_time_local);
  if (!date_time) return { errors: { date_time_local: "invalidDate" } };

  let rsvp_deadline: string | null = null;
  if (values.rsvp_deadline_local) {
    rsvp_deadline = localInputToIso(values.rsvp_deadline_local);
    if (!rsvp_deadline) return { errors: { rsvp_deadline_local: "invalidDate" } };
  }

  return {
    title: values.title,
    slug: values.slug,
    event_type: values.event_type,
    description: values.description ?? null,
    date_time,
    venue_name: values.venue_name ?? null,
    address: values.address ?? null,
    lat: values.lat ?? null,
    lng: values.lng ?? null,
    template_id: values.template_id,
    media_url: values.media_url ?? null,
    primary_color: values.primary_color ?? null,
    gift_link_url: values.gift_link_url ?? null,
    reminder_offset_hours: values.reminder_offset_hours,
    rsvp_deadline,
    max_guests: values.max_guests ?? null,
    is_active: values.is_active,
    created_by: createdBy,
  };
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const staff = await requireStaff();
  const { values, errors } = parseEventForm(formData);
  if (!values) return fail(formData, errors);

  const row = toRow(values, staff.id);
  if ("errors" in row) return fail(formData, row.errors);

  const supabase = await createClient();
  const { data, error } = await supabase.from("inv_events").insert(row).select("id, slug, updated_at").single();
  if (error) {
    return fail(formData, isUniqueViolation(error) ? { slug: "slugTaken" } : { form: "saveFailed" });
  }

  after(() => prewarmShare(data.slug, data.updated_at));
  revalidatePath("/admin");
  redirect(`/admin/events/${data.id}`);
}

export async function updateEvent(
  id: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const staff = await requireStaff();
  const { values, errors } = parseEventForm(formData);
  if (!values) return fail(formData, errors);

  const row = toRow(values, staff.id);
  if ("errors" in row) return fail(formData, row.errors);
  const { created_by: _ignored, ...update } = row;
  void _ignored;

  const supabase = await createClient();
  const { data, error } = await supabase.from("inv_events").update(update).eq("id", id).select("slug, updated_at").single();
  if (error) {
    return fail(formData, isUniqueViolation(error) ? { slug: "slugTaken" } : { form: "saveFailed" });
  }

  after(() => prewarmShare(data.slug, data.updated_at));
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${id}`);
  redirect(`/admin/events/${id}`);
}

export async function deleteEvent(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("inv_events").delete().eq("id", id);
  if (error) throw new Error("deleteFailed");
  revalidatePath("/admin");
  redirect("/admin");
}
