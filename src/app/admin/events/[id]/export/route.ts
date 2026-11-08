import ExcelJS from "exceljs";
import { getLocale, getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPhoneForDisplay } from "@/lib/phone";
import { EVENT_TIME_ZONE } from "@/lib/dates";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("registrations");
  const supabase = await createClient();

  const { data: event } = await supabase.from("inv_events").select("title, slug").eq("id", id).maybeSingle();
  if (!event) return new Response("Not found", { status: 404 });

  const [{ data: rows }, { data: tables }] = await Promise.all([
    supabase.from("inv_registrations").select("*").eq("event_id", id).order("created_at", { ascending: true }),
    supabase.from("inv_tables").select("id, name").eq("event_id", id),
  ]);
  const tableName = new Map((tables ?? []).map((tb) => [tb.id, tb.name]));
  const tTables = await getTranslations("tables");

  const wb = new ExcelJS.Workbook();
  wb.creator = "invitation-system";
  const ws = wb.addWorksheet(t("exportSheet"), { views: [{ rightToLeft: locale === "he" }] });
  ws.columns = [
    { header: t("columns.name"), key: "name", width: 24 },
    { header: t("columns.phone"), key: "phone", width: 16 },
    { header: t("columns.email"), key: "email", width: 28 },
    { header: t("columns.guests"), key: "guests", width: 10 },
    { header: t("columns.guestNames"), key: "guestNames", width: 40 },
    { header: t("columns.notes"), key: "notes", width: 40 },
    { header: tTables("exportColumn"), key: "table", width: 16 },
    { header: t("columns.status"), key: "status", width: 12 },
    { header: t("columns.source"), key: "source", width: 14 },
    { header: t("columns.createdAt"), key: "createdAt", width: 20 },
  ];
  ws.getRow(1).font = { bold: true };

  const fmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    timeZone: EVENT_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  });

  for (const r of rows ?? []) {
    ws.addRow({
      name: r.full_name,
      phone: formatPhoneForDisplay(r.phone),
      email: r.email ?? "",
      guests: r.guest_count,
      guestNames: (r.guest_names ?? []).join(", "),
      notes: r.notes ?? "",
      table: r.table_id ? (tableName.get(r.table_id) ?? "") : "",
      status: t(`status.${r.status}`),
      source: t(`source.${r.source}`),
      createdAt: fmt.format(new Date(r.created_at)),
    });
  }
  ws.getColumn("guests").alignment = { horizontal: "center" };

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `${event.slug}-registrations.xlsx`;
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
