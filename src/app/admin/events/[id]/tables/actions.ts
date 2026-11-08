"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type TableActionResult = { ok: true } | { ok: false; error: "nameRequired" | "capacityInvalid" | "saveFailed" };

const tableSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(60, "nameRequired"),
  capacity: z.coerce.number().int().min(1, "capacityInvalid").max(500, "capacityInvalid"),
});

function parse(input: { name: string; capacity: number | string }) {
  const r = tableSchema.safeParse(input);
  if (r.success) return { values: r.data, error: null };
  const msg = r.error.issues[0]?.message;
  return { values: null, error: (msg === "capacityInvalid" ? "capacityInvalid" : "nameRequired") as "nameRequired" | "capacityInvalid" };
}

export async function createTable(eventId: string, input: { name: string; capacity: number | string }): Promise<TableActionResult> {
  await requireStaff();
  const { values, error } = parse(input);
  if (!values) return { ok: false, error };
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("inv_tables")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error: dbError } = await supabase.from("inv_tables").insert({
    event_id: eventId,
    name: values.name,
    capacity: values.capacity,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (dbError) return { ok: false, error: "saveFailed" };
  revalidatePath(`/admin/events/${eventId}/tables`);
  return { ok: true };
}

export async function createTablesBulk(eventId: string, count: number, capacity: number, prefix: string): Promise<TableActionResult> {
  await requireStaff();
  const n = Math.max(1, Math.min(50, Math.floor(count)));
  const cap = Math.max(1, Math.min(500, Math.floor(capacity)));
  const supabase = await createClient();
  const { data: existing } = await supabase.from("inv_tables").select("sort_order").eq("event_id", eventId);
  const start = Math.max(0, ...(existing ?? []).map((t) => t.sort_order)) + 1;
  const rows = Array.from({ length: n }, (_, i) => ({
    event_id: eventId,
    name: `${prefix} ${start + i}`,
    capacity: cap,
    sort_order: start + i,
  }));
  const { error } = await supabase.from("inv_tables").insert(rows);
  if (error) return { ok: false, error: "saveFailed" };
  revalidatePath(`/admin/events/${eventId}/tables`);
  return { ok: true };
}

export async function updateTable(eventId: string, tableId: string, input: { name: string; capacity: number | string }): Promise<TableActionResult> {
  await requireStaff();
  const { values, error } = parse(input);
  if (!values) return { ok: false, error };
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("inv_tables")
    .update({ name: values.name, capacity: values.capacity })
    .eq("id", tableId)
    .eq("event_id", eventId);
  if (dbError) return { ok: false, error: "saveFailed" };
  revalidatePath(`/admin/events/${eventId}/tables`);
  return { ok: true };
}

export async function deleteTable(eventId: string, tableId: string): Promise<TableActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("inv_tables").delete().eq("id", tableId).eq("event_id", eventId);
  if (error) return { ok: false, error: "saveFailed" };
  revalidatePath(`/admin/events/${eventId}/tables`);
  return { ok: true };
}

export async function assignTable(eventId: string, registrationId: string, tableId: string | null): Promise<TableActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("inv_registrations")
    .update({ table_id: tableId })
    .eq("id", registrationId)
    .eq("event_id", eventId);
  if (error) return { ok: false, error: "saveFailed" };
  revalidatePath(`/admin/events/${eventId}/tables`);
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}
