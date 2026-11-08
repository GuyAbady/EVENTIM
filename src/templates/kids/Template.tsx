import { Rubik } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

const rubik = Rubik({ subsets: ["hebrew", "latin"], weight: ["400", "600", "800"], display: "swap" });

const DOTS = ["#ff7a59", "#ffd166", "#06d6a0", "#118ab2", "#ef476f", "#8338ec"];

// Kids: sunny background, confetti dots, chunky rounded shapes.
export default async function KidsTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#ff7a59";

  return (
    <div className={`${rubik.className} relative min-h-full overflow-hidden bg-[#fff9e6] text-[#2a2a2a]`}>
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-70">
        {Array.from({ length: 36 }, (_, i) => (
          <circle key={i} cx={`${(i * 37) % 100}%`} cy={`${(i * 53) % 100}%`} r={4 + (i % 4) * 2} fill={DOTS[i % DOTS.length]} />
        ))}
      </svg>
      <div className="relative mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-12 sm:py-16">
        <header className="flex flex-col items-center gap-4 text-center">
          <span className="rounded-full px-4 py-1 text-sm font-semibold text-white" style={{ background: accent }}>{t("youAreInvited")}</span>
          <h1 className="text-balance text-5xl font-extrabold leading-tight sm:text-6xl" style={{ color: accent, textShadow: "3px 3px 0 #fff" }}>
            {event.title}
          </h1>
          {event.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.media_url} alt="" className="aspect-[4/3] w-full rotate-[-2deg] rounded-3xl border-8 border-white object-cover shadow-xl" />
          )}
          {event.description && <p className="whitespace-pre-line text-lg font-medium leading-relaxed">{event.description}</p>}
        </header>
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center text-lg shadow-md">
          <DateLine event={event} locale={locale} className="font-semibold" />
          <VenueLine event={event} className="opacity-80" />
          <Countdown dateTime={event.date_time} className="mt-2" />
          <ActionLinks event={event} links={links} className="mt-2" pillClass="border-transparent bg-[#fff9e6] font-semibold" />
        </section>
        <section className="rounded-3xl border-4 border-dashed bg-white p-6" style={{ borderColor: accent }}>{rsvp}</section>
      </div>
    </div>
  );
}
