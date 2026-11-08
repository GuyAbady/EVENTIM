import { getTranslations } from "next-intl/server";
import { formatEventDate, formatEventTime } from "@/lib/dates";
import type { TemplateProps } from "../types";

// Shared text blocks and action links. Templates decide layout and colours;
// these keep the content identical across templates.

export async function DateLine({ event, locale, className = "" }: Pick<TemplateProps, "event" | "locale"> & { className?: string }) {
  return (
    <p className={className}>
      {formatEventDate(event.date_time, locale)}
      <span className="mx-2 opacity-50">·</span>
      <span dir="ltr">{formatEventTime(event.date_time)}</span>
    </p>
  );
}

export function VenueLine({ event, className = "" }: Pick<TemplateProps, "event"> & { className?: string }) {
  if (!event.venue_name && !event.address) return null;
  return (
    <p className={className}>
      {event.venue_name && <span className="font-medium">{event.venue_name}</span>}
      {event.venue_name && event.address && <span className="mx-2 opacity-50">·</span>}
      {event.address && <span>{event.address}</span>}
    </p>
  );
}

const pill =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2";

export async function ActionLinks({ event, links, className = "", pillClass = "" }: Pick<TemplateProps, "event" | "links"> & { className?: string; pillClass?: string }) {
  const t = await getTranslations("invite");
  const cls = `${pill} ${pillClass}`;
  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
      {links.waze && (
        <a className={cls} href={links.waze} target="_blank" rel="noreferrer">
          <WazeIcon /> {t("waze")}
        </a>
      )}
      {links.googleMaps && (
        <a className={cls} href={links.googleMaps} target="_blank" rel="noreferrer">
          <PinIcon /> {t("googleMaps")}
        </a>
      )}
      <a className={cls} href={links.googleCalendar} target="_blank" rel="noreferrer">
        <CalendarIcon /> {t("googleCalendar")}
      </a>
      <a className={cls} href={links.ics} download>
        <CalendarIcon /> {t("downloadIcs")}
      </a>
      {event.gift_link_url && (
        <a className={cls} href={event.gift_link_url} target="_blank" rel="noreferrer">
          <GiftIcon /> {t("gift")}
        </a>
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function WazeIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2Z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M5 12v9h14v-9M12 8a3 3 0 1 0-3-3c0 2 3 3 3 3Zm0 0a3 3 0 1 1 3-3c0 2-3 3-3 3Z" />
    </svg>
  );
}
