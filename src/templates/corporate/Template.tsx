import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

// Corporate: clean light gray, banner image, blue accent bar, two-column facts.
export default async function CorporateTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#0b63ce";

  return (
    <div className="min-h-full bg-[#f7f9fb] text-[#1a2733]">
      <div className="h-2 w-full" style={{ background: accent }} />
      {event.media_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.media_url} alt="" className="aspect-[21/9] w-full object-cover" />
      )}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: accent }}>{t("youAreInvited")}</p>
          <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">{event.title}</h1>
          {event.description && <p className="max-w-prose whitespace-pre-line text-lg leading-relaxed text-[#1a2733]/75">{event.description}</p>}
        </header>
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#1a2733]/10 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#1a2733]/50">{t("when")}</div>
            <DateLine event={event} locale={locale} className="mt-1 text-lg font-medium" />
          </div>
          {(event.venue_name || event.address) && (
            <div className="rounded-xl border border-[#1a2733]/10 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#1a2733]/50">{t("where")}</div>
              <VenueLine event={event} className="mt-1 text-lg" />
            </div>
          )}
        </section>
        <Countdown dateTime={event.date_time} />
        <ActionLinks event={event} links={links} className="justify-start" pillClass="border-[#1a2733]/15 bg-white" />
        <section className="rounded-xl border border-[#1a2733]/10 bg-white p-6">{rsvp}</section>
      </div>
    </div>
  );
}
