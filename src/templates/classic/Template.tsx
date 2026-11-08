import { Frank_Ruhl_Libre } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

const serif = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["400", "500", "700"], display: "swap" });

// Classic: cream paper, serif, centred card with a thin gold rule.
export default async function ClassicTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#b08d57";

  return (
    <div className={`${serif.className} min-h-full bg-[#f6f1e7] text-[#2b2420]`} style={{ ["--tpl-accent" as string]: accent }}>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10 px-4 py-10 sm:py-16">
        <header className="flex flex-col items-center gap-5 text-center">
          {event.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.media_url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover shadow-md" />
          )}
          <p className={`text-sm uppercase ${locale === "he" ? "tracking-[0.12em]" : "tracking-[0.3em]"}`} style={{ color: accent }}>{t("youAreInvited")}</p>
          <h1 className="text-balance text-4xl font-medium leading-tight sm:text-5xl">{event.title}</h1>
          <span className="h-px w-24" style={{ background: accent }} aria-hidden />
          {event.description && <p className="whitespace-pre-line text-lg leading-relaxed opacity-85">{event.description}</p>}
        </header>

        <section className="flex flex-col items-center gap-3 text-center text-lg">
          <DateLine event={event} locale={locale} />
          <VenueLine event={event} className="opacity-85" />
          <Countdown dateTime={event.date_time} className="mt-2" />
          <ActionLinks event={event} links={links} className="mt-2" pillClass="border-[#2b2420]/20 bg-white/60" />
        </section>

        <section className="rounded-2xl border bg-white/80 p-6 shadow-sm" style={{ borderColor: `${accent}55` }}>
          {rsvp}
        </section>
      </div>
    </div>
  );
}
