import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getPublicEvent, getRsvpStatus } from "@/lib/public-event";
import { googleCalendarUrl, googleMapsUrl, wazeUrl } from "@/lib/calendar";
import { getPublicEventUrl } from "@/lib/site";
import { shareImagePath } from "@/lib/og/url";
import { formatEventDate, formatEventTime } from "@/lib/dates";
import { OG_SIZE } from "@/lib/og/render";
import { getTemplate } from "@/templates/registry";
import { renderTemplate } from "@/templates/components";
import { RegistrationForm } from "./RegistrationForm";
import { LaunchVideo } from "@/components/LaunchVideo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return {};
  const t = await getTranslations("invite");
  const locale = await getLocale();
  const when = `${formatEventDate(event.date_time, locale)}, ${formatEventTime(event.date_time)}`;
  const where = [event.venue_name, event.address].filter(Boolean).join(", ");
  const description = event.description?.trim() || [when, where].filter(Boolean).join(" · ");
  const image = { url: shareImagePath(event.slug, event.updated_at), width: OG_SIZE.width, height: OG_SIZE.height, type: "image/jpeg", alt: event.title };
  return {
    title: { absolute: event.title },
    description,
    openGraph: {
      title: event.title,
      description,
      url: getPublicEventUrl(event.slug),
      type: "website",
      locale: locale === "he" ? "he_IL" : "en_US",
      siteName: t("shareSiteName"),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: event.title, description, images: [image.url] },
  };
}

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const locale = await getLocale();
  const t = await getTranslations("invite.rsvp");
  const url = getPublicEventUrl(event.slug);
  const template = getTemplate(event.template_id);
  const accent = event.primary_color ?? template.palette.accent;

  const status = getRsvpStatus(event);
  const rsvp =
    status === "open" ? (
      <RegistrationForm slug={event.slug} accent={accent} />
    ) : (
      <p className="text-center text-lg" role="status">
        {t(status === "full" ? "closedFull" : status === "event_passed" ? "closedPassed" : "closedDeadline")}
      </p>
    );

  const tv = await getTranslations("invite.video");
  const invitation = renderTemplate(event.template_id, {
    event,
    locale,
    links: {
      waze: wazeUrl(event),
      googleMaps: googleMapsUrl(event),
      googleCalendar: googleCalendarUrl(event, url),
      ics: `/e/${event.slug}/calendar.ics`,
    },
    rsvp,
  });

  if (!event.show_launch_video) return invitation;

  // Below the invitation, after the RSVP: the EVENTIM launch video (per-event switch, off by default).
  return (
    <>
      {invitation}
      <footer className="border-t border-border bg-stone-50 px-4 py-10">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted">{tv("madeWith")}</p>
          <LaunchVideo src="/media/eventim-launch.mp4" poster="/media/eventim-launch.jpg" playLabel={tv("play")} title={tv("title")} />
        </div>
      </footer>
    </>
  );
}
