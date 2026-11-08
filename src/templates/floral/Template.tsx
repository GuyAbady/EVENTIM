import { Frank_Ruhl_Libre } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

const serif = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["400", "500", "700"], display: "swap" });

function Petals({ color, className }: { color: string; className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={className} fill="none">
      <g fill={color} opacity="0.55">
        <ellipse cx="40" cy="40" rx="26" ry="14" transform="rotate(-30 40 40)" />
        <ellipse cx="78" cy="30" rx="24" ry="12" transform="rotate(20 78 30)" />
        <ellipse cx="30" cy="80" rx="22" ry="11" transform="rotate(60 30 80)" />
        <circle cx="52" cy="52" r="9" />
        <ellipse cx="120" cy="60" rx="18" ry="9" transform="rotate(-50 120 60)" />
        <ellipse cx="60" cy="120" rx="18" ry="9" transform="rotate(40 60 120)" />
      </g>
      <path d="M52 52 C 90 70, 110 110, 150 150" stroke={color} strokeWidth="2" opacity="0.5" />
      <path d="M52 52 C 60 90, 40 130, 20 170" stroke={color} strokeWidth="2" opacity="0.4" />
    </svg>
  );
}

// Floral: blush paper, serif, petals in the corners, rounded photo.
export default async function FloralTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#c4506b";

  return (
    <div className={`${serif.className} relative min-h-full overflow-hidden bg-[#fff5f6] text-[#4a2b33]`}>
      <Petals color={accent} className="pointer-events-none absolute -start-16 -top-16 w-48 sm:-start-8 sm:-top-8 sm:w-72" />
      <Petals color={accent} className="pointer-events-none absolute -bottom-16 -end-16 w-48 rotate-180 sm:-bottom-10 sm:-end-10 sm:w-72" />
      <div className="relative mx-auto flex w-full max-w-xl flex-col gap-10 px-4 py-14 sm:py-20">
        <header className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm" style={{ color: accent }}>{t("youAreInvited")}</p>
          <h1 className="text-balance text-4xl font-medium leading-tight sm:text-5xl">{event.title}</h1>
          {event.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.media_url} alt="" className="aspect-square w-64 rounded-full object-cover shadow-lg ring-8 ring-white sm:w-80" />
          )}
          {event.description && <p className="whitespace-pre-line text-lg leading-relaxed opacity-85">{event.description}</p>}
        </header>
        <section className="flex flex-col items-center gap-3 text-center text-lg">
          <DateLine event={event} locale={locale} />
          <VenueLine event={event} className="opacity-85" />
          <Countdown dateTime={event.date_time} className="mt-2" />
          <ActionLinks event={event} links={links} className="mt-2" pillClass="border-[#4a2b33]/15 bg-white/70" />
        </section>
        <section className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1" style={{ ["--tw-ring-color" as string]: `${accent}44` }}>
          {rsvp}
        </section>
      </div>
    </div>
  );
}
