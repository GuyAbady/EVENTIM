import { Frank_Ruhl_Libre } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

const serif = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["400", "500", "700"], display: "swap" });

// Gold: black ground, double gold frame, serif, formal.
export default async function GoldTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#d4af37";

  return (
    <div className={`${serif.className} min-h-full bg-[#141210] text-[#f6efe0]`}>
      <div className="mx-auto w-full max-w-xl px-3 py-6 sm:py-12">
        <div className="rounded-sm border p-1.5" style={{ borderColor: accent }}>
          <div className="flex flex-col gap-10 rounded-sm border px-5 py-12 sm:px-10 sm:py-16" style={{ borderColor: `${accent}99` }}>
            <header className="flex flex-col items-center gap-5 text-center">
              <Ornament color={accent} />
              <p className="text-xs uppercase tracking-[0.25em]" style={{ color: accent }}>{t("youAreInvited")}</p>
              <h1 className="text-balance text-4xl font-medium leading-tight sm:text-5xl">{event.title}</h1>
              <Ornament color={accent} flip />
              {event.media_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.media_url} alt="" className="aspect-[4/5] w-full max-w-sm object-cover" style={{ outline: `1px solid ${accent}`, outlineOffset: 6 }} />
              )}
              {event.description && <p className="whitespace-pre-line text-lg leading-relaxed text-[#f6efe0]/80">{event.description}</p>}
            </header>
            <section className="flex flex-col items-center gap-3 text-center text-lg">
              <DateLine event={event} locale={locale} />
              <VenueLine event={event} className="text-[#f6efe0]/75" />
              <Countdown dateTime={event.date_time} className="mt-2" />
              <ActionLinks event={event} links={links} className="mt-2" pillClass="border-[#d4af37]/40 bg-transparent" />
            </section>
            <section className="border-t pt-8" style={{ borderColor: `${accent}55` }}>{rsvp}</section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ornament({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <svg aria-hidden width="140" height="18" viewBox="0 0 140 18" className={flip ? "rotate-180" : ""}>
      <path d="M0 9 H54 M86 9 H140" stroke={color} strokeWidth="1" />
      <path d="M70 1 L78 9 L70 17 L62 9 Z" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="70" cy="9" r="2" fill={color} />
    </svg>
  );
}
