import { Rubik } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

const rubik = Rubik({ subsets: ["hebrew", "latin"], weight: ["400", "700", "900"], display: "swap" });

const CONFETTI = ["#e63946", "#f4a261", "#2a9d8f", "#e9c46a", "#457b9d"];

// Festive: warm ground, confetti ribbons, loud title, big photo.
export default async function FestiveTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#e63946";

  return (
    <div className={`${rubik.className} relative min-h-full overflow-hidden bg-[#fff4f0] text-[#3b1f1a]`}>
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
        {Array.from({ length: 40 }, (_, i) => (
          <rect
            key={i}
            x={`${(i * 41) % 100}%`}
            y={`${(i * 29) % 100}%`}
            width="10"
            height="4"
            rx="1"
            fill={CONFETTI[i % CONFETTI.length]}
            transform={`rotate(${(i * 47) % 180})`}
            opacity="0.8"
          />
        ))}
      </svg>
      <div className="relative mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-12 sm:py-16">
        <header className="flex flex-col items-center gap-4 text-center">
          <p className="text-base font-bold uppercase tracking-wide" style={{ color: accent }}>{t("youAreInvited")}</p>
          <h1 className="text-balance text-5xl font-black leading-[1.05] sm:text-6xl">{event.title}</h1>
          {event.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.media_url} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg" style={{ border: `6px solid ${accent}` }} />
          )}
          {event.description && <p className="whitespace-pre-line text-lg leading-relaxed">{event.description}</p>}
        </header>
        <section className="flex flex-col items-center gap-3 text-center text-lg">
          <DateLine event={event} locale={locale} className="font-bold" />
          <VenueLine event={event} className="opacity-85" />
          <Countdown dateTime={event.date_time} className="mt-2" />
          <ActionLinks event={event} links={links} className="mt-2" pillClass="border-transparent bg-white font-bold shadow-sm" />
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-md">{rsvp}</section>
      </div>
    </div>
  );
}
