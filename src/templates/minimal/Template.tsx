import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

// Minimal: white, large sans type, start-aligned, generous whitespace.
export default async function MinimalTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#111111";

  return (
    <div className="min-h-full bg-white text-[#111]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-5 py-12 sm:py-20">
        <header className="flex flex-col gap-6">
          <p className="text-sm font-medium tracking-wide" style={{ color: accent }}>{t("youAreInvited")}</p>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">{event.title}</h1>
          {event.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.media_url} alt="" className="aspect-[16/9] w-full object-cover" />
          )}
          {event.description && <p className="max-w-prose whitespace-pre-line text-lg leading-relaxed text-[#444]">{event.description}</p>}
        </header>

        <section className="grid gap-6 border-t border-[#111]/10 pt-8 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest text-[#888]">{t("when")}</span>
            <DateLine event={event} locale={locale} className="text-lg" />
          </div>
          {(event.venue_name || event.address) && (
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-[#888]">{t("where")}</span>
              <VenueLine event={event} className="text-lg" />
            </div>
          )}
        </section>

        <Countdown dateTime={event.date_time} />
        <ActionLinks event={event} links={links} className="justify-start" pillClass="border-[#111]/15" />

        <section className="border-t border-[#111]/10 pt-8">{rsvp}</section>
      </div>
    </div>
  );
}
