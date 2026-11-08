import type { PublicEvent } from "./public-event";

const DEFAULT_DURATION_MS = 4 * 60 * 60 * 1000;

function toIcsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function eventLocation(event: Pick<PublicEvent, "venue_name" | "address">): string {
  return [event.venue_name, event.address].filter(Boolean).join(", ");
}

export function buildIcs(event: PublicEvent, url: string): string {
  const start = toIcsUtc(event.date_time);
  const end = toIcsUtc(new Date(new Date(event.date_time).getTime() + DEFAULT_DURATION_MS).toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//invitation-system//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@invitation-system`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}\\n${escapeIcs(url)}` : `DESCRIPTION:${escapeIcs(url)}`,
    eventLocation(event) ? `LOCATION:${escapeIcs(eventLocation(event))}` : null,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}

export function googleCalendarUrl(event: PublicEvent, url: string): string {
  const start = toIcsUtc(event.date_time);
  const end = toIcsUtc(new Date(new Date(event.date_time).getTime() + DEFAULT_DURATION_MS).toISOString());
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: [event.description, url].filter(Boolean).join("\n\n"),
    location: eventLocation(event),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function wazeUrl(event: PublicEvent): string | null {
  if (event.lat != null && event.lng != null) return `https://waze.com/ul?ll=${event.lat},${event.lng}&navigate=yes`;
  const q = eventLocation(event);
  return q ? `https://waze.com/ul?q=${encodeURIComponent(q)}&navigate=yes` : null;
}

export function googleMapsUrl(event: PublicEvent): string | null {
  if (event.lat != null && event.lng != null)
    return `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`;
  const q = eventLocation(event);
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : null;
}
