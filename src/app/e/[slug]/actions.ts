"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { parseRegistration, type RegistrationErrors } from "@/lib/registration/schema";
import { rateLimit } from "@/lib/rate-limit";

export type RegisterState = {
  status: "idle" | "success";
  created?: boolean;
  name?: string;
  guestCount?: number;
  errors?: RegistrationErrors;
  raw?: Record<string, string>;
};

const RATE_LIMIT = { attempts: 8, windowMs: 10 * 60 * 1000 };

function rawValues(formData: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  }
  return out;
}

export async function registerGuest(slug: string, _prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = rawValues(formData);

  // Honeypot: real users never fill this hidden field.
  if (formData.get("website")) return { status: "success", created: true, name: raw.full_name, guestCount: 1 };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`register:${ip}`, RATE_LIMIT.attempts, RATE_LIMIT.windowMs)) {
    return { status: "idle", errors: { form: "rateLimited" }, raw };
  }

  const { values, errors } = parseRegistration(formData);
  if (!values) return { status: "idle", errors: errors ?? {}, raw };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inv_register", {
    p_slug: slug,
    p_full_name: values.full_name,
    p_phone: values.phone,
    p_email: values.email,
    p_guest_count: values.guest_count,
    p_guest_names: values.guest_names,
    p_notes: values.notes,
  });

  if (error) {
    const code = error.message.includes("closed")
      ? "closed"
      : error.message.includes("full")
        ? "full"
        : error.message.includes("not_found")
          ? "closed"
          : "generic";
    return { status: "idle", errors: { form: code }, raw };
  }

  const result = data as { id: string; created: boolean };
  return { status: "success", created: result.created, name: values.full_name, guestCount: values.guest_count };
}
