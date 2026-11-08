export const EVENT_TIME_ZONE = "Asia/Jerusalem";

// Offset (minutes) of `timeZone` at the given instant.
function offsetMinutesAt(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - date.getTime()) / 60000;
}

// "2026-05-12T19:00" typed in a datetime-local input, interpreted in the
// event time zone, to an ISO UTC string.
export function localInputToIso(local: string, timeZone = EVENT_TIME_ZONE): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle DST edges well enough for event scheduling.
  let guess = naive - offsetMinutesAt(new Date(naive), timeZone) * 60000;
  guess = naive - offsetMinutesAt(new Date(guess), timeZone) * 60000;
  return new Date(guess).toISOString();
}

// ISO UTC string to the "YYYY-MM-DDTHH:mm" value a datetime-local input expects.
export function isoToLocalInput(iso: string | null, timeZone = EVENT_TIME_ZONE): string {
  if (!iso) return "";
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function formatEventDate(iso: string, locale: string, timeZone = EVENT_TIME_ZONE) {
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatEventTime(iso: string, timeZone = EVENT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
