import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

// Midnight: dark ground, full-bleed media behind the title, glowing accent.
export default async function MidnightTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#8b9cff";

  return (
    <div className="min-h-full bg-[#0f1222] text-[#f3f4ff]">
      <header className={`relative flex items-end overflow-hidden ${event.media_url ? "min-h-[70svh]" : "min-h-[40svh]"}`}>
        {event.media_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.media_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(80% 60% at 50% 20%, ${accent}33, transparent 70%)` }}
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1222] via-[#0f1222]/60 to-transparent" aria-hidden />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-5 pb-12 pt-24 text-center">
          <p className={`text-sm uppercase ${locale === "he" ? "tracking-[0.12em]" : "tracking-[0.35em]"}`} style={{ color: accent }}>{t("youAreInvited")}</p>
          <h1 className="text-balance text-5xl font-semibold leading-tight sm:text-6xl" style={{ textShadow: `0 0 40px ${accent}66` }}>
            {event.title}
          </h1>
          {event.description && <p className="max-w-prose whitespace-pre-line text-lg leading-relaxed text-[#f3f4ff]/80">{event.description}</p>}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 pb-16">
        <section className="flex flex-col items-center gap-3 text-center text-lg">
          <DateLine event={event} locale={locale} />
          <VenueLine event={event} className="text-[#f3f4ff]/75" />
          <Countdown dateTime={event.date_time} className="mt-4" />
          <ActionLinks event={event} links={links} className="mt-2" pillClass="border-[#f3f4ff]/20 bg-[#f3f4ff]/5" />
        </section>

        <section className="rounded-2xl border border-[#f3f4ff]/10 bg-[#f3f4ff]/5 p-6 backdrop-blur">{rsvp}</section>
      </div>
    </div>
  );
}
