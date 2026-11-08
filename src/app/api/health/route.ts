import { createClient } from "@/lib/supabase/server";
import { createTransport, hasEmailEnv } from "@/lib/email/transport";
import { getSiteUrl } from "@/lib/site";
import { hasSmsEnv } from "@/lib/sms/send";

export const dynamic = "force-dynamic";

type Check = "ok" | "missing" | "error";

// Reports configuration status without exposing any secret values.
export async function GET() {
  const result: Record<string, Check | string | boolean> = {
    siteUrl: getSiteUrl(),
    supabaseSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
    cronSecret: Boolean(process.env.CRON_SECRET),
    sms: hasSmsEnv() ? "configured" : "missing",
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.rpc("inv_public_event", { p_slug: "__health__" });
      result.supabase = error ? "error" : "ok";
      if (error) result.supabaseError = error.message;
    } catch (e) {
      result.supabase = "error";
      result.supabaseError = e instanceof Error ? e.message : String(e);
    }
  } else {
    result.supabase = "missing";
  }

  if (hasEmailEnv()) {
    try {
      await createTransport().verify();
      result.email = "ok";
    } catch (e) {
      result.email = "error";
      result.emailError = e instanceof Error ? e.message : String(e);
    }
  } else {
    result.email = "missing";
  }

  const healthy = result.supabase === "ok" && result.email === "ok";
  return Response.json(result, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
