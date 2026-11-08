import { formatEventDate, formatEventTime } from "@/lib/dates";
import { eventLocation, googleCalendarUrl, googleMapsUrl, wazeUrl } from "@/lib/calendar";
import type { PublicEvent } from "@/lib/public-event";
import type { EventRow } from "@/lib/types/database";

export type EmailLocale = "he" | "en";

type Strings = {
  subject: (event: string) => string;
  greeting: (name: string) => string;
  intro: (event: string) => string;
  when: string;
  where: string;
  guests: (n: number) => string;
  openInvitation: string;
  navigate: string;
  calendar: string;
  gift: string;
  footer: string;
  inviteSubject: (event: string) => string;
  inviteIntro: (event: string) => string;
  inviteButton: string;
  inviteFooter: string;
};

const STRINGS: Record<EmailLocale, Strings> = {
  he: {
    subject: (event) => `תזכורת: ${event}`,
    greeting: (name) => `שלום ${name},`,
    intro: (event) => `תזכורת לאירוע "${event}". נשמח לראותכם!`,
    when: "מתי",
    where: "איפה",
    guests: (n) => (n === 1 ? "נרשמת עבור מגיע אחד" : `נרשמת עבור ${n} מגיעים`),
    openInvitation: "לפרטים ועדכון הגעה",
    navigate: "ניווט ב-Waze",
    calendar: "הוספה ליומן Google",
    gift: "למתנה",
    footer: "קיבלת את המייל הזה כי נרשמת לאירוע דרך דף ההזמנה.",
    inviteSubject: (event) => `הזמנה: ${event}`,
    inviteIntro: (event) => `אנחנו שמחים להזמין אותך לאירוע "${event}".`,
    inviteButton: "לאישור הגעה",
    inviteFooter: "קיבלת את המייל הזה כי מארגני האירוע הוסיפו אותך לרשימת המוזמנים.",
  },
  en: {
    subject: (event) => `Reminder: ${event}`,
    greeting: (name) => `Hi ${name},`,
    intro: (event) => `A reminder for "${event}". We look forward to seeing you!`,
    when: "When",
    where: "Where",
    guests: (n) => (n === 1 ? "You registered 1 guest" : `You registered ${n} guests`),
    openInvitation: "Details and RSVP",
    navigate: "Navigate with Waze",
    calendar: "Add to Google Calendar",
    gift: "Gift",
    footer: "You received this email because you registered through the invitation page.",
    inviteSubject: (event) => `Invitation: ${event}`,
    inviteIntro: (event) => `You are invited to "${event}".`,
    inviteButton: "RSVP",
    inviteFooter: "You received this email because the organizers added you to the guest list.",
  },
};

export function detectEmailLocale(title: string): EmailLocale {
  return /[֐-׿]/.test(title) ? "he" : "en";
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type EventLike = Pick<
  EventRow,
  "title" | "description" | "date_time" | "venue_name" | "address" | "lat" | "lng" | "gift_link_url" | "primary_color" | "media_url"
>;

export type ReminderInput = {
  event: EventLike;
  recipientName: string;
  guestCount: number;
  invitationUrl: string;
  locale: EmailLocale;
  // "invitation" = first contact before registering (stage 7). Default: reminder.
  kind?: "reminder" | "invitation";
  // Custom opening paragraph written by the business (invitations only).
  message?: string | null;
};

export function buildReminderEmail({ event, recipientName, guestCount, invitationUrl, locale, kind = "reminder", message }: ReminderInput) {
  const base = STRINGS[locale];
  const isInvite = kind === "invitation";
  const s: Strings = isInvite
    ? {
        ...base,
        subject: base.inviteSubject,
        intro: (title) => message?.trim() || base.inviteIntro(title),
        openInvitation: base.inviteButton,
        footer: base.inviteFooter,
      }
    : base;
  const dir = locale === "he" ? "rtl" : "ltr";
  const align = locale === "he" ? "right" : "left";
  const labelPad = locale === "he" ? "2px 0 2px 12px" : "2px 12px 2px 0";
  const accent = event.primary_color ?? "#0f766e";
  const when = `${formatEventDate(event.date_time, locale)}, ${formatEventTime(event.date_time)}`;
  const where = eventLocation(event);
  const pe = event as unknown as PublicEvent;
  const waze = wazeUrl(pe) ?? googleMapsUrl(pe);
  const calendar = googleCalendarUrl(pe, invitationUrl);
  const subject = s.subject(event.title);

  const button = (href: string, label: string, primary = false) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;margin:4px;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;${
      primary ? `background:${accent};color:#ffffff;` : `background:#f3f4f6;color:#111827;border:1px solid #e5e7eb;`
    }">${escapeHtml(label)}</a>`;

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>${escapeHtml(subject)}</title>
</head>
<body dir="${dir}" style="margin:0;padding:0;background:#f6f6f4;font-family:Heebo,Arial,Helvetica,sans-serif;color:#1c1917;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="${dir}" style="background:#f6f6f4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="${dir}" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
${event.media_url ? `<tr><td><img src="${escapeHtml(event.media_url)}" alt="" width="560" style="display:block;width:100%;height:auto;"></td></tr>` : ""}
<tr><td style="padding:28px 28px 8px;text-align:${align};" dir="${dir}">
  <div style="height:4px;width:48px;background:${accent};border-radius:2px;margin-bottom:16px;"></div>
  <p style="margin:0 0 8px;font-size:16px;">${escapeHtml(s.greeting(recipientName))}</p>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.6;white-space:pre-line;">${escapeHtml(s.intro(event.title))}</p>
  <h1 style="margin:0 0 16px;font-size:26px;line-height:1.3;">${escapeHtml(event.title)}</h1>
</td></tr>
<tr><td style="padding:0 28px;" dir="${dir}">
  <table role="presentation" cellspacing="0" cellpadding="0" dir="${dir}" style="font-size:15px;line-height:1.6;">
    <tr><td style="color:#78716c;padding:${labelPad};" align="${align}">${s.when}</td><td align="${align}">${escapeHtml(when)}</td></tr>
    ${where ? `<tr><td style="color:#78716c;padding:${labelPad};" align="${align}">${s.where}</td><td align="${align}">${escapeHtml(where)}</td></tr>` : ""}
    ${isInvite ? "" : `<tr><td colspan="2" align="${align}" style="color:#78716c;padding-top:6px;">${escapeHtml(s.guests(guestCount))}</td></tr>`}
  </table>
</td></tr>
<tr><td style="padding:20px 24px 8px;" align="center">
  ${button(invitationUrl, s.openInvitation, true)}
  ${waze ? button(waze, s.navigate) : ""}
  ${button(calendar, s.calendar)}
  ${event.gift_link_url ? button(event.gift_link_url, s.gift) : ""}
</td></tr>
<tr><td style="padding:16px 28px 28px;font-size:12px;color:#a8a29e;text-align:${align};" dir="${dir}">${escapeHtml(s.footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    s.greeting(recipientName),
    "",
    s.intro(event.title),
    "",
    `${s.when}: ${when}`,
    where ? `${s.where}: ${where}` : null,
    isInvite ? null : s.guests(guestCount),
    "",
    `${s.openInvitation}: ${invitationUrl}`,
    waze ? `${s.navigate}: ${waze}` : null,
    `${s.calendar}: ${calendar}`,
    event.gift_link_url ? `${s.gift}: ${event.gift_link_url}` : null,
    "",
    s.footer,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return { subject, html, text };
}
