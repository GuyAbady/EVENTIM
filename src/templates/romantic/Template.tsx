import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

// Romantic: blush and mauve, light serif, arched photo, soft dividers.
export default async function RomanticTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#9a6b7a";

  return (
    <div className={`min-h-full bg-[#fbf6f3] text-[#3d2c2e]`}>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10 px-4 py-14 sm:py-20">
        <header className="flex flex-col items-center gap-6 text-center">
          {event.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.media_url} alt="" className="aspect-[3/4] w-64 object-cover shadow-md sm:w-72" style={{ borderRadius: "999px 999px 16px 16px" }} />
          )}
          <p className="text-sm tracking-wide" style={{ color: accent }}>{t("youAreInvited")}</p>
          <h1 className="text-balance text-4xl font-light leading-tight sm:text-5xl">{event.title}</h1>
          <Divider color={accent} />
          {event.description && <p className="whitespace-pre-line text-lg leading-relaxed opacity-85">{event.description}</p>}
        </header>
        <section className="flex flex-col items-center gap-3 text-center text-lg">
          <DateLine event={event} locale={locale} />
          <VenueLine event={event} className="opacity-80" />
          <Countdown dateTime={event.date_time} className="mt-2" />
          <ActionLinks event={event} links={links} className="mt-2" pillClass="border-[#3d2c2e]/15 bg-white/70" />
        </section>
        <Divider color={accent} />
        <section className="rounded-2xl bg-white/80 p-6">{rsvp}</section>
      </div>
    </div>
  );
}

function Divider({ color }: { color: string }) {
  return (
    <svg aria-hidden width="160" height="16" viewBox="0 0 160 16" className="mx-auto">
      <path d="M0 8 H66" stroke={color} strokeWidth="1" opacity="0.6" />
      <path d="M80 13 C74 9 72 5 76 3 C78 2 80 4 80 5 C80 4 82 2 84 3 C88 5 86 9 80 13 Z" fill={color} />
      <path d="M94 8 H160" stroke={color} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
