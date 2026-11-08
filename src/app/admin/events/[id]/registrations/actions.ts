"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseStaffRegistration, type StaffRegistrationErrors } from "@/lib/registration/staff-schema";

export type RegistrationFormState = {
  ok?: boolean;
  errors?: StaffRegistrationErrors;
  raw?: Record<string, string>;
};

function rawValues(formData: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  return out;
}

function mapError(error: { code?: string }): StaffRegistrationErrors {
  return error.code === "23505" ? { phone: "phoneTaken" } : { form: "saveFailed" };
}

export async function createRegistration(
  eventId: string,
  _prev: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  await requireStaff();
  const { values, errors } = parseStaffRegistration(formData);
  if (!values) return { errors: errors ?? {}, raw: rawValues(formData) };

  const supabase = await createClient();
  const { error } = await supabase.from("inv_registrations").insert({
    event_id: eventId,
    full_name: values.full_name,
    phone: values.phone,
    email: values.email,
    guest_count: values.guest_count,
    guest_names: values.guest_names,
    notes: values.notes,
    status: values.status,
    source: "manual",
  });
  if (error) return { errors: mapError(error), raw: rawValues(formData) };

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateRegistration(
  eventId: string,
  registrationId: string,
  _prev: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  await requireStaff();
  const { values, errors } = parseStaffRegistration(formData);
  if (!values) return { errors: errors ?? {}, raw: rawValues(formData) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inv_registrations")
    .update({
      full_name: values.full_name,
      phone: values.phone,
      email: values.email,
      guest_count: values.guest_count,
      guest_names: values.guest_names,
      notes: values.notes,
      status: values.status,
    })
    .eq("id", registrationId)
    .eq("event_id", eventId);
  if (error) return { errors: mapError(error), raw: rawValues(formData) };

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function setRegistrationStatus(eventId: string, registrationId: string, status: "confirmed" | "cancelled") {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("inv_registrations")
    .update({ status })
    .eq("id", registrationId)
    .eq("event_id", eventId);
  if (error) throw new Error("updateFailed");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin");
}

export async function deleteRegistration(eventId: string, registrationId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("inv_registrations").delete().eq("id", registrationId).eq("event_id", eventId);
  if (error) throw new Error("deleteFailed");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin");
}
