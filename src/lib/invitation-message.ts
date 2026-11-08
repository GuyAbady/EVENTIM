import "server-only";
import { getTranslations } from "next-intl/server";
import type { EmailLocale } from "@/lib/email/templates";

// The text used when the event has no custom invitation_message.
export async function defaultInvitationMessage(locale: EmailLocale): Promise<string> {
  const t = await getTranslations({ locale, namespace: "invitations" });
  return t.raw("defaultMessage") as string;
}
