import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EmailKind } from "@/lib/types/database";
import { createTransport, fromAddress } from "./transport";

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  try {
    const transport = createTransport();
    const info = await transport.sendMail({ from: fromAddress(), to, subject, html, text });
    if ("message" in info && process.env.NODE_ENV !== "production") {
      console.log("[email dry-run]", subject, "->", to);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function logEmail(
  client: SupabaseClient<Database>,
  entry: {
    event_id: string | null;
    registration_id: string | null;
    kind: EmailKind;
    to_email: string;
    subject: string;
    result: SendResult;
    sent_by: string | null;
  },
) {
  await client.from("inv_email_log").insert({
    event_id: entry.event_id,
    registration_id: entry.registration_id,
    kind: entry.kind,
    to_email: entry.to_email,
    subject: entry.subject,
    status: entry.result.ok ? "sent" : "failed",
    error: entry.result.ok ? null : entry.result.error,
    sent_by: entry.sent_by,
  });
}
