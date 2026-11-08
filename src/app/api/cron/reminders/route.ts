import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runDueReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vercel Cron calls this with "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    return Response.json({ error: "SUPABASE_SECRET_KEY missing" }, { status: 500 });
  }

  const horizon = Number(process.env.REMINDER_RUN_INTERVAL_HOURS ?? 24);
  const results = await runDueReminders(createAdminClient(), { horizonHours: horizon });
  return Response.json({ ranAt: new Date().toISOString(), horizonHours: horizon, events: results });
}
