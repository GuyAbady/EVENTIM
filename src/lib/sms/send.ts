import "server-only";

// SMS through the Twilio Messages REST API (no SDK, plain fetch).
// Docs: https://www.twilio.com/docs/messaging/api/message-resource#create-a-message-resource
// Swap this file to move to another provider (for example an Israeli SMS gateway).
//
// Env:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN   (required)
//   TWILIO_MESSAGING_SERVICE_SID            (preferred) or
//   TWILIO_FROM                             (a Twilio number in E.164, or an approved alphanumeric sender ID)

export type SmsResult = { ok: true; id: string | null } | { ok: false; error: string };

export function hasSmsEnv() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_FROM),
  );
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!hasSmsEnv()) {
    // Local development without credentials: print instead of sending.
    if (process.env.NODE_ENV !== "production" || process.env.SMS_DRY_RUN === "1") {
      console.log("[sms dry-run]", to, body);
      return { ok: true, id: null };
    }
    return { ok: false, error: "sms_not_configured" };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const params = new URLSearchParams({ To: to, Body: body });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) params.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  else params.set("From", process.env.TWILIO_FROM!);

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    if (!res.ok) return { ok: false, error: data.message ? `${data.code ?? res.status}: ${data.message}` : `http_${res.status}` };
    return { ok: true, id: data.sid ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
