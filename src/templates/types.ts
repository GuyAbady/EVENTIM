import type { ReactNode } from "react";
import type { PublicEvent } from "@/lib/public-event";

export type TemplateProps = {
  event: PublicEvent;
  locale: string;
  /** Links computed on the server (navigation, calendar). */
  links: {
    waze: string | null;
    googleMaps: string | null;
    googleCalendar: string;
    ics: string;
  };
  /** The RSVP block (form, thank-you, or closed message). */
  rsvp: ReactNode;
};
